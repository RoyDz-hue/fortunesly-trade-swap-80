
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/auth-helpers-react';

// Constants
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bfsodqqylpfotszjlfuk.supabase.co';
const API_URL = `${SUPABASE_URL}/functions/v1/hyper-task`;
const POLLING_INTERVAL = 3000; // 3 seconds
const POLLING_TIMEOUT = 120000; // 2 minutes
const DEBUG_ENABLED = true; // Enable detailed console logs
const AUTH_TOKEN_TTL = 5 * 60 * 1000; // 5 minutes

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
  debug_logs?: string[];
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
  debug_logs?: string[];
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
 * Enhanced debugger that shows formatted messages in console
 */
const debug = (() => {
  // Use a closure to avoid recreating log functions on each call
  const logIfEnabled = (fn: Function, context: string, ...args: any[]) => {
    if (DEBUG_ENABLED) {
      fn(`[Payment-${context}]`, ...args);
    }
  };
  
  return {
    log: (context: string, ...args: any[]) => 
      logIfEnabled(console.log.bind(console, '📋'), context, ...args),
    info: (context: string, ...args: any[]) => 
      logIfEnabled(console.info.bind(console, 'ℹ️'), context, ...args),
    warn: (context: string, ...args: any[]) => 
      logIfEnabled(console.warn.bind(console, '⚠️'), context, ...args),
    error: (context: string, ...args: any[]) => 
      console.error(`❌ [Payment-${context}]`, ...args),
    success: (context: string, ...args: any[]) => 
      logIfEnabled(console.log.bind(console, '✅'), context, ...args),
    trace: (context: string, ...args: any[]) => {
      if (DEBUG_ENABLED) {
        console.debug(`🔍 [Payment-${context}]`, ...args);
        console.trace();
      }
    },
    backend: (context: string, logs?: string[]) => {
      if (DEBUG_ENABLED && logs?.length) {
        console.groupCollapsed(`🌐 [Backend-${context}] Logs`);
        logs.forEach(log => console.log(log));
        console.groupEnd();
      }
    }
  };
})();

/**
 * Auth token cache to reduce redundant requests
 */
let authTokenCache: { token: string; expiry: number } | null = null;

/**
 * Gets the current Supabase session token with caching
 */
const getAuthToken = async (): Promise<string> => {
  const now = Date.now();
  
  // Use cached token if valid
  if (authTokenCache && authTokenCache.expiry > now) {
    debug.info("AuthToken", "Using cached token, expires in", 
      Math.round((authTokenCache.expiry - now) / 1000), "seconds");
    return authTokenCache.token;
  }

  // Fetch new token
  debug.info("AuthToken", "Fetching new session token");
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    debug.error("AuthToken", "No active session found");
    throw new Error('No active session found');
  }

  // Cache the token
  authTokenCache = {
    token: session.access_token,
    expiry: now + AUTH_TOKEN_TTL
  };

  debug.success("AuthToken", "New token cached, expires in", 
    Math.round(AUTH_TOKEN_TTL / 1000), "seconds");

  return session.access_token;
};

/**
 * Format phone number to ensure it has country code
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  // Clean input by removing non-digits
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Apply transformations based on patterns
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    debug.info("PhoneFormat", "Converting 0xx to 254xx");
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    debug.info("PhoneFormat", "Adding 254 prefix to 9-digit number");
    cleaned = '254' + cleaned;
  }

  // Validate result
  if (!cleaned.startsWith('254') || cleaned.length !== 12) {
    debug.error("PhoneFormat", "Invalid phone format:", cleaned);
    throw new Error('Invalid phone number format. Must be a valid Kenyan phone number.');
  }

  return cleaned;
};

/**
 * Make a request to the Edge Function with retries and exponential backoff
 */
const makeRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  data?: any,
  retries: number = 2
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;
  debug.log("Request", `${method} request to ${url}`);
  
  if (data) {
    debug.trace("Request", "Request payload:", data);
  }

  // Implement exponential backoff with jitter for more efficient retries
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      debug.info("Request", `Attempt ${attempt + 1} of ${retries + 1}`);
      
      // Get auth token once per attempt
      const authToken = await getAuthToken();
      
      // Send request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: data ? JSON.stringify(data) : undefined
      });

      debug.info("Request", `Response status: ${response.status} ${response.statusText}`);
      
      // Get response text
      const text = await response.text();
      
      // Handle errors
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} - ${text}`);
      }
      
      if (!text) {
        throw new Error('Empty response received');
      }

      // Parse response
      try {
        const parsed = JSON.parse(text);
        
        // Log backend debug info if available
        if (parsed.debug_logs) {
          debug.backend(method === 'POST' ? "Process" : "Status", parsed.debug_logs);
        }
        
        return parsed;
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${text}`);
      }
    } catch (error: any) {
      debug.error("Request", `Attempt ${attempt + 1} failed:`, error.message);

      // If all retries exhausted, throw the error
      if (attempt === retries) {
        throw error;
      }

      // Calculate backoff with jitter for better retry distribution
      const baseBackoff = 500 * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * baseBackoff; // 0-30% jitter
      const backoffTime = baseBackoff + jitter;
      
      debug.warn("Request", `Retrying in ${Math.round(backoffTime)}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }

  // This line should never be reached due to the throw in the loop
  throw new Error('Unknown error during request');
};

/**
 * Poll for transaction status until it completes or times out
 */
export const pollTransactionStatus = async (
  reference: string,
  options: PaymentOptions = {}
): Promise<PaymentStatusResponse> => {
  debug.log("Polling", `Starting to poll for transaction ${reference}`);

  const {
    onStatusUpdate,
    pollingInterval = POLLING_INTERVAL,
    pollingTimeout = POLLING_TIMEOUT
  } = options;

  const startTime = Date.now();
  let lastStatusHash = '';
  let pollCount = 0;
  
  // Store terminal states in a Set for faster lookups
  const terminalStates = new Set(['completed', 'failed', 'canceled']);

  debug.info("Polling", `Configuration: interval=${pollingInterval}ms, timeout=${pollingTimeout}ms`);

  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        pollCount++;
        debug.log("Polling", `Poll #${pollCount} for transaction ${reference}`);

        const status = await checkPaymentStatus(reference);

        // Generate status hash for efficient change detection
        const statusHash = JSON.stringify({
          status: status.status,
          provider_status: status.provider_status
        });

        const statusChanged = statusHash !== lastStatusHash;
        if (statusChanged) {
          debug.info("Polling", `Status changed to: ${status.status || 'unknown'}, provider status: ${status.provider_status || 'unknown'}`);
          
          // Only call the callback if status changed and callback exists
          if (onStatusUpdate) {
            debug.log("Polling", "Calling onStatusUpdate with new status");
            onStatusUpdate(status);
          }
          
          lastStatusHash = statusHash;
        }

        // Check if transaction is in terminal state
        if (status.status && terminalStates.has(status.status)) {
          debug.success("Polling", `Transaction ${reference} finalized with status: ${status.status}`);
          return resolve(status);
        }

        // Check for timeout
        const elapsedTime = Date.now() - startTime;
        const remainingTime = pollingTimeout - elapsedTime;

        if (remainingTime <= 0) {
          debug.error("Polling", `Timeout after ${pollingTimeout}ms for transaction ${reference}`);
          return reject(new Error('Transaction status check timed out'));
        }

        // Schedule next poll
        debug.info("Polling", `Scheduling next poll in ${pollingInterval}ms (${Math.round(remainingTime/1000)}s remaining)`);
        setTimeout(checkStatus, pollingInterval);

      } catch (error: any) {
        debug.error("Polling", `Error during poll #${pollCount}:`, error.message);

        // Continue polling only for network errors
        const isNetworkError = error.message?.includes('fetch') || 
                               error.message?.includes('network');
        
        if (isNetworkError) {
          debug.warn("Polling", "Network error, continuing to poll");
          setTimeout(checkStatus, pollingInterval);
        } else {
          debug.error("Polling", "Critical error, stopping polling");
          reject(error);
        }
      }
    };

    // Start the polling process
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
  debug.log("PaymentFlow", `Starting ${type} payment flow for ${amount} to ${phoneNumber}`);

  try {
    // Initialize payment
    debug.info("PaymentFlow", "Initiating payment");
    const payment = await initiatePayment(user, amount, phoneNumber, type);

    // Check for success
    if (!payment.success || !payment.reference) {
      debug.error("PaymentFlow", "Payment initiation failed:", payment.error || "No reference returned");
      throw new Error(payment.error || 'Payment initiation failed');
    }

    debug.success("PaymentFlow", `Payment initiated with reference: ${payment.reference}`);

    // Create initial status response
    const initialStatus: PaymentStatusResponse = {
      success: true,
      reference: payment.reference,
      status: 'pending',
      type,
      amount
    };

    // Report initial status if callback provided
    if (options.onStatusUpdate) {
      debug.info("PaymentFlow", "Reporting initial pending status");
      options.onStatusUpdate(initialStatus);
    }

    // Skip polling if requested
    if (options.skipPolling) {
      debug.info("PaymentFlow", "Skipping status polling as requested");
      return initialStatus;
    }

    // Begin polling for status updates
    debug.info("PaymentFlow", "Beginning status polling");
    return await pollTransactionStatus(payment.reference, options);

  } catch (error: any) {
    debug.error("PaymentFlow", "Payment flow error:", error);
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
  debug.log("Initiate", `Initiating ${type} for ${amount} to ${phoneNumber}`);

  try {
    // Validate inputs
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    debug.info("Initiate", "Input validation passed");

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    debug.info("Initiate", "Formatted phone:", formattedPhone);

    // Prepare payload
    const payload = {
      uuid: user.id,
      amount: Number(amount),
      phone_number: formattedPhone,
      type
    };

    // Send request
    debug.info("Initiate", "Sending payment request to edge function");
    const response = await makeRequest<PaymentResponse>(
      '?action=process',
      'POST',
      payload
    );

    debug.success("Initiate", "Payment request successful:", response);
    return {
      success: true,
      ...response
    };

  } catch (error: any) {
    debug.error("Initiate", "Payment initiation error:", error);
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
  debug.log("Status", `Checking status for transaction ${reference}`);

  try {
    // Validate input
    if (!reference) {
      throw new Error('Payment reference is required');
    }

    // Send status request
    debug.info("Status", "Sending status check request");
    const response = await makeRequest<PaymentStatusResponse>(
      `?action=status&reference=${encodeURIComponent(reference)}`
    );

    debug.success("Status", `Status for ${reference}:`, response.status || 'unknown');
    return {
      success: true,
      ...response
    };

  } catch (error: any) {
    debug.error("Status", "Status check error:", error);
    return {
      success: false,
      reference,
      status: 'pending',
      error: error.message || 'Status check failed'
    };
  }
};

/**
 * Get payment history for a user
 */
export const getPaymentHistory = async (
  user: User,
  limit: number = 10
): Promise<PaymentStatusResponse[]> => {
  debug.log("History", `Getting payment history for user, limit=${limit}`);

  try {
    // Validate input
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Query database
    debug.info("History", "Querying payment history from database");
    const { data, error } = await supabase
      .rpc('get_user_payments', { 
        user_id: user.id,
        results_limit: limit
      });

    if (error) {
      throw error;
    }

    debug.success("History", `Retrieved ${data?.length || 0} payment records`);
    return data || [];
  } catch (error: any) {
    debug.error("History", "Payment history error:", error);
    return [];
  }
};

/**
 * Hook-ready payment handler for React components
 */
export const usePayment = () => {
  // Return all payment functions as an object
  return {
    initiatePayment,
    checkPaymentStatus,
    pollTransactionStatus,
    handlePayment,
    getPaymentHistory
  };
};
