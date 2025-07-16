'use client';

import { useState } from 'react';
import { formatPKR } from '@/lib/format';
import Modal from '@/components/Modal';

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
}

const incomeCategories = ['OK Builder', 'Tanveer Associate', 'Khaybaani Builders'];
const expenseCategories = ['Utilities', 'Salary', 'Petrol', 'Prints', 'Misc'];

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState('2025-07');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const filtered = transactions.filter(tx => tx.date.startsWith(selectedMonth));
  const totalIncome = filtered.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = filtered.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleAddTransaction = () => {
    if (!amount || !date || (!category && !customCategory)) return alert('Fill all required fields');

    const newTx: Transaction = {
      id: Date.now(),
      type,
      date,
      amount: parseInt(amount),
      category: customCategory || category,
      description,
    };

    setTransactions([newTx, ...transactions]);
    setModalOpen(false);
    // Reset
    setAmount('');
    setCategory('');
    setCustomCategory('');
    setDate('');
    setDescription('');
  };

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  return (
    <main className="min-h-screen p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6">Econs Dashboard</h1>

      <div className="mb-6">
        <label className="mr-2 font-medium">Select Month:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded px-3 py-1"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-green-100 rounded">
          <h2 className="text-lg font-semibold">Income</h2>
          <p className="text-xl">{formatPKR(totalIncome)}</p>
        </div>
        <div className="p-4 bg-red-100 rounded">
          <h2 className="text-lg font-semibold">Expense</h2>
          <p className="text-xl">{formatPKR(totalExpense)}</p>
        </div>
        <div className="p-4 bg-blue-100 rounded">
          <h2 className="text-lg font-semibold">Balance</h2>
          <p className="text-xl">{formatPKR(balance)}</p>
        </div>
      </div>

      <button
        onClick={() => setModalOpen(true)}
        className="mb-6 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        + Add New Transaction
      </button>

      <div className="bg-gray-50 rounded p-4 shadow-sm">
        <h3 className="text-lg font-bold mb-3">Transactions</h3>
        {filtered.length === 0 ? (
          <p>No transactions found for this month.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((tx) => (
              <li key={tx.id} className="border-b py-2">
                <div className="flex justify-between">
                  <span>{tx.category}</span>
                  <span>{formatPKR(tx.amount)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {tx.type} • {tx.date}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal for Add Transaction */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

        {/* Type Toggle */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setType('income')}
            className={`px-4 py-2 rounded ${type === 'income' ? 'bg-green-200' : 'bg-gray-200'}`}
          >
            Income
          </button>
          <button
            onClick={() => setType('expense')}
            className={`px-4 py-2 rounded ${type === 'expense' ? 'bg-red-200' : 'bg-gray-200'}`}
          >
            Expense
          </button>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Amount (PKR)</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Category</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select...</option>
            {currentCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Or Add New Category</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Date</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Description (optional)</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          onClick={handleAddTransaction}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          Save
        </button>
      </Modal>
    </main>
  );
}
