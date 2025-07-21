import { Transaction } from './types';
import { formatPKR } from '@/lib/format';
import { useState } from 'react';
import { FaTrashAlt } from 'react-icons/fa';

interface Props {
  transactions: Transaction[];
  onDelete: (transactionId: string) => void; // Expects string ID
}

export default function TransactionList({ transactions, onDelete }: Props) {
  const [activeType, setActiveType] = useState<'all' | 'income' | 'expense' | 'personal'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = transactions.filter(tx => {
    if (activeType === 'all') return true;
    if (activeType === 'personal') return tx.category.toLowerCase().includes('personal');
    return tx.type === activeType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'newest') return b.date.localeCompare(a.date);
    if (sort === 'oldest') return a.date.localeCompare(b.date);
    if (sort === 'highest') return b.amount - a.amount;
    if (sort === 'lowest') return a.amount - b.amount;
    return 0;
  });

  // Helper function to get consistent ID string
  const getTransactionId = (transaction: Transaction): string => {
    // Prioritize _id (MongoDB ObjectId) over id (temporary local ID)
    if (transaction._id) {
      return transaction._id.toString();
    }
    if (transaction.id) {
      return transaction.id.toString();
    }
    throw new Error('Transaction has no valid ID');
  };

  const handleDelete = async (transaction: Transaction) => {
    const confirmed = window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.');
    
    if (!confirmed) return;

    try {
      const transactionId = getTransactionId(transaction);
      setDeletingId(transactionId);

      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Call the parent component's delete handler with the same ID format
        onDelete(transactionId);
      } else {
        alert('Failed to delete transaction: ' + data.message);
        console.error('Delete failed:', data.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete transaction. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Transactions</h2>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-3 text-sm font-medium">
        {['all', 'income', 'expense'].map((type) => (
          <button
            key={type}
            className={`px-3 py-1 rounded cursor-pointer  ${
              activeType === type ? 'bg-black text-white' : 'bg-gray-200 text-black'
            }`}
            onClick={() => setActiveType(type as any)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="mb-3">
        <select
          className="border px-2 py-1 rounded text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="newest">Sort by Newest</option>
          <option value="oldest">Sort by Oldest</option>
          <option value="highest">Sort by Highest Amount</option>
          <option value="lowest">Sort by Lowest Amount</option>
        </select>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <p className="text-gray-500">No matching transactions.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {sorted.map((tx, index) => {
            const isIncome = tx.type === 'income';
            const color = isIncome ? 'text-green-600' : 'text-red-600';
            const sign = isIncome ? '+' : '−';
            
            let transactionId: string;
            try {
              transactionId = getTransactionId(tx);
            } catch (error) {
              console.error('Transaction missing ID:', tx);
              return null; // Skip transactions without valid IDs
            }

            const isDeleting = deletingId === transactionId;

            return (
              <li key={transactionId} className="border-b-2 pb-2">
                <div className="flex justify-between items-center font-semibold">
                  <div className="flex-1">
                    #{index + 1} • {tx.category}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`${color}`}>
                      {sign} {formatPKR(tx.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(tx)}
                      disabled={isDeleting}
                      className={`p-1 rounded hover:bg-red-100 transition-colors ${
                        isDeleting ? 'opacity-50 cursor-not-allowed' : 'text-red-500 hover:text-red-700'
                      }`}
                      title="Delete transaction"
                    >
                      <FaTrashAlt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-gray-600">
                  {tx.type} • {tx.date}
                </div>
                {tx.description && (
                  <div className="text-gray-500 italic">{tx.description}</div>
                )}
                {isDeleting && (
                  <div className="text-xs text-blue-600 mt-1">Deleting...</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}