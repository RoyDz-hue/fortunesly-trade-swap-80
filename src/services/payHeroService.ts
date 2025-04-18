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

export interface PaymentOptions {
  onStatusUpdate?: PaymentStatusCallback;
  pollingInterval?: number;
  pollingTimeout?: number;
  skipPolling?: boolean;
}

/**
 * Auth token cache to reduce redundant requests
 */
let authTokenCache: { token: string; expiry: number } | null = null;
const AUTH_TOKEN_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Gets the current Supabase session token with caching
 */
const getAuthToken = async (): Promise<string> => {
  // Return cached token if still valid
  const now = Date.now();
  if (authTokenCache && authTokenCache.expiry > now) {
    return authTokenCache.token;
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No active session found');
  }
  
  // Cache the token
  authTokenCache = {
    token: session.access_token,
    expiry: now + AUTH_TOKEN_TTL
  };
  
  return session.access_token;
};

/**
 * Format phone number to ensure it has country code
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // Check if it's a Kenyan number starting with 0
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }

  // If it has 9 digits (without prefix), add the country code
  if (cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }

  // Validate the final format
  if (!cleaned.startsWith('254') || cleaned.length !== 12) {
    throw new Error('Invalid phone number format. Must be a valid Kenyan phone number.');
  }

  return cleaned;
};

/**
 * Make a request to the Edge Function with retries
 */
const makeRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  data?: any,
  retries: number = 2
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
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
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${method} Response (attempt ${attempt + 1}):`, text);
      }

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
    } catch (error: any) {
      lastError = error;
      
      // If we're out of retries, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Unknown error during request');
};

/**
 * Poll for transaction status until it completes or times out
 */
export const pollTransactionStatus = async (
  reference: string,
  options: PaymentOptions = {}
): Promise<PaymentStatusResponse> => {
  const {
    onStatusUpdate,
    pollingInterval = POLLING_INTERVAL,
    pollingTimeout = POLLING_TIMEOUT
  } = options;
  
  const startTime = Date.now();
  let lastStatusHash = '';

  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const status = await checkPaymentStatus(reference);
        
        // Create a hash of the status to detect changes
        const statusHash = JSON.stringify({
          status: status.status,
          provider_status: status.provider_status
        });
        
        // Only notify if status has changed
        if (onStatusUpdate && statusHash !== lastStatusHash) {
          onStatusUpdate(status);
          lastStatusHash = statusHash;
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
        if (Date.now() - startTime > pollingTimeout) {
          return reject(new Error('Transaction status check timed out'));
        }

        // Schedule next check
        setTimeout(checkStatus, pollingInterval);

      } catch (error: any) {
        // If it's a network error, continue polling
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          setTimeout(checkStatus, pollingInterval);
        } else {
          reject(error);
        }
      }
    };

    // Start checking
    checkStatus();
  });
};

/**
 * Handles the complete payment flow including polling
 */
export const handlePayment = async (
  user: User,
  amount: number,
  phoneNumber: string,
  type: PaymentType,
  options: PaymentOptions = {}
): Promise<PaymentStatusResponse> => {
  try {
    // Step 1: Initiate payment
    const payment = await initiatePayment(user, amount, phoneNumber, type);
    
    if (!payment.success || !payment.reference) {
      throw new Error(payment.error || 'Payment initiation failed');
    }
    
    // Get initial status to report
    if (options.onStatusUpdate) {
      options.onStatusUpdate({
        success: true,
        reference: payment.reference,
        status: 'pending',
        type,
        amount
      });
    }
    
    // Step 2: Skip polling if requested
    if (options.skipPolling) {
      return {
        success: true,
        reference: payment.reference,
        status: 'pending',
        type,
        amount
      };
    }
    
    // Step 3: Poll for status updates
    return await pollTransactionStatus(payment.reference, options);
    
  } catch (error: any) {
    console.error('Payment flow error:', error);
    return {
      success: false,
      error: error.message || 'Payment process failed'
    };
  }
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

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be a positive number');
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
      reference,
      status: 'pending', // Assume pending if check fails
      error: error.message || 'Status check failed'
    };
  }
};

/**
 * Get payment history for a user
 * Note: This assumes you have a database function to retrieve payment history
 */
export const getPaymentHistory = async (
  user: User,
  limit: number = 10
): Promise<PaymentStatusResponse[]> => {
  try {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .rpc('get_user_payments', { 
        user_id: user.id,
        results_limit: limit
      });
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Payment history error:', error);
    return [];
  }
};

/**
 * Hook-ready payment handler for React components
 */
export const usePayment = () => {
  return {
    initiatePayment,
    checkPaymentStatus,
    pollTransactionStatus,
    handlePayment,
    getPaymentHistory
  };
};