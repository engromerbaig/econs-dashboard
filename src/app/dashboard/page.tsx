'use client';

import { useState } from 'react';
import AddTransactionModal, { Transaction } from '@/components/AddTransactionModal';
import TransactionList from '@/components/TransactionList';
import TransactionSummary from '@/components/TransactionSummary';
import { exportTransactionsToCSV } from '@/lib/exportTransactionsToCSV';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'month' | '3m' | '6m' | '1y' | '3y' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleAdd = (tx: Transaction) => {
    setTransactions([tx, ...transactions]);
  };

  const getDateXMonthsAgo = (months: number): string => {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d.toISOString().split('T')[0];
  };

  const filtered = transactions.filter((tx) => {
    const txDate = tx.date;
    const today = new Date().toISOString().split('T')[0];

    if (filterMode === 'all') return true;
    if (filterMode === 'month') return tx.date.startsWith(selectedMonth);
    if (filterMode === '3m') return txDate >= getDateXMonthsAgo(3) && txDate <= today;
    if (filterMode === '6m') return txDate >= getDateXMonthsAgo(6) && txDate <= today;
    if (filterMode === '1y') return txDate >= getDateXMonthsAgo(12) && txDate <= today;
    if (filterMode === '3y') return txDate >= getDateXMonthsAgo(36) && txDate <= today;
    return false;
  });

  const totalIncome = filtered.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = filtered.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  const companyProfit = totalIncome - totalExpense;
  const personalExpense = 0; // future support
  const totalNet = companyProfit - personalExpense;

  return (
    <main className="min-h-screen p-6 bg-white">
      <h1 className="text-2xl font-bold mb-4">Econs Dashboard</h1>

      {/* Summary Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-green-100 rounded shadow">
          <h2 className="text-sm font-semibold">Income</h2>
          <p className="text-lg font-bold">PKR {totalIncome.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 bg-red-100 rounded shadow">
          <h2 className="text-sm font-semibold">Expense</h2>
          <p className="text-lg font-bold">PKR {totalExpense.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 bg-blue-100 rounded shadow">
          <h2 className="text-sm font-semibold">Company Profit</h2>
          <p className="text-lg font-bold">PKR {companyProfit.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 bg-yellow-100 rounded shadow">
          <h2 className="text-sm font-semibold">Personal Expense</h2>
          <p className="text-lg font-bold">PKR {personalExpense.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 bg-purple-100 rounded shadow">
          <h2 className="text-sm font-semibold">Total Net</h2>
          <p className="text-lg font-bold">PKR {totalNet.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex gap-2 text-sm">
          {['month', '3m', '6m', '1y', '3y', 'all'].map((mode) => (
            <button
              key={mode}
              className={`px-3 py-1 rounded border ${
                filterMode === mode ? 'bg-black text-white' : 'bg-white text-black'
              }`}
              onClick={() => setFilterMode(mode as any)}
            >
              {mode === 'month' ? 'Month' : mode.toUpperCase()}
            </button>
          ))}
        </div>

        {filterMode === 'month' && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border px-3 py-1 rounded"
          />
        )}

        <button
          onClick={() => setModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Add Transaction
        </button>

        <button
          onClick={() => exportTransactionsToCSV(transactions, selectedMonth)}
          className="bg-gray-200 text-black px-4 py-2 rounded border border-gray-300 hover:bg-gray-300"
        >
          ⬇️ Export CSV
        </button>
      </div>

      {/* Transactions & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<TransactionList transactions={filtered} />
        <TransactionSummary transactions={transactions} selectedMonth={selectedMonth} />
      </div>

      {/* Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
      />
    </main>
  );
}