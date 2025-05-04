
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Constants - match frontend constants
const API_BASE_URL = 'https://backend.payhero.co.ke/api/v2';
const ALLOWED_ORIGINS = [
  'https://www.fortunesly.shop',
  'https://fortunesly.shop',
  'https://backend.payhero.co.ke/api/v2',
  'http://localhost:3000'
];
const DEFAULT_DEPOSIT_CHANNEL_ID = 1487;
const DEFAULT_WITHDRAWAL_CHANNEL_ID = 1564;
const STATUS_CACHE_TTL = 5000; // 5 seconds cache

// Environment configuration
const PAYHERO_CREDENTIALS = {
  apiUsername: Deno.env.get('PAYHERO_API_USERNAME'),
  apiPassword: Deno.env.get('PAYHERO_API_PASSWORD')
};
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const API_URL = Deno.env.get('API_URL') || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Caches - aligned with frontend implementation
let authTokenCache = null;
const phoneNumberCache = new Map();
const statusCache = new Map();

// Debug log storage - use a circular buffer to limit memory usage
const MAX_LOGS = 100;
const debugLogs: string[] = [];

/**
 * Enhanced debug logging function - matches frontend debug logger
 */
const debug = (() => {
  const logEntry = (level: string, context: string, message: string) => {
    const entry = `[${new Date().toISOString()}][${level}][${context}]: ${message}`;
    if (debugLogs.length >= MAX_LOGS) {
      debugLogs.shift(); // Remove oldest log if at capacity
    }
    debugLogs.push(entry);
    console.log(entry);
  };
  
  return {
    log: (context: string, message: string) => logEntry("LOG", context, message),
    info: (context: string, message: string) => logEntry("INFO", context, message),
    warn: (context: string, message: string) => logEntry("WARN", context, message),
    error: (context: string, error: unknown, additionalInfo = {}) => {
      const message = error instanceof Error ? error.message : String(error);
      logEntry("ERROR", context, `${message} ${JSON.stringify(additionalInfo)}`);
    },
    success: (context: string, message: string) => logEntry("SUCCESS", context, message),
    trace: (context: string, message: string) => logEntry("TRACE", context, message)
  };
})();

/**
 * Generate Basic Auth Token with caching - aligned with frontend getAuthToken
 */
const getAuthToken = () => {
  const now = Date.now();
  
  if (authTokenCache && authTokenCache.expiry > now) {
    debug.info("AuthToken", "Using cached token");
    return authTokenCache.token;
  }
  
  if (!PAYHERO_CREDENTIALS.apiUsername || !PAYHERO_CREDENTIALS.apiPassword) {
    throw new Error("Missing PayHero credentials");
  }
  
  const token = 'Basic ' + btoa(`${PAYHERO_CREDENTIALS.apiUsername}:${PAYHERO_CREDENTIALS.apiPassword}`);
  
  authTokenCache = {
    token,
    expiry: now + 60 * 60 * 1000 // Cache for 1 hour
  };
  
  debug.success("AuthToken", "Generated new token");
  return token;
};

/**
 * Format phone number to E.164 format with caching - matching frontend implementation
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumberCache.has(phoneNumber)) {
    return phoneNumberCache.get(phoneNumber);
  }
  
  // Clean input by removing non-digits - matching frontend
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Apply transformations based on patterns - matching frontend
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    debug.info("PhoneFormat", "Converting 0xx to 254xx");
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    debug.info("PhoneFormat", "Adding 254 prefix to 9-digit number");
    cleaned = '254' + cleaned;
  }
  
  // Validate result - matching frontend validation
  if (!cleaned.startsWith('254') || cleaned.length !== 12) {
    debug.error("PhoneFormat", "Invalid phone format:", cleaned);
    throw new Error('Invalid phone number format. Must be a valid Kenyan phone number.');
  }
  
  phoneNumberCache.set(phoneNumber, cleaned);
  return cleaned;
};

/**
 * Parse payment status - more efficient with direct mapping
 */
const STATUS_MAP: Record<string, string> = {
  'SUCCESS': 'completed',
  'QUEUED': 'queued',
  'FAILED': 'failed',
  'PENDING': 'pending'
};

