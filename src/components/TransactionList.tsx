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

  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

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

  const handleBulkDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected transactions?`
    );
    if (!confirmed) return;

    for (const id of selectedIds) {
      try {
        await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        onDelete(id);
      } catch (err) {
        console.error('Failed to delete transaction ID:', id, err);
      }
    }

    setSelectedIds([]);
    setSelectAll(false);
    setBulkMode(false);
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

      {/* List */}
      {sorted.length === 0 ? (
        <p className="text-gray-500">No matching transactions.</p>
      ) : (
        <ul className="space-y-2 text-sm">
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
            const isDeleting = deletingId === transactionId;

            return (
              <li key={transactionId} className="border-b-2 pb-2">
                <div className="flex justify-between items-center font-semibold">
                  <div className="flex items-center gap-2">
                    {bulkMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(transactionId)}
                        onChange={() => toggleSelect(transactionId)}
                        className="accent-black"
                      />
                    )}
                    <span>
                      #{index + 1} • {tx.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`${color}`}>
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
