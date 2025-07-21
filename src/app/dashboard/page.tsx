'use client';

import { useState, useEffect } from 'react';
import AddTransactionModal, { Transaction } from '@/components/AddTransactionModal';
import TransactionList from '@/components/TransactionList';
import TransactionSummary from '@/components/TransactionSummary';
import MonthlyNetProfitChart from '@/components/MonthlyNetProfitChart'; // Import the new component
import { exportTransactionsToCSV } from '@/lib/exportTransactionsToCSV';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'month' | '3m' | '6m' | '1y' | '3y' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/transactions');
        const data = await res.json();
        if (data.status === 'success') {
          setTransactions(data.transactions);
        } else {
          console.error('Failed to fetch transactions:', data.message);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, []);

  const handleAdd = (tx: Transaction) => {
    setTransactions([tx, ...transactions]);
  };

  // New delete handler
  const handleDelete = (transactionId: string) => {
    setTransactions(transactions.filter(tx => String(tx.id) !== String(transactionId)));
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
  const salaryTotal = filtered
    .filter(tx => tx.category.toLowerCase().includes('salary'))
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <main className="min-h-screen bg-white">
      {/* Top Navbar */}
      <div className="bg-econs-blue border-b px-6 py-3 flex justify-between items-center">
        <h1 className="text-lg text-white font-semibold">Econs Dashboard</h1>
        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="bg-red-500 cursor-pointer text-white px-4 py-1 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="p-6">
        {/* Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          <div className="p-10 items-center bg-green-100 rounded shadow">
            <h2 className="text-base font-semibold">Income</h2>
            <p className="text-2xl font-bold">PKR {totalIncome.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-10   items-center bg-red-100 rounded shadow">
            <h2 className="text-base font-semibold">Expense</h2>
            <p className="text-2xl font-bold">PKR {totalExpense.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-10  items-center bg-blue-100 rounded shadow">
            <h2 className="text-base font-semibold">Company Profit</h2>
            <p className="text-2xl font-bold">PKR {(totalIncome - totalExpense).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-10 items-center bg-indigo-100 rounded shadow">
            <h2 className="text-base font-semibold">Salary Total</h2>
            <p className="text-2xl font-bold">PKR {salaryTotal.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex gap-2 text-sm">
            {['month', '3m', '6m', '1y', '3y', 'all'].map((mode) => (
              <button
                key={mode}
                className={`px-3 py-1 cursor-pointer rounded border ${
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
            className="bg-black text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-800 transition"
          >
            + Add Transaction
          </button>

          <button
            onClick={() => exportTransactionsToCSV(transactions, selectedMonth)}
            className="bg-gray-200 text-black px-4 py-2 cursor-pointer rounded border border-gray-300 hover:bg-gray-300"
          >
            ⬇️ Export CSV
          </button>
        </div>

        {/* Transactions, Summary, and Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <TransactionList transactions={filtered} onDelete={handleDelete} />
          <TransactionSummary transactions={filtered} />
        </div>

        {/* Monthly Net Profit Chart */}
        <MonthlyNetProfitChart transactions={filtered} />
      </div>

      {/* Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
        existingTransactions={transactions}
      />
    </main>
  );
}