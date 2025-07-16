'use client';

import { useState } from 'react';
import Modal from './Modal';

type TransactionType = 'income' | 'expense';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
}

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
}

const incomeCategories = ['OK Builder', 'Tanveer Associate', 'Khaybaani Builders'];
const expenseCategories = ['Utilities', 'Salary', 'Petrol', 'Prints', 'Misc'];

export default function AddTransactionModal({ isOpen, onClose, onAdd }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = () => {
    if (!amount || !date || (!category && !customCategory)) {
      alert('Fill all required fields');
      return;
    }

    onAdd({
      id: Date.now(),
      type,
      date,
      amount: parseInt(amount),
      category: customCategory || category,
      description,
    });

    // Reset form
    setAmount('');
    setCategory('');
    setCustomCategory('');
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setType('expense');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Add Transaction</h2>
      <div className="flex gap-4 mb-4">
        <button onClick={() => setType('income')} className={`px-4 py-2 rounded ${type === 'income' ? 'bg-green-200' : 'bg-gray-200'}`}>Income</button>
        <button onClick={() => setType('expense')} className={`px-4 py-2 rounded ${type === 'expense' ? 'bg-red-200' : 'bg-gray-200'}`}>Expense</button>
      </div>

      <input type="number" placeholder="Amount (PKR)" className="w-full mb-3 border px-3 py-2 rounded" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <select className="w-full mb-3 border px-3 py-2 rounded" value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Select Category</option>
        {currentCategories.map(c => <option key={c}>{c}</option>)}
      </select>
      <input type="text" placeholder="Or add new category" className="w-full mb-3 border px-3 py-2 rounded" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
      <input type="date" className="w-full mb-3 border px-3 py-2 rounded" value={date} onChange={(e) => setDate(e.target.value)} />
      <input type="text" placeholder="Description (optional)" className="w-full mb-4 border px-3 py-2 rounded" value={description} onChange={(e) => setDescription(e.target.value)} />

      <button onClick={handleSubmit} className="w-full bg-black text-white py-2 rounded">Save</button>
    </Modal>
  );
}
