import { supabase } from '@/intergrations/supabase/Client';

interface PaymentRequest {
  amount: number;
  phoneNumber: string;
  type: 'deposit' | 'withdrawal';
  customerName?: string;
  callbackUrl?: string;
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
    // Input validation
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Get user ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    if (!userData.user) throw new Error('User not authenticated');
    
    // Step 1: Create payment request via RPC
    const { data: paymentRequest, error: rpcError } = await supabase
      .rpc('initiate_payment_request', {
        p_user_id: userData.user.id,
        p_amount: amount,
        p_phone_number: phoneNumber,
        p_type: type,
        p_customer_name: customerName,
        p_callback_url: CALLBACK_URL // Pass the callback URL to the database
      });

    if (rpcError) throw new Error(`RPC Error: ${rpcError.message}`);
    
    // Handle error response from RPC function
    if (!paymentRequest.success) {
      // Handle specific error cases
      if (paymentRequest.error === 'Insufficient balance') {
        throw new Error(`Insufficient balance. Available: ${paymentRequest.available || 0}`);
      } else {
        throw new Error(paymentRequest.error || 'Payment request failed');
      }
    }

    // Step 2: Process payment via Edge Function
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Session error: ${sessionError.message}`);
    if (!sessionData.session) throw new Error('No active session');
    
    const response = await fetch(`${EDGE_FUNCTION_URL}?action=process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`
      },
      body: JSON.stringify({ ...paymentRequest, action: 'process' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Payment processing error: ${response.status} - ${errorText}`);
    }

    const paymentResult = await response.json();
    if (!paymentResult.success) throw new Error(paymentResult.error || 'Payment processing failed');

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
    if (!reference) throw new Error('Transaction reference is required');
    
    // First try to get status from database
    const { data: statusData, error: statusError } = await supabase
      .rpc('get_transaction_status', {
        p_reference: reference
      });

    if (!statusError && statusData?.success) {
      return statusData.transaction;
    }
    
    // If database check fails, fall back to edge function
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Session error: ${sessionError.message}`);
    if (!sessionData.session) throw new Error('No active session');
    
    const response = await fetch(`${EDGE_FUNCTION_URL}?action=status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`
      },
      body: JSON.stringify({ reference, action: 'status' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status check error: ${response.status} - ${errorText}`);
    }

    const statusResult = await response.json();
    if (!statusResult.success) throw new Error(statusResult.error || 'Status check failed');

    return statusResult.transaction;
  } catch (error) {
    console.error('Transaction status check failed:', error);
    throw error;
  }
};

export const pollTransactionStatus = async (
  reference: string,
  onStatusUpdate: (status: any) => void,
  maxAttempts = 20,
  interval = 3000
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
      // Increase interval on errors to prevent hammering the server
      setTimeout(checkStatus, interval * 2);
    }
  };

  checkStatus();
};