const parsePaymentStatus = (status: string | null | undefined): string => {
  if (!status) return 'pending';
  
  const normalizedStatus = String(status).toUpperCase();
  
  // Direct mapping for common statuses
  if (STATUS_MAP[normalizedStatus]) {
    return STATUS_MAP[normalizedStatus];
  }
  
  // Check for contained words
  if (normalizedStatus.includes('CANCEL') || normalizedStatus.includes('REJECT')) {
    return 'canceled';
  }
  
  return 'pending';
};

/**
 * Fetch with retries and auth - optimized with exponential backoff
 * Matching frontend makeRequest with retries pattern
 */
const fetchWithAuth = async (url: string, method = 'GET', body: any = null, retries = 2) => {
  const headers: Record<string, string> = {
    'Authorization': getAuthToken(),
    'Accept': 'application/json'
  };
  
  if (body) {
    headers['Content-Type'] = 'application/json';
    debug.trace("Fetch", `Request payload: ${JSON.stringify(body)}`);
  }
  
  // Implement exponential backoff with jitter for more efficient retries - matching frontend
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      debug.info("Request", `Attempt ${attempt + 1} of ${retries + 1}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });
      
      debug.info("Request", `Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
      }
      
      const text = await response.text();
      
      if (!text) {
        throw new Error('Empty response received');
      }
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${text}`);
      }
    } catch (error) {
      debug.error("Request", `Attempt ${attempt + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
      
      // If all retries exhausted, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Calculate backoff with jitter for better retry distribution - matching frontend
      const baseBackoff = 500 * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * baseBackoff; // 0-30% jitter
      const backoffTime = baseBackoff + jitter;
      
      debug.warn("Request", `Retrying in ${Math.round(backoffTime)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }
  
  // This line should never be reached due to the throw in the loop
  throw new Error('Unknown error during request');
};

/**
 * Initialize Deposit (STK Push)
 */
const initiateDeposit = async (
  amount: number, 
  phoneNumber: string, 
  reference: string, 
  callbackUrl: string, 
  channelId = DEFAULT_DEPOSIT_CHANNEL_ID
) => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  const requestData = {
    amount,
    phone_number: formattedPhone,
    channel_id: channelId,
    provider: "m-pesa",
    external_reference: reference,
    customer_name: "Customer",
    callback_url: callbackUrl
  };
  
  debug.info("Deposit", `Initiating deposit for ${amount} to ${formattedPhone}`);
  return await fetchWithAuth(`${API_BASE_URL}/payments`, 'POST', requestData);
};

/**
 * Initialize Withdrawal (to Mobile)
 */
const initiateWithdrawal = async (
  amount: number, 
  phoneNumber: string, 
  reference: string, 
  callbackUrl: string, 
  networkCode = '63902', 
  channelId = DEFAULT_WITHDRAWAL_CHANNEL_ID
) => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  const requestData = {
    external_reference: reference,
    amount,
    phone_number: formattedPhone,
    network_code: networkCode,
    callback_url: callbackUrl,
    channel: "mobile",
    channel_id: channelId,
    payment_service: "b2c"
  };
  
  debug.info("Withdrawal", `Initiating withdrawal for ${amount} to ${formattedPhone}`);
  return await fetchWithAuth(`${API_BASE_URL}/withdraw`, 'POST', requestData);
};

/**
 * Check Transaction Status with PayHero API
 */
const checkTransactionStatus = async (reference: string) => {
  debug.log("Status", `Checking transaction status with PayHero for ${reference}`);
  return await fetchWithAuth(`${API_BASE_URL}/transaction-status?reference=${reference}`);
};

/**
 * Update user's fiat balance after a successful transaction
 */
const updateUserFiatBalance = async (userId: string, amount: number, isDeposit: boolean): Promise<boolean> => {
  try {
    debug.info("Balance", `Updating user ${userId} fiat balance: ${isDeposit ? '+' : '-'}${amount} KES`);
    
    const { data, error } = await supabase.rpc('updateUserFiatBalance', {
      user_id: userId,
      amount_change: isDeposit ? amount : -amount
    });
    
    if (error) {
      debug.error("Balance", `Failed to update user balance: ${error.message}`, { userId, amount });
      return false;
    }
    
    debug.success("Balance", `Successfully updated fiat balance for user ${userId}`);
    return true;
  } catch (error) {
    debug.error("Balance", `Exception updating user balance: ${error instanceof Error ? error.message : String(error)}`, { userId });
    return false;
  }
};

/**
 * Process payment request
 */
async function processPayment(req: Request, headers: HeadersInit) {
  debugLogs.length = 0;
  debug.log("Process", "Processing payment request");
  
  try {
    const body = await req.json();
    
    // Validate request - matching frontend validation
    if (!body.uuid) {
      throw new Error('User not authenticated');
    }
    
    if (isNaN(body.amount) || body.amount <= 0) {
      throw new Error('Amount must be a positive number');
    }
    
    debug.info("Process", "Input validation passed");
    
    // Format phone number - using shared implementation
    const formattedPhone = formatPhoneNumber(body.phone_number);
    debug.info("Process", `Formatted phone: ${formattedPhone}`);
    
    // Check balance for withdrawals
    if (body.type === 'withdrawal') {
      const { data: userBalance, error: balanceError } = await supabase
        .from('users')
        .select('balance_fiat')
        .eq('id', body.uuid)
        .single();
        
      if (balanceError) {
        throw new Error(`Failed to check user balance: ${balanceError.message}`);
      }
      
      const balance = userBalance?.balance_fiat || 0;
      
      if (balance < body.amount) {
        throw new Error(`Insufficient funds. Available balance: ${balance} KES`);
      }
      
      debug.info("Process", `Balance check passed. Available: ${balance} KES, Requested: ${body.amount} KES`);
    }
    
    // Log payment request to database
    const { data, error } = await supabase.rpc('log_payment_request', {
      user_id: body.uuid,
      request_type: body.type,
      request_amount: body.amount,
      request_phone: formattedPhone
    });
    
    if (error || !data.success) {
      throw new Error(error?.message || data.error || 'Failed to log payment request');
    }
    
    const reference = data.reference;
    const callbackUrl = `${API_URL}/functions/v1/hyper-task?action=callback&reference=${reference}`;
    
    // Initiate payment based on type
    debug.info("Process", `Initiating ${body.type} for ${body.amount} to ${formattedPhone}`);
    
    let paymentResponse;
    if (body.type === 'deposit') {
      paymentResponse = await initiateDeposit(body.amount, body.phone_number, reference, callbackUrl);
    } else {
      // For withdrawals, reserve the amount first
      // This is important to prevent double-withdrawals
      const { error: reserveError } = await supabase.rpc('updateUserFiatBalance', {
        user_id: body.uuid,
        amount_change: -body.amount
      });
      
      if (reserveError) {
        throw new Error(`Failed to reserve withdrawal amount: ${reserveError.message}`);
      }
      
      debug.info("Process", `Reserved ${body.amount} KES for withdrawal`);
      
      try {
        paymentResponse = await initiateWithdrawal(body.amount, body.phone_number, reference, callbackUrl);
      } catch (error) {
        // If withdrawal initiation fails, refund the reserved amount
        await supabase.rpc('updateUserFiatBalance', {
          user_id: body.uuid,
          amount_change: body.amount
        });
        
        debug.error("Process", `Refunded ${body.amount} KES after withdrawal initiation failure`);
        throw error;
      }
    }
    
    debug.success("Process", `Payment request successful with reference: ${reference}`);
    
    return new Response(JSON.stringify({
      success: true,
      reference,
      status: "pending",
      message: `${body.type === 'deposit' ? 'STK Push' : 'Withdrawal'} initiated successfully`,
      provider_data: paymentResponse,
      debug_logs: debugLogs
    }), {
      headers
    });
  } catch (error) {
    debug.error("Process", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      debug_logs: debugLogs
    }), {
      headers,
      status: 500
    });
  }
}

/**
 * Handle callback from PayHero
 */
async function handleCallback(req: Request, headers: HeadersInit) {
  debugLogs.length = 0;
  debug.log("Callback", "Processing payment callback");
  
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");
    
    if (!reference) {
      throw new Error("Missing reference in callback");
    }
    
    debug.info("Callback", `Processing callback for reference: ${reference}`);
    
    // Get payment request details
    const { data: paymentRequest, error: prError } = await supabase
      .from('payment_requests')
      .select('user_id, type, amount, status')
      .eq('reference', reference)
      .single();
      
    if (prError || !paymentRequest) {
      throw new Error(`Payment request not found: ${prError?.message || 'No data'}`);
    }
    
    // Only process if not already completed
    if (paymentRequest.status === 'completed') {
      debug.info("Callback", `Payment ${reference} already processed, skipping`);
      return new Response(JSON.stringify({
        success: true,
        reference,
        status: 'completed',
        message: 'Payment already processed',
        debug_logs: debugLogs
      }), { headers });
    }
    
    const callbackData = await req.json();
    const responseData = callbackData.response || {};
    const status = parsePaymentStatus(responseData.Status || callbackData.status);
    const providerRef = responseData.MpesaReceiptNumber || responseData.TransactionID || responseData.provider_reference || "";
    const checkoutId = responseData.CheckoutRequestID || "";
    
    debug.info("Callback", `Status: ${status}, Provider Ref: ${providerRef}`);
    
    // Update status in database
    await supabase.rpc('update_payment_status', {
      p_reference: reference,
      p_status: status,
      p_provider_reference: providerRef,
      p_checkout_request_id: checkoutId,
      p_callback_data: callbackData
    });
    
    // If payment is completed successfully, update the user's balance
    if (status === 'completed') {
      debug.info("Callback", "Processing successful payment");
      
      if (paymentRequest.type === 'deposit') {
        // For deposits - add to user's balance
        await updateUserFiatBalance(paymentRequest.user_id, paymentRequest.amount, true);
        
        // Create transaction record
        await supabase.from('transactions')
          .insert({
            user_id: paymentRequest.user_id,
            amount: paymentRequest.amount,
            type: 'deposit',
            currency: 'KES',
            status: 'completed',
            description: `Deposit completed: ${providerRef || reference}`
          });
          
        debug.success("Callback", `Deposit of ${paymentRequest.amount} KES credited to user ${paymentRequest.user_id}`);
      } else {
        // For withdrawals - record transaction (balance already deducted in processPayment)
        await supabase.from('transactions')
          .insert({
            user_id: paymentRequest.user_id,
            amount: -paymentRequest.amount, // Negative for withdrawals
            type: 'withdrawal',
            currency: 'KES',
            status: 'completed',
            description: `Withdrawal completed: ${providerRef || reference}`
          });
          
        debug.success("Callback", `Withdrawal of ${paymentRequest.amount} KES for user ${paymentRequest.user_id} confirmed`);
      }
    } else if ((status === 'failed' || status === 'canceled') && paymentRequest.type === 'withdrawal') {
      // For failed withdrawals - refund to user's balance
      await updateUserFiatBalance(paymentRequest.user_id, paymentRequest.amount, true);
      
      // Record the refund
      await supabase.from('transactions')
        .insert({
          user_id: paymentRequest.user_id,
          amount: paymentRequest.amount,
          type: 'refund',
          currency: 'KES',
          status: 'completed',
          description: `Withdrawal failed, amount refunded: ${reference}`
        });
        
      debug.info("Callback", `Refunded ${paymentRequest.amount} KES to user ${paymentRequest.user_id} after failed withdrawal`);
    }
    
    // Clear status cache
    statusCache.delete(reference);
    
    debug.success("Callback", `Successfully processed callback for ${reference}`);
    
    return new Response(JSON.stringify({
      success: true,
      reference,
      status,
      processed_at: new Date().toISOString(),
      debug_logs: debugLogs
    }), {
      headers
    });
  } catch (error) {
    debug.error("Callback", error);
    
    return new Response(JSON.stringify({
      success: true, // Always return success to provider to avoid retries
      error: error instanceof Error ? error.message : "Unknown error",
      processed_at: new Date().toISOString(),
      debug_logs: debugLogs
    }), {
      headers
    });
  }
}

/**
 * Check payment status - optimized with better error handling
 * Matching frontend checkPaymentStatus pattern
 */
async function checkStatus(req: Request, headers: HeadersInit) {
  debugLogs.length = 0;
  
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");
    
    // Validate input - matching frontend validation
    if (!reference) {
      throw new Error('Payment reference is required');
    }
    
    debug.log("Status", `Checking status for transaction ${reference}`);
    
    // Check cache first
    const now = Date.now();
    const cachedStatus = statusCache.get(reference);
    
    if (cachedStatus && now - cachedStatus.timestamp < STATUS_CACHE_TTL) {
      debug.info("Status", "Returning cached status information");
      return new Response(JSON.stringify({
        ...cachedStatus.data,
        cached: true,
        debug_logs: debugLogs
      }), {
        headers
      });
    }
    
    // Query database for current status
    debug.info("Status", "Querying database for current status");
    const { data: dbStatus, error: dbError } = await supabase.rpc('get_payment_status', {
      payment_reference: reference
    });
    
    if (dbError) {
      throw new Error(dbError.message);
    }
    
    // Return immediately if status is final
    if (['completed', 'failed', 'canceled'].includes(dbStatus.status)) {
      debug.success("Status", `Transaction ${reference} has final status: ${dbStatus.status}`);
      
      const responseData = {
        success: true,
        reference,
        status: dbStatus.status,
        type: dbStatus.type,
        amount: dbStatus.amount,
        created_at: dbStatus.created_at,
        updated_at: dbStatus.updated_at,
        provider_reference: dbStatus.provider_reference,
        checkout_id: dbStatus.checkout_id,
        provider_data: dbStatus.provider_data
      };
      
      statusCache.set(reference, {
        data: responseData,
        timestamp: now
      });
      
      return new Response(JSON.stringify({
        ...responseData,
        debug_logs: debugLogs
      }), {
        headers
      });
    }
    
    try {
      // Check with PayHero API for latest status
      debug.info("Status", "Checking with PayHero for latest status");
      const payHeroStatus = await checkTransactionStatus(reference);
      const newStatus = parsePaymentStatus(payHeroStatus.status);
      
      debug.info("Status", `PayHero reports status: ${newStatus}`);
      
      // Update database if status has changed to a final state
      if (newStatus !== dbStatus.status && ['completed', 'failed', 'canceled'].includes(newStatus)) {
        debug.info("Status", `Updating transaction ${reference} with final status: ${newStatus}`);
        
        const providerRef = payHeroStatus.provider_reference || payHeroStatus.third_party_reference || "";
        const checkoutId = payHeroStatus.CheckoutRequestID || "";
        
        await supabase.rpc('update_payment_status', {
          p_reference: reference,
          p_status: newStatus,
          p_provider_reference: providerRef,
          p_checkout_request_id: checkoutId,
          p_callback_data: payHeroStatus
        });
        
        // If status updated to completed and wasn't processed by callback
        if (newStatus === 'completed') {
          // Get payment info
          const { data: paymentInfo, error: paymentError } = await supabase
            .from('payment_requests')
            .select('user_id, type, amount, status')
            .eq('reference', reference)
            .single();
            
          if (!paymentError && paymentInfo && paymentInfo.status !== 'completed') {
            // Process the completion
            if (paymentInfo.type === 'deposit') {
              await updateUserFiatBalance(paymentInfo.user_id, paymentInfo.amount, true);
              
              await supabase.from('transactions')
                .insert({
                  user_id: paymentInfo.user_id,
                  amount: paymentInfo.amount,
                  type: 'deposit',
                  currency: 'KES',
                  status: 'completed',
                  description: `Deposit completed (status check): ${providerRef || reference}`
                });
                
              debug.success("Status", `Deposit of ${paymentInfo.amount} KES credited to user ${paymentInfo.user_id}`);
            }
            // For withdrawals, callback should have handled the deduction
          } else if (!paymentError && paymentInfo && (newStatus === 'failed' || newStatus === 'canceled') && paymentInfo.type === 'withdrawal') {
            // Refund failed withdrawals
            await updateUserFiatBalance(paymentInfo.user_id, paymentInfo.amount, true);
            
            await supabase.from('transactions')
              .insert({
                user_id: paymentInfo.user_id,
                amount: paymentInfo.amount,
                type: 'refund',
                currency: 'KES',
                status: 'completed',
                description: `Withdrawal failed, amount refunded (status check): ${reference}`
              });
              
            debug.info("Status", `Refunded ${paymentInfo.amount} KES to user ${paymentInfo.user_id} after failed withdrawal`);
          }
        }
        
        const responseData = {
          success: true,
          reference,
          status: newStatus,
          type: dbStatus.type,
          amount: dbStatus.amount,
          created_at: dbStatus.created_at,
          updated_at: new Date().toISOString(),
          provider_reference: providerRef,
          checkout_id: checkoutId,
          provider_data: payHeroStatus
        };
        
        statusCache.set(reference, {
          data: responseData,
          timestamp: now
        });
        
        debug.success("Status", `Successfully updated status for ${reference}`);
        
        return new Response(JSON.stringify({
          ...responseData,
          debug_logs: debugLogs
        }), {
          headers
        });
      }
      
      // Status hasn't changed to final state
      debug.info("Status", `Status for ${reference} remains: ${dbStatus.status}`);
      
      const responseData = {
        success: true,
        reference,
        status: dbStatus.status,
        provider_status: newStatus,
        type: dbStatus.type,
        amount: dbStatus.amount,
        created_at: dbStatus.created_at,
        updated_at: dbStatus.updated_at,
        provider_reference: dbStatus.provider_reference,
        checkout_id: dbStatus.checkout_id,
        provider_data: payHeroStatus
      };
      
      statusCache.set(reference, {
        data: responseData,
        timestamp: now
      });
      
      return new Response(JSON.stringify({
        ...responseData,
        debug_logs: debugLogs
      }), {
        headers
      });
    } catch (error) {
      // Error checking with provider, return what we have from DB
      debug.error("Status", error, { reference });
      
      const responseData = {
        success: true,
        reference,
        status: dbStatus.status,
        type: dbStatus.type,
        amount: dbStatus.amount,
        created_at: dbStatus.created_at,
        updated_at: dbStatus.updated_at,
        provider_reference: dbStatus.provider_reference,
        checkout_id: dbStatus.checkout_id,
        provider_error: error instanceof Error ? error.message : "Unknown error"
      };
      
      // Cache for a shorter time
      statusCache.set(reference, {
        data: responseData,
        timestamp: now - (STATUS_CACHE_TTL - 2000) // Cache for 2 seconds
      });
      
      return new Response(JSON.stringify({
        ...responseData,
        debug_logs: debugLogs
      }), {
        headers
      });
    }
  } catch (error) {
    debug.error("Status", error);
    
    return new Response(JSON.stringify({
      success: false,
      reference: new URL(req.url).searchParams.get("reference"),
      status: 'pending',
      error: error instanceof Error ? error.message : "Unknown error",
      debug_logs: debugLogs
    }), {
      headers,
      status: 500
    });
  }
}

/**
 * Helper to handle CORS - match the frontend's expected behavior
 */
const corsHeaders = (origin: string): Record<string, string> => {
  // Use specific origin if in allowed list, otherwise default to '*'
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
};

// Main function handler - optimized with more efficient routing
serve(async (req: Request) => {
  // Reset debug logs for new request
  debugLogs.length = 0;
  debug.log("Main", `Handling ${req.method} request to ${new URL(req.url).pathname}`);
  
  // Get origin for CORS
  const origin = req.headers.get('origin') || '*';
  const headers = corsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    debug.info("Main", "Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers
    });
  }
  
  try {
    // Validate credentials
    if (!PAYHERO_CREDENTIALS.apiUsername || !PAYHERO_CREDENTIALS.apiPassword) {
      debug.error("Main", "Missing PayHero credentials");
      return new Response(JSON.stringify({
        success: false,
        error: "Payment provider credentials not configured",
        debug_logs: debugLogs
      }), {
        headers,
        status: 500
      });
    }
    
    // Route request based on action parameter
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "status";
    
    debug.info("Main", `Processing action: ${action}`);
    
    switch (action) {
      case "process":
        return await processPayment(req, headers);
      case "callback":
        return await handleCallback(req, headers);
      case "status":
        return await checkStatus(req, headers);
      default:
        debug.warn("Main", `Invalid action requested: ${action}`);
        return new Response(JSON.stringify({
          success: false,
          error: "Invalid action",
          debug_logs: debugLogs
        }), {
          headers,
          status: 400
        });
    }
  } catch (error) {
    debug.error("Main", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      debug_logs: debugLogs
    }), {
      status: 500,
      headers
    });
  }
});
