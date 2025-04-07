
import { format } from "date-fns";

/**
 * Format a transaction timestamp to a user-friendly format
 * @param timestamp ISO timestamp string
 * @returns Formatted date string
 */
export function formatTransactionTime(timestamp: string): string {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    return format(date, "MMM d, HH:mm");
  } catch (error) {
    console.error('Error formatting transaction time:', error);
    return 'Invalid date';
  }
}

/**
 * Format a transaction amount with appropriate sign
 * @param amount Transaction amount
 * @param type Transaction type
 * @returns Formatted amount string with + or - prefix
 */
export function formatTransactionAmount(amount: number, type: string): string {
  if (type === 'withdraw' || type === 'sale') {
    return `-${amount.toFixed(8)}`;
  } else if (type === 'deposit' || type === 'purchase') {
    return `+${amount.toFixed(8)}`;
  }
  return amount.toFixed(8);
}

/**
 * Get the appropriate color class for a transaction status
 * @param status Transaction status
 * @returns CSS class name
 */
export function getStatusColorClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'complete':
      return 'bg-yellow-400'; // Golden
    case 'approved':
      return 'bg-green-200'; // Light green
    case 'purchase':
      return 'bg-green-800 text-white'; // Dark green
    case 'sale':
      return 'bg-red-200'; // Light red
    case 'deposit':
      return 'bg-blue-200'; // Light blue
    case 'withdrawal':
      return 'bg-gradient-to-r from-red-400 to-orange-300'; // Gradient
    default:
      return 'bg-gray-200'; // Default
  }
}

/**
 * Get the appropriate color class for a transaction amount
 * @param type Transaction type
 * @returns CSS class name
 */
export function getAmountColorClass(type: string): string {
  if (type === 'withdraw' || type === 'sale') {
    return 'text-red-600'; // Red for outgoing
  } else if (type === 'deposit' || type === 'purchase') {
    return 'text-green-600'; // Green for incoming
  }
  return 'text-gray-700'; // Default
}
