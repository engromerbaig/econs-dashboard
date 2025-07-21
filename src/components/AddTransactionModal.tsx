'use client';

import { useEffect, useState, useMemo } from 'react';
import Modal from './Modal';
import { incomeCategories, expenseCategories, salaryMap } from './constants';
import { Transaction, TransactionType } from './types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
  existingTransactions: Transaction[];
  selectedMonth: string;
  filterMode: 'month' | '3m' | '6m' | '1y' | '3y' | 'all';
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
  existingTransactions,
  selectedMonth,
  filterMode,
}: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [employee, setEmployee] = useState('');
  const [date, setDate] = useState(() => {
    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // If we're in month filter mode and selectedMonth is current month, use today's date
    // Otherwise, use the 1st day of the selected month
    if (filterMode === 'month' && selectedMonth === currentMonth) {
      return now.toISOString().slice(0, 10);
    } else if (filterMode === 'month') {
      return `${selectedMonth}-01`;
    } else {
      // For other filter modes, default to today
      return now.toISOString().slice(0, 10);
    }
  });
  const [description, setDescription] = useState('');
  const [allowEditSalary, setAllowEditSalary] = useState(false);

  // Update date when selectedMonth or filterMode changes
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      if (filterMode === 'month' && selectedMonth === currentMonth) {
        setDate(now.toISOString().slice(0, 10));
      } else if (filterMode === 'month') {
        setDate(`${selectedMonth}-01`);
      } else {
        setDate(now.toISOString().slice(0, 10));
      }
    }
  }, [selectedMonth, filterMode, isOpen]);

  const isSalary = type === 'expense' && category === 'Salary';
  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  const transactionMonth = useMemo(() => {
    const dateObj = new Date(date);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
  }, [date]);

  const alreadyPaidEmployees = useMemo(() => {
    return existingTransactions
      .filter(
        (tx) =>
          tx.type === 'expense' &&
          tx.category === 'Salary' &&
          tx.employee &&
          new Date(tx.date).toISOString().slice(0, 7) === transactionMonth
      )
      .map((tx) => tx.employee!)
      .filter((emp, i, arr) => arr.indexOf(emp) === i);
  }, [existingTransactions, transactionMonth]);

  useEffect(() => {
    if (isSalary && employee && salaryMap[employee]) {
      setAmount(salaryMap[employee].toString());
      setDescription(`Salary for ${employee}`);
    }
  }, [employee, isSalary]);

  useEffect(() => {
    if (isSalary && employee && alreadyPaidEmployees.includes(employee)) {
      setEmployee('');
    }
  }, [transactionMonth, isSalary, employee, alreadyPaidEmployees]);

  const isDuplicateSalary = (): boolean => {
    return isSalary && !!employee && alreadyPaidEmployees.includes(employee as string);
  };

  const handleSubmit = async () => {
    if (!amount || !date || (!category && !customCategory)) {
      alert('Fill all required fields');
      return;
    }

    if (isDuplicateSalary()) {
      const monthName = new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' });
      alert(`${employee} already received salary for ${monthName}.`);
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now(),
      type,
      date,
      amount: parseInt(amount),
      category: customCategory || category,
      description,
      ...(isSalary ? { employee } : {}),
    };

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
      });

      const data = await res.json();

      if (res.ok) {
        onAdd(newTransaction);
        onClose();

        setAmount('');
        setCategory('');
        setCustomCategory('');
        // Reset date to appropriate default
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        if (filterMode === 'month' && selectedMonth === currentMonth) {
          setDate(now.toISOString().slice(0, 10));
        } else if (filterMode === 'month') {
          setDate(`${selectedMonth}-01`);
        } else {
          setDate(now.toISOString().slice(0, 10));
        }
        
        setDescription('');
        setType('expense');
        setEmployee('');
        setAllowEditSalary(false);
      } else {
        alert(`Error: ${data.message || 'Something went wrong'}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit transaction');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

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

      <input
        type="number"
        placeholder="Amount (PKR)"
        className="w-full mb-3 border px-3 py-2 rounded"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={isSalary && !allowEditSalary}
      />

      {isSalary && (
        <label className="text-xs text-gray-600 mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={allowEditSalary}
            onChange={(e) => setAllowEditSalary(e.target.checked)}
          />
          Edit Salary Amount
        </label>
      )}

      <select
        className="w-full mb-3 border px-3 py-2 rounded"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">Select Category</option>
        {currentCategories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      {isSalary && (
        <select
          className="w-full mb-3 border px-3 py-2 rounded"
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
        >
          <option value="">Select Employee</option>
          {Object.keys(salaryMap).map((emp) => {
            const isPaid = alreadyPaidEmployees.includes(emp);
            return (
              <option key={emp} value={emp} disabled={isPaid}>
                {emp} {isPaid ? '(Paid)' : ''}
              </option>
            );
          })}
        </select>
      )}

      <input
        type="date"
        className="w-full mb-3 border px-3 py-2 rounded"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <input
        type="text"
        placeholder="Or add new category"
        className="w-full mb-3 border px-3 py-2 rounded"
        value={customCategory}
        onChange={(e) => setCustomCategory(e.target.value)}
        disabled={isSalary}
      />

      <input
        type="text"
        placeholder="Description (optional)"
        className="w-full mb-4 border px-3 py-2 rounded"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-black cursor-pointer text-white py-2 rounded"
      >
        Save
      </button>
    </Modal>
  );
}