
// src/components/TransactionList.tsx
import { formatTransactionTime } from '@/utils/tradingUtils';
import { 
  getTransactionBackground, 
  formatValue, 
  formatTransactionDescription 
} from '@/utils/transactionStyles';
import styles from './TransactionList.module.css';

export const TransactionList = ({ transactions }) => {
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
