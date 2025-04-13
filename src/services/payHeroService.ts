import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/auth-helpers-react';

export interface PaymentResponse {
  success: boolean;
  reference?: string;
  status?: string;
  message?: string;
  error?: string;
  provider_data?: any;
}

export interface PaymentStatusResponse {
  success: boolean;
  reference?: string;
  type?: string;
  amount?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  provider_reference?: string;
  error?: string;
}

// Get the Supabase URL from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bfsodqqylpfotszjlfuk.supabase.co';
const API_URL = `${SUPABASE_URL}/functions/v1/hyper-task`;

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
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a Kenyan number starting with 0
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Replace the leading 0 with 254
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If it doesn't have country code yet, add it
  if (cleaned.length === 9 && !cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
};

/**
 * Initiates a payment request (deposit or withdrawal)
 */
export const initiatePayment = async (
  user: User,
  amount: number,
  phoneNumber: string,
  type: 'deposit' | 'withdrawal'
): Promise<PaymentResponse> => {
  try {
    // Validate input
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    
    if (!phoneNumber || phoneNumber.length < 9) {
      throw new Error('Invalid phone number');
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const authToken = await getAuthToken();

    console.log('Making request to:', `${API_URL}?action=process`);
    
    const response = await fetch(`${API_URL}?action=process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        uuid: user.id,
        amount: Number(amount),
        phone_number: formattedPhone,
        type
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Request failed: ${response.status} - ${errorText}`);
    }

    const text = await response.text();
    console.log('Raw API Response:', text);

    if (!text) {
      throw new Error('Empty response received from server');
    }

    try {
      const data = JSON.parse(text);
      return {
        success: true,
        ...data
      };
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error(`Invalid JSON response: ${text}`);
    }

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

    const authToken = await getAuthToken();

    const response = await fetch(`${API_URL}?action=status&reference=${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Status Check Error Response:', errorText);
      throw new Error(`Status check failed: ${response.status} - ${errorText}`);
    }

    const text = await response.text();
    console.log('Raw Status Response:', text);

    if (!text) {
      throw new Error('Empty status response received');
    }

    try {
      const data = JSON.parse(text);
      return {
        success: true,
        ...data
      };
    } catch (parseError) {
      console.error('Status JSON Parse Error:', parseError);
      throw new Error(`Invalid status response: ${text}`);
    }

  } catch (error: any) {
    console.error('Status check error:', error);
    return {
      success: false,
      error: error.message || 'Status check failed'
    };
  }
};