
// src/components/TransactionList.tsx
import { formatTransactionTime } from '@/utils/tradingUtils';
import styles from './TransactionList.module.css';

export const TransactionList = ({ transactions }) => {
  // Helper function to get background color based on type and status
  const getTransactionBackground = (type: string, status: string) => {
    if (status.toLowerCase() === 'completed') return '#FFD700'; // Golden
    if (status.toLowerCase() === 'approved') return '#90EE90'; // Light green
    
    switch(type.toLowerCase()) {
      case 'purchase': return '#006400'; // Dark green
      case 'sale': return '#FFB6C1'; // Light red
      case 'deposit': return '#ADD8E6'; // Light blue
      case 'withdrawal': return 'linear-gradient(45deg, #FF6B6B, #FFB199)'; // Gradient
      default: return 'transparent';
    }
  };

  // Helper function to format numerical values with color
  const formatValue = (value: number | string, isPositive: boolean) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const color = isPositive ? '#28a745' : '#dc3545';
    const prefix = isPositive ? '+' : '-';
    return {
      value: `${prefix}${Math.abs(numValue).toLocaleString()}`,
      color
    };
  };

  // Helper function to format transaction description with colored values
  const formatTransactionDescription = (description: string) => {
    // Split the description into parts
    const parts = description.split(/([+-]\d+(?:\.\d+)?[A-Z]+)/g);
    
    return parts.map((part, index) => {
      if (part.match(/[+-]\d+(?:\.\d+)?[A-Z]+/)) {
        const isPositive = part.startsWith('+');
        return {
          text: part,
          color: isPositive ? '#28a745' : '#dc3545',
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

  return (
    <div className={styles.transactionList}>
      {transactions.map(transaction => (
        <div 
          key={transaction.id}
          className={styles.transactionItem}
          style={{ 
            background: getTransactionBackground(transaction.type, transaction.status),
            borderRadius: '8px',
            padding: '16px',
            margin: '8px 0',
            color: transaction.type.toLowerCase() === 'purchase' ? 'white' : 'inherit'
          }}
        >
          {/* Transaction Type and Status */}
          <div className={styles.header}>
            <span className={styles.type}>{transaction.type}</span>
            <span className={styles.status}>{transaction.status}</span>
          </div>

          {/* Date */}
          <div className={styles.date}>
            {formatTransactionTime(transaction.created_at)}
          </div>

          {/* Description with colored values */}
          <div className={styles.description}>
            {formatTransactionDescription(transaction.description).map((part, index) => (
              <span 
                key={index}
                style={{ color: part.color }}
                className={part.isValue ? styles.value : ''}
              >
                {part.text}
              </span>
            ))}
          </div>

          {/* Amount with color */}
          <div className={styles.amount}>
            {formatValue(
              transaction.amount,
              ['purchase', 'deposit'].includes(transaction.type.toLowerCase())
            ).value}
            {' '}
            <span className={styles.currency}>{transaction.currency}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
