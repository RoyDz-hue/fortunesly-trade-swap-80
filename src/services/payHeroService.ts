import { supabase } from '@/lib/supabaseClient';

interface PaymentRequest {
  amount: number;
  phoneNumber: string;
  type: 'deposit' | 'withdrawal';
  customerName?: string;
}

// Edge function URL for callbacks
const EDGE_FUNCTION_URL = 'https://bfsodqqylpfotszjlfuk.supabase.co/functions/v1/hyper-task';
const CALLBACK_URL = `${EDGE_FUNCTION_URL}?action=callback`;

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
        p_customer_name: customerName,
        p_callback_url: CALLBACK_URL // Pass the callback URL to the database
      });

    if (rpcError) throw new Error(`RPC Error: ${rpcError.message}`);
    if (!paymentRequest.success) throw new Error(paymentRequest.error);

    // Step 2: Process payment via Edge Function
    const token = await supabase.auth.getSession();
    const response = await fetch(`${EDGE_FUNCTION_URL}?action=process`, {
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
    const token = await supabase.auth.getSession();
    const response = await fetch(`${EDGE_FUNCTION_URL}?action=status`, {
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

export const pollTransactionStatus = async (
  reference: string,
  onStatusUpdate: (status: any) => void,
  maxAttempts = 10,
  interval = 5000
) => {
  let attempts = 0;

  const checkStatus = async () => {
    if (attempts >= maxAttempts) {
      onStatusUpdate({ status: 'timeout', error: 'Status check timed out' });
      return;
    }

    attempts++;

    try {
      const transaction = await checkTransactionStatus(reference);

      onStatusUpdate(transaction);

      if (transaction.status === 'completed' || transaction.status === 'failed') {
        return;
      }

      setTimeout(checkStatus, interval);
    } catch (error) {
      console.error('Polling error:', error);
      setTimeout(checkStatus, interval);
    }
  };

  checkStatus();
};