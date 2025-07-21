'use client';

import { useEffect, useState, useMemo} from 'react';
import Modal from './Modal';

type TransactionType = 'income' | 'expense';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
  existingTransactions: Transaction[];
}

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
  employee?: string;
}

const incomeCategories = ['OK Builder', 'Tanveer Associate', 'Khaybaani Builders'];
const expenseCategories = ['Utilities', 'Salary', 'Petrol', 'Prints', 'Misc'];

const salaryMap: Record<string, number> = {
  'Ameer Hamza': 39000,
  'Faraz': 23000,
  'Ibrahim': 33000,
  'Tehseen': 20044,
  'Haris': 23812,
  'Omer Baig': 25000,
  'Rafiq': 47700,
  'Usman': 2000,
  'Cleaner': 1500,
  'Jawad': 31500,
};

export default function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
  existingTransactions,
}: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [employee, setEmployee] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [allowEditSalary, setAllowEditSalary] = useState(false);

  const isSalary = type === 'expense' && category === 'Salary';
  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  // More robust month extraction
  const selectedMonth = useMemo(() => {
    const dateObj = new Date(date);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
  }, [date]);

  // Get employees who have already been paid for the selected month
  const alreadyPaidEmployees = useMemo(() => {
    return existingTransactions
      .filter((tx) => {
        if (tx.type !== 'expense' || tx.category !== 'Salary' || !tx.employee) {
          return false;
        }
        
        // Extract month from transaction date
        const txDate = new Date(tx.date);
        const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        
        return txMonth === selectedMonth;
      })
      .map((tx) => tx.employee)
      .filter((emp): emp is string => emp !== undefined);
  }, [existingTransactions, selectedMonth]);

  useEffect(() => {
    if (isSalary && employee && salaryMap[employee]) {
      setAmount(salaryMap[employee].toString());
      setDescription(`Salary for ${employee}`);
    }
  }, [employee, isSalary]);

  // Reset employee selection when date changes and current employee is already paid
  useEffect(() => {
    if (isSalary && employee && alreadyPaidEmployees.includes(employee)) {
      setEmployee('');
    }
  }, [selectedMonth, isSalary, employee, alreadyPaidEmployees]);

  const isDuplicateSalary = (): boolean => {
    if (!isSalary || !employee) return false;
    return alreadyPaidEmployees.includes(employee);
  };

  const handleSubmit = async () => {
    if (!amount || !date || (!category && !customCategory)) {
      alert('Fill all required fields');
      return;
    }

    if (isDuplicateSalary()) {
      const selectedDate = new Date(date);
      const monthName = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
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
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
      });

      const data = await response.json();

      if (response.ok) {
        onAdd(newTransaction);
        onClose();

        // Reset form
        setAmount('');
        setCategory('');
        setCustomCategory('');
        setDate(new Date().toISOString().slice(0, 10));
        setDescription('');
        setType('expense');
        setEmployee('');
        setAllowEditSalary(false);
      } else {
        alert(`Error: ${data.message || 'Something went wrong'}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
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
              <option
                key={emp}
                value={emp}
                disabled={isPaid}
                style={{ color: isPaid ? 'gray' : 'inherit' }}
              >
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

      <button onClick={handleSubmit} className="w-full bg-black cursor-pointer text-white py-2 rounded">
        Save
      </button>
    </Modal>
  );
}