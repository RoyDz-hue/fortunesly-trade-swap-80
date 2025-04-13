import { supabase } from "@/integrations/supabase/client";

// src/services/PayHeroService.ts
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
 * Gets the Supabase auth token from storage
 */
const getAuthToken = (): string => {
  // For browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('supabase.auth.token') || '';
  }
  return '';
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
    
    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error('Authentication token not found');
    }

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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `${type} request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
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

    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}?action=status&reference=${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Status check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Status check error:', error);
    return {
      success: false,
      error: error.message || 'Status check failed'
    };
  }
};