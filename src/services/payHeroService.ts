import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/auth-helpers-react';

// Constants
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bfsodqqylpfotszjlfuk.supabase.co';
const API_URL = `${SUPABASE_URL}/functions/v1/hyper-task`;
const POLLING_INTERVAL = 3000; // 3 seconds
const POLLING_TIMEOUT = 120000; // 2 minutes
const DEBUG_ENABLED = true; // Enable detailed console logs

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
  debug_logs?: string[]; // Added to handle backend debug logs
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
  debug_logs?: string[]; // Added to handle backend debug logs
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
const debug = {
  log: (context: string, ...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.log(`📋 [Payment-${context}]`, ...args);
    }
  },
  info: (context: string, ...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.info(`ℹ️ [Payment-${context}]`, ...args);
    }
  },
  warn: (context: string, ...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.warn(`⚠️ [Payment-${context}]`, ...args);
    }
  },
  error: (context: string, ...args: any[]) => {
    console.error(`❌ [Payment-${context}]`, ...args);
  },
  success: (context: string, ...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.log(`✅ [Payment-${context}]`, ...args);
    }
  },
  trace: (context: string, ...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.debug(`🔍 [Payment-${context}]`, ...args);
      console.trace();
    }
  },
  backend: (context: string, logs: string[]) => {
    if (DEBUG_ENABLED && logs && logs.length > 0) {
      console.groupCollapsed(`🌐 [Backend-${context}] Logs`);
      logs.forEach(log => console.log(log));
      console.groupEnd();
    }
  }
};

/**
 * Auth token cache to reduce redundant requests
 */
let authTokenCache: { token: string; expiry: number } | null = null;
const AUTH_TOKEN_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Gets the current Supabase session token with caching
 */
const getAuthToken = async (): Promise<string> => {
  debug.trace("AuthToken", "Getting auth token");

  const now = Date.now();
  if (authTokenCache && authTokenCache.expiry > now) {
    debug.info("AuthToken", "Using cached token, expires in", Math.round((authTokenCache.expiry - now) / 1000), "seconds");
    return authTokenCache.token;
  }

  debug.info("AuthToken", "Fetching new session token");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    debug.error("AuthToken", "No active session found");
    throw new Error('No active session found');
  }

  authTokenCache = {
    token: session.access_token,
    expiry: now + AUTH_TOKEN_TTL
  };

  debug.success("AuthToken", "New token cached, expires in", Math.round(AUTH_TOKEN_TTL / 1000), "seconds");

  return session.access_token;
};

/**
 * Format phone number to ensure it has country code
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  debug.log("PhoneFormat", "Formatting phone number:", phoneNumber);

  let cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
    debug.info("PhoneFormat", "Converted 0xx to 254xx");
  }

  if (cleaned.length === 9) {
    cleaned = '254' + cleaned;
    debug.info("PhoneFormat", "Added 254 prefix to 9-digit number");
  }

  if (!cleaned.startsWith('254') || cleaned.length !== 12) {
    debug.error("PhoneFormat", "Invalid phone format:", cleaned);
    throw new Error('Invalid phone number format. Must be a valid Kenyan phone number.');
  }

  debug.success("PhoneFormat", "Final formatted number:", cleaned);
  return cleaned;
};

/**
 * Make a request to the Edge Function with retries
 */
const makeRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  data?: any,
  retries: number = 2
): Promise<T> => {
  let lastError: Error | null = null;

  const url = `${API_URL}${endpoint}`;
  debug.log("Request", `${method} request to ${url}`);

  if (data) {
    debug.trace("Request", "Request payload:", data);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      debug.info("Request", `Attempt ${attempt + 1} of ${retries + 1}`);
      const authToken = await getAuthToken();

      debug.trace("Request", "Auth token obtained, sending request");
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: data ? JSON.stringify(data) : undefined
      });

      debug.info("Request", `Response status: ${response.status} ${response.statusText}`);

      const text = await response.text();
      debug.trace("Request", "Raw response:", text);

      if (!response.ok) {
        debug.error("Request", `Failed with status ${response.status}:`, text);
        throw new Error(`Request failed: ${response.status} - ${text}`);
      }

      if (!text) {
        debug.error("Request", "Empty response received");
        throw new Error('Empty response received');
      }

      try {
        const parsed = JSON.parse(text);
        debug.success("Request", "Parsed response:", parsed);
        if (parsed.debug_logs) {
          debug.backend(method === 'POST' ? "Process" : "Status", parsed.debug_logs);
        }
        return parsed;
      } catch (parseError) {
        debug.error("Request", "JSON Parse Error:", parseError);
        throw new Error(`Invalid JSON response: ${text}`);
      }
    } catch (error: any) {
      lastError = error;
      debug.error("Request", `Attempt ${attempt + 1} failed:`, error.message);

      if (attempt === retries) {
        debug.error("Request", "All retry attempts failed");
        throw error;
      }

      const backoffTime = 500 * Math.pow(2, attempt);
      debug.warn("Request", `Retrying in ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }

  throw lastError || new Error('Unknown error during request');
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

  debug.info("Polling", `Configuration: interval=${pollingInterval}ms, timeout=${pollingTimeout}ms`);

  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        pollCount++;
        debug.log("Polling", `Poll #${pollCount} for transaction ${reference}`);

        const status = await checkPaymentStatus(reference);

        const statusHash = JSON.stringify({
          status: status.status,
          provider_status: status.provider_status
        });

        const statusChanged = statusHash !== lastStatusHash;
        if (statusChanged) {
          debug.info("Polling", `Status changed to: ${status.status || 'unknown'}, provider status: ${status.provider_status || 'unknown'}`);
        }

        if (onStatusUpdate && statusChanged) {
          debug.log("Polling", "Calling onStatusUpdate with new status");
          onStatusUpdate(status);
          lastStatusHash = statusHash;
        }

        if (
          status.status === 'completed' || 
          status.status === 'failed' || 
          status.status === 'canceled'
        ) {
          debug.success("Polling", `Transaction ${reference} finalized with status: ${status.status}`);
          return resolve(status);
        }

        const elapsedTime = Date.now() - startTime;
        const remainingTime = pollingTimeout - elapsedTime;

        if (remainingTime <= 0) {
          debug.error("Polling", `Timeout after ${pollingTimeout}ms for transaction ${reference}`);
          return reject(new Error('Transaction status check timed out'));
        }

        debug.info("Polling", `Scheduling next poll in ${pollingInterval}ms (${Math.round(remainingTime/1000)}s remaining)`);
        setTimeout(checkStatus, pollingInterval);

      } catch (error: any) {
        debug.error("Polling", `Error during poll #${pollCount}:`, error.message);

        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          debug.warn("Polling", "Network error, continuing to poll");
          setTimeout(checkStatus, pollingInterval);
        } else {
          debug.error("Polling", "Critical error, stopping polling");
          reject(error);
        }
      }
    };

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
    debug.info("PaymentFlow", "Initiating payment");
    const payment = await initiatePayment(user, amount, phoneNumber, type);

    if (!payment.success || !payment.reference) {
      debug.error("PaymentFlow", "Payment initiation failed:", payment.error || "No reference returned");
      throw new Error(payment.error || 'Payment initiation failed');
    }

    debug.success("PaymentFlow", `Payment initiated with reference: ${payment.reference}`);

    if (options.onStatusUpdate) {
      debug.info("PaymentFlow", "Reporting initial pending status");
      options.onStatusUpdate({
        success: true,
        reference: payment.reference,
        status: 'pending',
        type,
        amount
      });
    }

    if (options.skipPolling) {
      debug.info("PaymentFlow", "Skipping status polling as requested");
      return {
        success: true,
        reference: payment.reference,
        status: 'pending',
        type,
        amount
      };
    }

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
    if (!user?.id) {
      debug.error("Initiate", "User not authenticated");
      throw new Error('User not authenticated');
    }

    if (isNaN(amount) || amount <= 0) {
      debug.error("Initiate", "Invalid amount:", amount);
      throw new Error('Amount must be a positive number');
    }

    debug.info("Initiate", "Input validation passed");

    const formattedPhone = formatPhoneNumber(phoneNumber);
    debug.info("Initiate", "Formatted phone:", formattedPhone);

    const payload = {
      uuid: user.id,
      amount: Number(amount),
      phone_number: formattedPhone,
      type
    };

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
    if (!reference) {
      debug.error("Status", "Missing payment reference");
      throw new Error('Payment reference is required');
    }

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
    if (!user?.id) {
      debug.error("History", "User not authenticated");
      throw new Error('User not authenticated');
    }

    debug.info("History", "Querying payment history from database");
    const { data, error } = await supabase
      .rpc('get_user_payments', { 
        user_id: user.id,
        results_limit: limit
      });

    if (error) {
      debug.error("History", "Database error:", error);
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
  return {
    initiatePayment,
    checkPaymentStatus,
    pollTransactionStatus,
    handlePayment,
    getPaymentHistory
  };
};