import { Transaction } from './AddTransactionModal';
import { formatPKR } from '@/lib/format';
import { useState } from 'react';

interface Props {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: Props) {
  const [activeType, setActiveType] = useState<'all' | 'income' | 'expense' | 'personal'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

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

            return (
              <li key={tx.id} className="border-b-2 pb-2">
                <div className="flex justify-between font-semibold">
                  <div>
                    #{index + 1} • {tx.category}
                  </div>
                  <span className={`${color}`}>
                    {sign} {formatPKR(tx.amount)}
                  </span>
                </div>
                <div className="text-gray-600">
                  {tx.type} • {tx.date}
                </div>
                {tx.description && (
                  <div className="text-gray-500 italic">{tx.description}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
