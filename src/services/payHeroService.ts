// src/services/payHeroService.ts

import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/auth-helpers-react';

const API_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/hyper-task`;

export interface PaymentStatusResponse {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'canceled' | 'queued';
  error?: string;
  reference?: string;
}

interface PaymentRequest {
  uuid: string;
  amount: number;
  phone_number: string;
  type: 'deposit' | 'withdrawal';
}

interface PaymentResponse {
  success: boolean;
  reference?: string;
  error?: string;
}

export const initiatePayment = async (
  user: User, 
  amount: number, 
  phone: string, 
  type: 'deposit' | 'withdrawal'
): Promise<PaymentResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}?action=process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      uuid: user.id,
      amount: parseFloat(amount.toFixed(2)),
      phone_number: phone,
      type
    } as PaymentRequest)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Payment initiation failed');
  }

  return response.json();
};

export const pollTransactionStatus = async (
  reference: string, 
  onStatusUpdate: (status: PaymentStatusResponse) => void
): Promise<PaymentStatusResponse> => {
  let attempts = 0;
  const maxAttempts = 20; // 2 minutes (3000ms * 20)
  
  while (attempts < maxAttempts) {
    const response = await fetch(`${API_URL}?action=status&reference=${reference}`);
    const result = await response.json() as PaymentStatusResponse;
    
    onStatusUpdate(result);
    
    if (result.status === 'completed' || result.status === 'failed' || result.status === 'canceled') {
      return result;
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  const timeoutStatus: PaymentStatusResponse = {
    success: false,
    status: 'failed',
    error: 'Payment status check timeout'
  };
  
  onStatusUpdate(timeoutStatus);
  throw new Error('Payment status check timeout');
};

export const formatKES = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount);
};