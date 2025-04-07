import { useState, useEffect } from "react";
import { Transaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Updated status colors according to your requirements
const statusColors = {
  completed: { background: '#FFD700' },  // Golden
  approved: { background: '#90EE90' },   // Light green
  rejected: { background: '#dc3545' },   // Red
  forfeited: { background: '#gray' }     // Gray
};

// Updated type colors according to your requirements
const typeColors = {
  purchase: { background: '#006400', color: 'white' },  // Dark green
  sale: { background: '#FFB6C1' },                     // Light red
  deposit: { background: '#ADD8E6' },                  // Light blue
  withdrawal: { background: 'linear-gradient(45deg, #FF6B6B, #FFB199)' }  // Gradient
};

// ... keep existing useState and useEffect code ...

const RecentTransactions = () => {
  // ... keep existing state declarations ...

  // Modified function to format transaction amounts with colors
  const formatTransactionChanges = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'deposit':
        return (
          <span style={{ color: '#28a745' }}>  {/* Green for received */}
            +{transaction.amount} {transaction.currency}
          </span>
        );
      case 'withdrawal':
        return (
          <span style={{ color: '#dc3545' }}>  {/* Red for sent */}
            -{transaction.amount} {transaction.currency}
          </span>
        );
      case 'purchase':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: '#28a745' }}>
              +{transaction.amount} {transaction.currency}
            </span>
            {transaction.secondaryAmount > 0 && (
              <span style={{ color: '#dc3545' }}>
                -{transaction.secondaryAmount} {transaction.secondaryCurrency}
              </span>
            )}
          </div>
        );
      case 'sale':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: '#dc3545' }}>
              -{transaction.amount} {transaction.currency}
            </span>
            {transaction.secondaryAmount > 0 && (
              <span style={{ color: '#28a745' }}>
                +{transaction.secondaryAmount} {transaction.secondaryCurrency}
              </span>
            )}
          </div>
        );
      default:
        return `${transaction.amount} ${transaction.currency}`;
    }
  };

  return (
    <Card style={{ border: '1px solid #e5e7eb', height: '100%' }}>
      <CardHeader style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <CardTitle style={{ 
            fontSize: '1.125rem', 
            fontWeight: 600 
          }}>
            Recent Transactions
          </CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)',
              height: '2rem' 
            }}>
              <TabsTrigger value="all" style={{ fontSize: '0.75rem' }}>All</TabsTrigger>
              <TabsTrigger value="deposit" style={{ fontSize: '0.75rem' }}>Deposits</TabsTrigger>
              <TabsTrigger value="withdrawal" style={{ fontSize: '0.75rem' }}>Withdrawals</TabsTrigger>
              <TabsTrigger value="trade" style={{ fontSize: '0.75rem' }}>Trades</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexGrow: 1, overflow: 'auto' }}>
          {isLoading ? (
            renderSkeletons()
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#dc3545' }}>
              <p>{error}</p>
              <button 
                onClick={() => fetchTransactions()} 
                style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.875rem',
                  color: 'var(--fortunesly-primary)',
                  cursor: 'pointer'
                }}
              >
                Try again
              </button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              <p>No {activeTab !== "all" ? activeTab : ""} transactions found.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Your transaction history will appear here.
              </p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid #e5e7eb' }}>
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  style={{ 
                    padding: '1rem',
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background-color 0.2s',
                    background: typeColors[transaction.type]?.background || 'transparent',
                    color: typeColors[transaction.type]?.color || 'inherit'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <Badge variant="outline" style={{
                        ...typeColors[transaction.type],
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Badge>
                      <Badge variant="outline" style={{
                        ...statusColors[transaction.status],
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatDate(transaction.createdAt)}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.25rem',
                    '@media (min-width: 640px)': {
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                      {getTransactionDescription(transaction)}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {formatTransactionChanges(transaction)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #e5e7eb', 
          marginTop: 'auto' 
        }}>
          <button 
            style={{ 
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              textAlign: 'center',
              color: 'var(--fortunesly-primary)',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onClick={handleViewAllClick}
          >
            View All Transactions
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
