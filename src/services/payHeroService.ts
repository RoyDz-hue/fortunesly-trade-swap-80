import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/auth-helpers-react';

const API_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/hyper-task`;

interface PaymentRequest {
  uuid: string;
  amount: number;
  phone_number: string;
  type: 'deposit' | 'withdrawal';
}

export const initiatePayment = async (user: User, amount: number, phone: string, type: 'deposit' | 'withdrawal') => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(`${API_URL}?action=process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({
      uuid: user.id,
      amount: parseFloat(amount.toFixed(2)),
      phone_number: phone,
      type
    })
  });

  if (!response.ok) throw new Error('Payment initiation failed');
  return response.json();
};

export const pollPaymentStatus = async (reference: string) => {
  let attempts = 0;
  const maxAttempts = 20; // 2 minutes (3000ms * 20)
  
  while (attempts < maxAttempts) {
    const response = await fetch(`${API_URL}?action=status&reference=${reference}`);
    const result = await response.json();
    
    if (result.status === 'completed' || result.status === 'failed') {
      return result;
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  throw new Error('Payment status check timeout');
};

export const formatKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount);
};