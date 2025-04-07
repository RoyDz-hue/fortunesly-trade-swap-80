// src/utils/transactionStyles.ts

// Status Colors
export const statusColors = {
  complete: '#FFD700',     // Golden
  approved: '#90EE90',     // Light green
  purchase: '#006400',     // Dark green
  sale: '#FFB6C1',        // Light red
  deposit: '#ADD8E6',      // Light blue
  withdrawal: 'linear-gradient(45deg, #FF6B6B, #FFB199)'  // Gradient
};

// Value Colors
export const valueColors = {
  positive: '#28a745',     // Green for received values
  negative: '#dc3545'      // Red for sent values
};

// Helper function to determine the background color based on transaction type
export const getTransactionBackground = (type: string, status: string) => {
  if (status.toLowerCase() === 'completed') return statusColors.complete;
  if (status.toLowerCase() === 'approved') return statusColors.approved;
  
  switch(type.toLowerCase()) {
    case 'purchase': return statusColors.purchase;
    case 'sale': return statusColors.sale;
    case 'deposit': return statusColors.deposit;
    case 'withdrawal': return statusColors.withdrawal;
    default: return 'transparent';
  }
};

// Helper function to format numerical values with color
export const formatValue = (value: string | number, isPositive: boolean) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const color = isPositive ? valueColors.positive : valueColors.negative;
  const prefix = isPositive ? '+' : '-';
  return {
    value: `${prefix}${Math.abs(numValue).toLocaleString()}`,
    color
  };
};

// Helper function to style transaction description
export const formatTransactionDescription = (description: string) => {
  // Split the description into parts
  const parts = description.split(/([+-]\d+(?:\.\d+)?[A-Z]+)/g);
  
  return parts.map((part, index) => {
    if (part.match(/[+-]\d+(?:\.\d+)?[A-Z]+/)) {
      const isPositive = part.startsWith('+');
      return {
        text: part,
        color: isPositive ? valueColors.positive : valueColors.negative,
        isValue: true
      };
    }
    return {
      text: part,
      color: 'inherit',
      isValue: false
    };
  });
};