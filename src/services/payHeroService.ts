import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/auth-helpers-react';

// Constants
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bfsodqqylpfotszjlfuk.supabase.co';
const API_URL = `${SUPABASE_URL}/functions/v1/hyper-task`;
const POLLING_INTERVAL = 3000; // 3 seconds
const POLLING_TIMEOUT = 120000; // 2 minutes

// Types
export type PaymentType = 'deposit' | 'withdrawal';
export type PaymentStatus = 'pending' | 'queued' | 'completed' | 'failed' | 'canceled';

export interface PaymentResponse {
  success: boolean;
  reference?: string;
  status?: PaymentStatus;
  message?: string;
  error?: string;
  provider_data?: any;
}

export interface PaymentStatusResponse {
  success: boolean;
  reference?: string;
  type?: PaymentType;
  amount?: number;
  status?: PaymentStatus;
  provider_status?: PaymentStatus;
  created_at?: string;
  updated_at?: string;
  provider_reference?: string;
  checkout_id?: string;
  error?: string;
  provider_error?: string;
  provider_data?: any;
}

export interface PaymentStatusCallback {
  (status: PaymentStatusResponse): void;
}

/**
 * Gets the current Supabase session token
 */
const getAuthToken = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No active session found');
  }
  return session.access_token;
};

/**
 * Format phone number to ensure it has country code
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  if (cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }
  
  if (!cleaned.startsWith('254') || cleaned.length !== 12) {
    throw new Error('Invalid phone number format. Must be a valid Kenyan phone number.');
  }
  
  return cleaned;
};

/**
 * Make a request to the Edge Function
 */
const makeRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  data?: any
): Promise<T> => {
  try {
    const authToken = await getAuthToken();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: data ? JSON.stringify(data) : undefined
    });

    const text = await response.text();
    console.log(`${method} Response:`, text);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} - ${text}`);
    }

    if (!text) {
      throw new Error('Empty response received');
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error(`Invalid JSON response: ${text}`);
    }
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
};

/**
 * Poll for transaction status until it completes or times out
 */
export const pollTransactionStatus = async (
  reference: string,
  onStatusUpdate?: PaymentStatusCallback,
  interval: number = POLLING_INTERVAL,
  timeout: number = POLLING_TIMEOUT
): Promise<PaymentStatusResponse> => {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const status = await checkPaymentStatus(reference);
        
        // Notify status update if callback provided
        if (onStatusUpdate) {
          onStatusUpdate(status);
        }
        
        // Check if transaction is complete
        if (
          status.status === 'completed' || 
          status.status === 'failed' || 
          status.status === 'canceled'
        ) {
          return resolve(status);
        }
        
        // Check timeout
        if (Date.now() - startTime > timeout) {
          return reject(new Error('Transaction status check timed out'));
        }
        
        // Schedule next check
        setTimeout(checkStatus, interval);
        
      } catch (error) {
        reject(error);
      }
    };
    
    // Start checking
    checkStatus();
  });
};

/**
 * Initiates a payment request (deposit or withdrawal)
 */
export const initiatePayment = async (
  user: User,
  amount: number,
  phoneNumber: string,
  type: PaymentType
): Promise<PaymentResponse> => {
  try {
    // Validate input
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    
    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await makeRequest<PaymentResponse>(
      '?action=process',
      'POST',
      {
        uuid: user.id,
        amount: Number(amount),
        phone_number: formattedPhone,
        type
      }
    );

    return {
      success: true,
      ...response
    };

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return {
      success: false,
      error: error.message || 'Payment request failed'
    };
  }
};

/**
 * Checks the status of a payment
 */
export const checkPaymentStatus = async (
  reference: string
): Promise<PaymentStatusResponse> => {
  try {
    if (!reference) {
      throw new Error('Payment reference is required');
    }

    const response = await makeRequest<PaymentStatusResponse>(
      `?action=status&reference=${encodeURIComponent(reference)}`
    );

    return {
      success: true,
      ...response
    };

  } catch (error: any) {
    console.error('Status check error:', error);
    return {
      success: false,
      error: error.message || 'Status check failed'
    };
  }
};