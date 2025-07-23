'use client';

import { Transaction } from './types';
import { formatPKR } from '@/lib/format';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrashAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

interface Props {
  transactions: Transaction[];
  onDelete: (transactionId: string) => void;
}

export default function TransactionList({ transactions, onDelete }: Props) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<'all' | 'income' | 'expense'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deletingBulkIds, setDeletingBulkIds] = useState<string[]>([]);

  const filtered = transactions.filter((tx) => {
    if (activeType === 'all') return true;
    return tx.type === activeType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'newest') return b.date.localeCompare(a.date);
    if (sort === 'oldest') return a.date.localeCompare(b.date);
    if (sort === 'highest') return b.amount - a.amount;
    if (sort === 'lowest') return a.amount - b.amount;
    return 0;
  });

  const getTransactionId = (transaction: Transaction): string => {
    if (transaction._id) return transaction._id.toString();
    if (transaction.id) return transaction.id.toString();
    throw new Error('Transaction has no valid ID');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sorted.map(getTransactionId));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = () => {
    toast(
      (t) => (
        <div>
          <p>Are you sure you want to delete {selectedIds.length} selected transactions?</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setDeletingBulkIds(selectedIds);
                const deletePromise = Promise.all(
                  selectedIds.map(async (id, index) => {
                    try {
                      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
                      await new Promise((resolve) => setTimeout(resolve, 200)); // Delay for staggered animation
                      onDelete(id);
                    } catch (err) {
                      console.error('Failed to delete transaction ID:', id, err);
                      throw err;
                    }
                  })
                ).then(() => {
                  setSelectedIds([]);
                  setSelectAll(false);
                  setBulkMode(false);
                  setDeletingBulkIds([]);
                });

                toast.promise(
                  deletePromise,
                  {
                    loading: 'Deleting transactions...',
                    success: 'Transactions deleted successfully!',
                    error: 'Failed to delete transactions. Please try again.',
                  },
                  {
                    style: {
                      background: '#f0fdf4',
                      color: '#16a34a',
                      border: '1px solid #16a34a',
                    },
                  }
                );
              }}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center',
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #dc2626',
        },
      }
    );
  };

  const handleDelete = async (transaction: Transaction) => {
    const transactionId = getTransactionId(transaction);

    toast(
      (t) => (
        <div>
          <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setDeletingId(transactionId);
                const deletePromise = new Promise<void>((resolve, reject) => {
                  fetch(`/api/transactions/${transactionId}`, {
                    method: 'DELETE',
                  })
                    .then(async (response) => {
                      const data = await response.json();
                      if (data.status === 'success') {
                        onDelete(transactionId);
                        resolve();
                      } else {
                        console.error('Delete failed:', data.message);
                        reject(new Error(data.message));
                      }
                    })
                    .catch((error) => {
                      console.error('Delete error:', error);
                      reject(error);
                    })
                    .finally(() => {
                      setDeletingId(null);
                    });
                });

                toast.promise(
                  deletePromise,
                  {
                    loading: 'Deleting transaction...',
                    success: 'Transaction deleted successfully!',
                    error: (err) => `Failed to delete transaction: ${err.message || 'Please try again.'}`,
                  },
                  {
                    style: {
                      background: '#f0fdf4',
                      color: '#16a34a',
                      border: '1px solid #16a34a',
                    },
                  }
                );
              }}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center',
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #dc2626',
        },
      }
    );
  };

  const handleTransactionClick = (tx: Transaction) => {
    // Determine the navigation target based on transaction properties
    let target: string;
    if (tx.category === 'Salary' && tx.employee) {
      target = tx.employee;
    } else if (tx.category === 'Fixed' && tx.fixedExpense) {
      target = tx.fixedExpense;
    } else {
      target = tx.category;
    }
    router.push(`/dashboard/${encodeURIComponent(target)}`);
  };

  return (
    <div>
      <Toaster position="top-left" reverseOrder={false} />
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Transactions</h2>
        <button
          onClick={() => {
            setBulkMode(!bulkMode);
            setSelectedIds([]);
            setSelectAll(false);
          }}
          className={`text-sm px-3 py-1 rounded border ${
            bulkMode ? 'bg-red-100 text-red-600' : 'bg-gray-200'
          }`}
        >
          {bulkMode ? 'Cancel Bulk Delete' : 'Bulk Delete'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-3 text-sm font-medium">
        {['all', 'income', 'expense'].map((type) => (
          <button
            key={type}
            className={`px-3 py-1 rounded cursor-pointer ${
              activeType === type ? 'bg-black text-white' : 'bg-gray-200 text-black'
            }`}
            onClick={() => setActiveType(type as any)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Sort & Bulk Controls */}
      <div className="mb-3 flex items-center gap-4">
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

        {bulkMode && sorted.length > 0 && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="accent-black"
              />
              Select All
            </label>
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600 transition"
              >
                🗑️ Delete Selected ({selectedIds.length})
              </button>
            )}
          </>
        )}
      </div>

      {/* Scrollable List */}
      {sorted.length === 0 ? (
        <p className="text-gray-500">No matching transactions.</p>
      ) : (
        <div className="max-h-[500px] overflow-y-auto pr-1">
          <ul className="space-y-2 text-sm">
            <AnimatePresence>
              {sorted.map((tx, index) => {
                let transactionId: string;
                try {
                  transactionId = getTransactionId(tx);
                } catch (error) {
                  console.error('Transaction missing ID:', tx);
                  return null;
                }

                const isIncome = tx.type === 'income';
                const color = isIncome ? 'text-green-600' : 'text-red-600';
                const sign = isIncome ? '+' : '−';
                const isDeleting = deletingId === transactionId || deletingBulkIds.includes(transactionId);

                return (
                  <motion.li
                    key={transactionId}
                    className={`border-b-2 pb-2 cursor-pointer hover:bg-gray-100 transition-colors ${
                      isDeleting ? 'opacity-50' : ''
                    }`}
                    initial={{ opacity: 1, x: 0 }}
                    animate={{ opacity: isDeleting ? 0.3 : 1 }}
                    exit={{
                      opacity: 0,
                      x: -200,
                      transition: {
                        duration: 0.3,
                        delay: deletingBulkIds.includes(transactionId) ? index * 0.1 : 0,
                      },
                    }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => {
                      // Prevent navigation when clicking checkbox or delete button
                      if (
                        (e.target as HTMLElement).closest('input[type="checkbox"]') ||
                        (e.target as HTMLElement).closest('button')
                      ) {
                        return;
                      }
                      handleTransactionClick(tx);
                    }}
                  >
                    <div className="flex justify-between items-center font-semibold">
                      <div className="flex items-center gap-2">
                        {bulkMode && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(transactionId)}
                            onChange={() => toggleSelect(transactionId)}
                            className="accent-black"
                            disabled={isDeleting}
                          />
                        )}
                        <span>
                          #{index + 1} • {tx.category}
                          {tx.employee && ` • ${tx.employee}`}
                          {tx.fixedExpense && ` • ${tx.fixedExpense}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={color}>
                          {sign} {formatPKR(tx.amount)}
                        </span>
                        {!bulkMode && (
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
                        )}
                      </div>
                    </div>
                    <div className="text-gray-600">
                      {tx.type} • {tx.date}
                    </div>
                    {tx.description && (
                      <div className="text-gray-500 italic">{tx.description}</div>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </div>
  );
}