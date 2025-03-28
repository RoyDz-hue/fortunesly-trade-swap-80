
import { PayHeroCredentials, PayHeroStkPushRequest, PayHeroWithdrawRequest, PayHeroTransactionStatus } from "@/types";

// This would be stored in environment variables in a real application
const DEFAULT_CREDENTIALS: PayHeroCredentials = {
  apiUsername: 'hYakRT5HZaNPofgw3LSP',
  apiPassword: 'ECsKFTrPKQHdfCa63HPDgMdYS7rXSxaX0GlwBMeW'
};

// Default channel IDs (would be managed by admin in real app)
const DEFAULT_DEPOSIT_CHANNEL_ID = 911;
const DEFAULT_WITHDRAWAL_CHANNEL_ID = 12345;

// Generate Basic Auth Token
const getAuthToken = (credentials: PayHeroCredentials = DEFAULT_CREDENTIALS): string => {
  return 'Basic ' + btoa(`${credentials.apiUsername}:${credentials.apiPassword}`);
};

// Make API Request
const makeRequest = async <T>(
  url: string, 
  method: 'GET' | 'POST', 
  data?: any, 
  credentials: PayHeroCredentials = DEFAULT_CREDENTIALS
): Promise<T> => {
  try {
    const headers = {
      'Authorization': getAuthToken(credentials),
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers,
      credentials: 'omit'
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`PayHero API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("PayHero API request failed:", error);
    throw error;
  }
};

// Initialize Payment (STK Push)
export const initiateDeposit = async (
  amount: number,
  phoneNumber: string,
  customerName: string,
  channelId: number = DEFAULT_DEPOSIT_CHANNEL_ID,
): Promise<PayHeroTransactionStatus> => {
  // Generate a unique reference for this transaction
  const reference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const requestData: PayHeroStkPushRequest = {
    amount,
    phone_number: phoneNumber,
    channel_id: channelId,
    provider: "m-pesa",
    external_reference: reference,
    customer_name: customerName,
    callback_url: `${window.location.origin}/api/payment-callback` // This would be a backend endpoint in production
  };

  return await makeRequest<PayHeroTransactionStatus>(
    'https://backend.payhero.co.ke/api/v2/payments', 
    'POST', 
    requestData
  );
};

// Initialize Withdrawal (to Mobile)
export const initiateWithdrawal = async (
  amount: number,
  phoneNumber: string,
  networkCode: string = '63902', // Default for Safaricom M-Pesa
  channelId: number = DEFAULT_WITHDRAWAL_CHANNEL_ID,
): Promise<PayHeroTransactionStatus> => {
  // Generate a unique reference for this transaction
  const reference = `WIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const requestData: PayHeroWithdrawRequest = {
    external_reference: reference,
    amount,
    phone_number: phoneNumber,
    network_code: networkCode,
    callback_url: `${window.location.origin}/api/withdrawal-callback`, // This would be a backend endpoint in production
    channel: "mobile",
    channel_id: channelId,
    payment_service: "b2c"
  };

  return await makeRequest<PayHeroTransactionStatus>(
    'https://backend.payhero.co.ke/api/v2/withdraw', 
    'POST', 
    requestData
  );
};

// Check Transaction Status
export const checkTransactionStatus = async (
  reference: string
): Promise<PayHeroTransactionStatus> => {
  return await makeRequest<PayHeroTransactionStatus>(
    `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${reference}`, 
    'GET'
  );
};
