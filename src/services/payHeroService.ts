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

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/hyper-task';

/**
 * Gets the current Supabase session token
 */
const getAuthToken = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
};

/**
 * Safely parses JSON response
 */
const safeJsonParse = async (response: Response) => {
  try {
    const text = await response.text(); // Get raw response text
    console.log('Raw API Response:', text); // Log raw response for debugging

    if (!text) {
      throw new Error('Empty response received');
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Failed to parse response:', text);
      throw new Error(`Invalid JSON response: ${text}`);
    }
  } catch (error) {
    console.error('Response Reading Error:', error);
    throw new Error('Failed to read response');
  }
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
    
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('Authentication token not found');
    }

    console.log('Initiating payment with payload:', {
      uuid: user.id,
      amount,
      phone_number: phoneNumber,
      type
    });

    const response = await fetch(`${API_URL}?action=process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        uuid: user.id,
        amount,
        phone_number: phoneNumber,
        type
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new Error(errorData.error || `${type} request failed: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    console.log('Parsed response data:', data);

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }

    return {
      success: true,
      ...data
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

    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('Authentication token not found');
    }

    console.log('Checking payment status for reference:', reference);

    const response = await fetch(`${API_URL}?action=status&reference=${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Status check response:', response.status);

    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new Error(errorData.error || `Status check failed: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    console.log('Status check data:', data);

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid status response format');
    }

    return {
      success: true,
      ...data
    };

  } catch (error: any) {
    console.error('Status check error:', error);
    return {
      success: false,
      error: error.message || 'Status check failed'
    };
  }
};