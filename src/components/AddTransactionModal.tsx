'use client';

import { useEffect, useState, useMemo } from 'react';
import Modal from './Modal';
import { incomeCategories, expenseCategories, salaryMap, fixedExpenseMap } from './constants';
import { Transaction, TransactionType } from './types';
import { FaEdit, FaTimes, FaPlus } from 'react-icons/fa';
import { formatPKR } from '@/lib/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
  onAddBatch: (transactions: Transaction[]) => void;
  existingTransactions: Transaction[];
  selectedMonth: string;
  filterMode: 'month' | '3m' | '6m' | '1y' | '3y' | 'all';
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
  onAddBatch,
  existingTransactions,
  selectedMonth,
  filterMode,
}: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [employee, setEmployee] = useState('');
  const [fixedExpense, setFixedExpense] = useState('');
  const [description, setDescription] = useState('');
  const [allowEditAmount, setAllowEditAmount] = useState(false);
  const [batchTransactions, setBatchTransactions] = useState<Transaction[]>([]);
  const [multipleAmounts, setMultipleAmounts] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current date for max attribute
  const currentDate = new Date().toISOString().split('T')[0];

  // Initialize date with proper logic
  const [date, setDate] = useState(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (filterMode === 'month' && selectedMonth === currentMonth) {
      return now.toISOString().slice(0, 10);
    } else if (filterMode === 'month') {
      return `${selectedMonth}-01`;
    } else {
      return now.toISOString().slice(0, 10);
    }
  });

  // Generate unique ID
  const generateUniqueId = () => {
    return Date.now() + Math.random() * 1000000;
  };

  // Update date when filterMode or selectedMonth changes
  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (filterMode === 'month' && selectedMonth === currentMonth) {
      setDate(now.toISOString().slice(0, 10));
    } else if (filterMode === 'month') {
      const selectedDate = new Date(`${selectedMonth}-01`);
      const today = new Date();
      if (selectedDate > today) {
        setDate(today.toISOString().slice(0, 10));
      } else {
        setDate(`${selectedMonth}-01`);
      }
    } else {
      setDate(now.toISOString().slice(0, 10));
    }
  }, [filterMode, selectedMonth]);

  // Set default categories when type changes
  useEffect(() => {
    if (type === 'income') {
      setCategory('OK Builder');
    } else {
      setCategory('Misc');
    }
    setMultipleAmounts([]);
    setCustomCategory('');
  }, [type]);

  // Update display amount when amount changes
  useEffect(() => {
    if (amount && !isNaN(parseInt(amount))) {
      setDisplayAmount(formatPKR(parseInt(amount)));
    } else {
      setDisplayAmount('');
    }
  }, [amount]);

  useEffect(() => {
    if (type === 'income' && batchTransactions.length) {
      setBatchTransactions([]);
    }
  }, [type, batchTransactions.length]);

  const isSalary = type === 'expense' && category === 'Salary';
  const isFixedExpense = type === 'expense' && category === 'Fixed';
  const isPetrol = type === 'expense' && category === 'Petrol';
  const isAlAzhar = type === 'expense' && category === 'Al Azhar Prints';
  const isMisc = category === 'Misc';
  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  // Filter active employees based on selected date
  const getActiveEmployees = (dateStr: string) => {
    const selected = new Date(dateStr);
    selected.setHours(0, 0, 0, 0); // Normalize to start of day
    return Object.keys(salaryMap).filter((employee) => {
      const departureDate = salaryMap[employee].departureDate;
      if (!departureDate) return true; // Current employee
      const departure = new Date(departureDate);
      departure.setHours(0, 0, 0, 0); // Normalize to start of day
      return selected <= departure; // Include if selected date is on or before departure
    });
  };

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

  const alreadyPaidFixedExpenses = useMemo(() => {
    return existingTransactions
      .filter(
        (tx) =>
          tx.type === 'expense' &&
          tx.category === 'Fixed' &&
          tx.fixedExpense &&
          new Date(tx.date).toISOString().slice(0, 7) === transactionMonth
      )
      .map((tx) => tx.fixedExpense!)
      .filter((exp, i, arr) => arr.indexOf(exp) === i);
  }, [existingTransactions, transactionMonth]);

  useEffect(() => {
    if (isSalary && employee && salaryMap[employee]) {
      setAmount(salaryMap[employee].salary.toString());
      setDescription(`Salary for ${employee}`);
      setMultipleAmounts([]);
    } else if (isFixedExpense && fixedExpense && fixedExpenseMap[fixedExpense]) {
      setAmount(fixedExpenseMap[fixedExpense].toString());
      setDescription(`${fixedExpense}`);
      setMultipleAmounts([]);
    } else if (isPetrol && employee) {
      setDescription(`Petrol expense for ${employee}`);
    } else if (isAlAzhar) {
      setDescription(`Al Azhar Prints expense`);
    } else if (!allowEditAmount && (isSalary || isFixedExpense)) {
      setAmount('');
      setDescription('');
      setMultipleAmounts([]);
    }
  }, [employee, fixedExpense, isSalary, isFixedExpense, isPetrol, isAlAzhar, allowEditAmount]);

  useEffect(() => {
    if (isSalary && employee && alreadyPaidEmployees.includes(employee)) {
      setEmployee('');
    }
    if (isFixedExpense && fixedExpense && alreadyPaidFixedExpenses.includes(fixedExpense)) {
      setFixedExpense('');
    }
    setBatchTransactions([]);
  }, [transactionMonth, isSalary, employee, alreadyPaidEmployees, isFixedExpense, fixedExpense, alreadyPaidFixedExpenses]);

  const isDuplicate = (): boolean => {
    if (isSalary && employee && alreadyPaidEmployees.includes(employee)) {
      return true;
    }
    if (isFixedExpense && fixedExpense && alreadyPaidFixedExpenses.includes(fixedExpense)) {
      return true;
    }
    return false;
  };

  const handleAddAllSalaries = () => {
    const activeEmployees = getActiveEmployees(date);
    const unpaidEmployees = activeEmployees.filter((emp) => !alreadyPaidEmployees.includes(emp));
    const newBatchTransactions = unpaidEmployees.map((emp, index) => ({
      id: generateUniqueId() + index,
      type: 'expense' as TransactionType,
      date,
      amount: salaryMap[emp].salary,
      category: 'Salary',
      description: `Salary for ${emp}`,
      employee: emp,
    }));
    setBatchTransactions(newBatchTransactions);
  };

  const handleAddAllFixedExpenses = () => {
    const unpaidFixedExpenses = Object.keys(fixedExpenseMap).filter(
      (exp) => !alreadyPaidFixedExpenses.includes(exp)
    );
    const newBatchTransactions = unpaidFixedExpenses.map((exp, index) => ({
      id: generateUniqueId() + index,
      type: 'expense' as TransactionType,
      date,
      amount: fixedExpenseMap[exp],
      category: 'Fixed',
      description: `${exp}`,
      fixedExpense: exp,
    }));
    setBatchTransactions(newBatchTransactions);
  };

  const handleBatchAmountChange = (id: number, newAmount: string) => {
    setBatchTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id ? { ...tx, amount: parseInt(newAmount) || 0 } : tx
      )
    );
  };

  const handleBatchDescriptionChange = (id: number, newDescription: string) => {
    setBatchTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, description: newDescription } : tx))
    );
  };

  const handleClearBatch = () => {
    setBatchTransactions([]);
    setMultipleAmounts([]);
  };

  const handleQuickAmount = (zeros: number) => {
    const currentAmount = amount || '0';
    const newAmount = currentAmount + '0'.repeat(zeros);
    setAmount(newAmount);
  };

  const handleAddAmount = () => {
    if (amount && !isNaN(parseInt(amount))) {
      setMultipleAmounts((prev) => [...prev, parseInt(amount)]);
      setAmount('');
      setDisplayAmount('');
    }
  };

  const handleRemoveAmount = (index: number) => {
    setMultipleAmounts((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(() => {
    return multipleAmounts.reduce((sum, amt) => sum + amt, 0);
  }, [multipleAmounts]);

  const amountBreakdown = useMemo(() => {
    return multipleAmounts.map(amt => formatPKR(amt)).join('+');
  }, [multipleAmounts]);

  const resetForm = () => {
    setAmount('');
    setCategory(type === 'income' ? 'OK Builder' : 'Misc');
    setCustomCategory('');
    setDescription('');
    setType('expense');
    setEmployee('');
    setFixedExpense('');
    setAllowEditAmount(false);
    setMultipleAmounts([]);
    setBatchTransactions([]);
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (new Date(date) > new Date()) {
      alert('Cannot add transactions for future dates.');
      setIsSubmitting(false);
      return;
    }

    if (!batchTransactions.length && !multipleAmounts.length) {
      if (!amount || !date || (!category && !customCategory)) {
        alert('Fill all required fields');
        setIsSubmitting(false);
        return;
      }

      if (isDuplicate()) {
        const monthName = new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' });
        if (isSalary) {
          alert(`${employee} already received salary for ${monthName}.`);
        } else if (isFixedExpense) {
          alert(`${fixedExpense} already recorded for ${monthName}.`);
        }
        setIsSubmitting(false);
        return;
      }

      const newTransaction: Transaction = {
        id: generateUniqueId(),
        type,
        date,
        amount: parseInt(amount),
        category: customCategory || category,
        description,
        ...(isSalary || isPetrol ? { employee } : {}),
        ...(isFixedExpense ? { fixedExpense } : {}),
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
          resetForm();
        } else {
          alert(`Error: ${data.message || 'Something went wrong'}`);
        }
      } catch (err) {
        console.error('Submit error:', err);
        alert('Failed to submit transaction');
      } finally {
        setIsSubmitting(false);
      }
    } else if (multipleAmounts.length) {
      const newTransactions: Transaction[] = [];
      
      try {
        for (let i = 0; i < multipleAmounts.length; i++) {
          const amt = multipleAmounts[i];
          const newTransaction: Transaction = {
            id: generateUniqueId() + i,
            type,
            date,
            amount: amt,
            category: customCategory || category,
            description: isPetrol ? `Petrol expense for ${employee}` : `Al Azhar Prints expense`,
            ...(isPetrol ? { employee } : {}),
          };

          const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTransaction),
          });

          const data = await res.json();

          if (!res.ok) {
            alert(`Error adding transaction: ${data.message || 'Something went wrong'}`);
            setIsSubmitting(false);
            return;
          }
          
          newTransactions.push(newTransaction);
        }
        
        onAddBatch(newTransactions);
        onClose();
        resetForm();
      } catch (err) {
        console.error('Multiple amounts submit error:', err);
        alert('Failed to submit transactions');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const processedTransactions: Transaction[] = [];
      
      try {
        for (let i = 0; i < batchTransactions.length; i++) {
          const tx = batchTransactions[i];
          const transactionWithUniqueId = { 
            ...tx, 
            id: generateUniqueId() + i
          };
          
          const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionWithUniqueId),
          });

          const data = await res.json();

          if (!res.ok) {
            alert(`Error adding ${tx.employee || tx.fixedExpense}: ${data.message || 'Something went wrong'}`);
            setIsSubmitting(false);
            return;
          }
          
          processedTransactions.push(transactionWithUniqueId);
        }
        
        onAddBatch(processedTransactions);
        onClose();
        resetForm();
      } catch (err) {
        console.error('Batch submit error:', err);
        alert('Failed to submit batch transactions');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setType('income')}
          className={`px-4 py-2 rounded-full cursor-pointer ${type === 'income' ? 'bg-green-200' : 'bg-gray-200'}`}
        >
          Income
        </button>
        <button
          onClick={() => setType('expense')}
          className={`px-4 py-2 rounded-full cursor-pointer ${type === 'expense' ? 'bg-red-200' : 'bg-gray-200'}`}
        >
          Expense
        </button>
      </div>

      {type === 'expense' && (
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleAddAllSalaries}
            className="px-4 py-2 rounded bg-blue-200 disabled:opacity-50"
            disabled={getActiveEmployees(date).filter((emp) => !alreadyPaidEmployees.includes(emp)).length === 0}
          >
            Add All Salaries
          </button>
          <button
            onClick={handleAddAllFixedExpenses}
            className="px-4 py-2 rounded bg-blue-200 disabled:opacity-50"
            disabled={alreadyPaidFixedExpenses.length === Object.keys(fixedExpenseMap).length}
          >
            Add All Fixed Expenses
          </button>
        </div>
      )}

      {batchTransactions.length > 0 && (
        <div className="mb-4 max-h-64 overflow-y-auto relative">
          <button
            onClick={handleClearBatch}
            className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700"
            title="Close Batch Mode"
          >
            <FaTimes className="h-5 w-5 text-red-500" />
          </button>
          <h3 className="text-lg font-semibold mb-2">Batch Transactions</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2 text-left">Category</th>
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Amount (PKR)</th>
                <th className="border px-4 py-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {batchTransactions.map((tx) =>
                typeof tx.id === 'number' ? (
                  <tr key={tx.id}>
                    <td className="border px-4 py-2">{tx.category}</td>
                    <td className="border px-4 py-2">{tx.employee || tx.fixedExpense}</td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full border px-2 py-1 rounded"
                        value={tx.amount}
                        onChange={(e) => handleBatchAmountChange(tx.id as number, e.target.value)}
                      />
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="text"
                        className="w-full border px-2 py-1 rounded"
                        value={tx.description}
                        onChange={(e) => handleBatchDescriptionChange(tx.id as number, e.target.value)}
                      />
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        </div>
      )}

      {batchTransactions.length === 0 && (
        <>
          <div className="relative mb-2">
            <input
              type="number"
              placeholder="Amount (PKR)"
              className="w-full border px-3 py-2 rounded pr-10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={(isSalary || isFixedExpense) && !allowEditAmount}
            />
            {(isSalary || isFixedExpense) && (
              <button
                onClick={() => setAllowEditAmount(!allowEditAmount)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <FaEdit className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>

          {(isPetrol || isAlAzhar) && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleAddAmount}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Add Amount"
                disabled={!amount || isNaN(parseInt(amount))}
              >
                <FaPlus className="h-4 w-4 text-green-500" />
              </button>
            </div>
          )}

          {(isPetrol || isAlAzhar) && multipleAmounts.length > 0 && (
            <div className="mb-2">
              <div className="text-sm font-semibold mb-1">Added Amounts:</div>
              <div className="text-lg font-bold text-gray-700">{formatPKR(totalAmount)}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {multipleAmounts.map((amt, index) => (
                  <span key={index} className="inline-flex items-center bg-gray-200 rounded px-2 py-1 text-xs">
                    {formatPKR(amt)}
                    <button
                      onClick={() => handleRemoveAmount(index)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {displayAmount && (
            <div className="mb-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
              {displayAmount}
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleQuickAmount(5)}
              className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 cursor-pointer"
            >
              +00000
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(4)}
              className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 cursor-pointer"
            >
              +0000
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(3)}
              className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 cursor-pointer"
            >
              +000
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(2)}
              className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 cursor-pointer"
            >
              +00
            </button>
          </div>

          <select
            className="w-full mb-3 border px-3 py-2 rounded"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setEmployee('');
              setFixedExpense('');
              setAllowEditAmount(false);
              setBatchTransactions([]);
              setMultipleAmounts([]);
              if (e.target.value !== 'Misc') {
                setCustomCategory('');
              }
            }}
          >
            <option value="">Select Category</option>
            {currentCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {(isSalary || isPetrol) && (
            <select
              className="w-full mb-3 border px-3 py-2 rounded"
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
            >
              <option value="">Select Employee</option>
              {getActiveEmployees(date).map((emp) => {
                const isPaid = isSalary && alreadyPaidEmployees.includes(emp);
                return (
                  <option key={emp} value={emp} disabled={isPaid}>
                    {emp} {isPaid ? '(Paid)' : ''}
                  </option>
                );
              })}
            </select>
          )}

          {isFixedExpense && (
            <select
              className="w-full mb-3 border px-3 py-2 rounded"
              value={fixedExpense}
              onChange={(e) => setFixedExpense(e.target.value)}
            >
              <option value="">Select Fixed Expense</option>
              {Object.keys(fixedExpenseMap).map((exp) => {
                const isPaid = alreadyPaidFixedExpenses.includes(exp);
                return (
                  <option key={exp} value={exp} disabled={isPaid}>
                    {exp} {isPaid ? '(Paid)' : ''}
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
            max={currentDate}
          />

          {isMisc && (
            <input
              type="text"
              placeholder="Or add new category"
              className="w-full mb-3 border px-3 py-2 rounded"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          )}

          <input
            type="text"
            placeholder="Description (optional)"
            className="w-full mb-4 border px-3 py-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </>
      )}

      <button
        onClick={handleSubmit}
        className="w-full bg-black text-white py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        disabled={isSubmitting}
      >
        {isSubmitting && (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        )}
        {isSubmitting ? 'Adding' : batchTransactions.length > 0 || multipleAmounts.length > 0 ? 'Add All' : 'Add'}
      </button>
    </Modal>
  );
}
