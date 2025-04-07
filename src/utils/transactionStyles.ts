
// src/utils/transactionStyles.ts

// Status Colors - Updated for dark theme with black and purple
export const statusColors = {
  complete: '#9b87f5',    // Light purple
  approved: '#7E69AB',    // Medium purple
  purchase: '#6E59A5',    // Dark purple
  sale: '#121212',        // Almost black
  deposit: '#8B5CF6',     // Bright purple
  withdrawal: 'linear-gradient(45deg, #121212, #403E43)'  // Gradient from black to dark gray
};

// Value Colors
export const valueColors = {
  positive: '#9b87f5',    // Light purple for received values
  negative: '#f44336'     // Red for sent values - kept distinct for clarity
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
    default: return 'var(--gradient-accent)';
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
