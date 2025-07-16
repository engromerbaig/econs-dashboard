'use client';

import { useState } from 'react';
import AddTransactionModal, { Transaction } from '@/components/AddTransactionModal';
import TransactionList from '@/components/TransactionList';
import TransactionSummary from '@/components/TransactionSummary';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2025-07');

  const handleAdd = (tx: Transaction) => {
    setTransactions([tx, ...transactions]);
  };

  const filtered = transactions.filter(tx => tx.date.startsWith(selectedMonth));
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

      {/* Month Picker + Add Button */}
      <div className="mb-6 flex items-center gap-4">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border px-3 py-1 rounded"
        />
        <button
          onClick={() => setModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Add Transaction
        </button>
      </div>

      {/* Transactions & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TransactionList transactions={transactions} selectedMonth={selectedMonth} />
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
