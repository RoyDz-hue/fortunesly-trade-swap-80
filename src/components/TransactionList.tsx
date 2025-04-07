
import React from 'react';
import styles from './TransactionList.module.css';
import { formatTransactionTime, getStatusColorClass, getAmountColorClass, formatTransactionAmount } from "@/utils/transactionFormatters";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  description?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  emptyMessage?: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  emptyMessage = "No transactions found" 
}) => {
  if (!transactions || transactions.length === 0) {
    return <div className="text-center text-gray-500 py-8">{emptyMessage}</div>;
  }

  return (
    <div className={styles.transactionListContainer}>
      <table className={styles.transactionTable}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className={styles.transactionRow}>
              <td className={styles.transactionCell}>
                <span className="capitalize font-medium">{transaction.type}</span>
              </td>
              <td className={styles.transactionCell}>
                <span 
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColorClass(transaction.status)}`}
                >
                  {transaction.status}
                </span>
              </td>
              <td className={`${styles.transactionCell} ${getAmountColorClass(transaction.type)}`}>
                <span className="font-bold">
                  {formatTransactionAmount(transaction.amount, transaction.type)}
                </span>
                <span className="ml-1">{transaction.currency}</span>
              </td>
              <td className={styles.transactionCell}>
                {formatTransactionTime(transaction.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;
