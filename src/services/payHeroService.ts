// src/services/payHeroService.ts
import { supabase } from '@/lib/supabaseClient';

interface PaymentRequest {
  amount: number;
  phoneNumber: string;
  type: 'deposit' | 'withdrawal';
  customerName?: string;
}

// The URL for the hyper-task Supabase function
const HYPER_TASK_URL = 'https://bfsodqqylpfotszjlfuk.supabase.co/functions/v1/hyper-task';

export const initiatePayment = async ({
  amount,
  phoneNumber,
  type,
  customerName
}: PaymentRequest) => {
  try {
    // Step 1: Create payment request via RPC
    const { data: paymentRequest, error: rpcError } = await supabase
      .rpc('initiate_payment_request', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_amount: amount,
        p_phone_number: phoneNumber,
        p_type: type,
        p_customer_name: customerName
      });

    if (rpcError) throw rpcError;
    if (!paymentRequest.success) throw new Error(paymentRequest.error);

    // Step 2: Process payment via Edge Function (using the direct URL)
    const token = await supabase.auth.getSession();
    const response = await fetch(`${HYPER_TASK_URL}?action=process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.data.session?.access_token}`
      },
      body: JSON.stringify({ ...paymentRequest, action: 'process' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Payment processing error: ${response.status} - ${errorText}`);
    }

    const paymentResult = await response.json();
    if (!paymentResult.success) throw new Error(paymentResult.error);

    return {
      ...paymentResult,
      reference: paymentRequest.reference
    };
  } catch (error) {
    console.error('Payment initiation failed:', error);
    throw error;
  }
};

export const checkTransactionStatus = async (reference: string) => {
  try {
    // Call hyper-task Edge Function directly with the status check
    const token = await supabase.auth.getSession();
    const response = await fetch(`${HYPER_TASK_URL}?action=status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.data.session?.access_token}`
      },
      body: JSON.stringify({ reference, action: 'status' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status check error: ${response.status} - ${errorText}`);
    }

    const statusResult = await response.json();
    if (!statusResult.success) throw new Error(statusResult.error);

    return statusResult.transaction;
  } catch (error) {
    console.error('Transaction status check failed:', error);
    throw error;
  }
};

// Poll for transaction status updates
export const pollTransactionStatus = async (
  reference: string,
  onStatusUpdate: (status: any) => void,
  maxAttempts = 10,
  interval = 5000
) => {
  let attempts = 0;
  
  const checkStatus = async () => {
    if (attempts >= maxAttempts) {
      return;
    }
    
    attempts++;
    
    try {
      const transaction = await checkTransactionStatus(reference);
      
      onStatusUpdate(transaction);
      
      if (transaction.status === 'completed' || transaction.status === 'failed') {
        return;
      }
      
      // Continue polling
      setTimeout(checkStatus, interval);
    } catch (error) {
      console.error('Polling error:', error);
      setTimeout(checkStatus, interval);
    }
  };
  
  checkStatus();
};