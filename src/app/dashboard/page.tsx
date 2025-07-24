'use client';

import { useState, useEffect } from 'react';
import AddTransactionModal from '@/components/AddTransactionModal';
import { Transaction } from '@/components/types';
import TransactionList from '@/components/TransactionList';
import TransactionSummary from '@/components/TransactionSummary';
import MonthlyNetProfitChart from '@/components/MonthlyNetProfitChart';
import { exportTransactionsToCSV } from '@/lib/exportTransactionsToCSV';
import { FaArrowUp, FaArrowDown, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'month' | '3m' | '6m' | '1y' | '3y' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [hiddenBoxes, setHiddenBoxes] = useState({
    income: false,
    expense: false,
    profit: false,
    salary: false,
    profitPerMonth: false,
  });

  const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

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
    setTransactions(prev => [tx, ...prev]);
  };

  const handleAddBatch = (txs: Transaction[]) => {
    setTransactions(prev => [...txs, ...prev]);
  };

  const handleDelete = (transactionId: string) => {
    setTransactions(prev =>
      prev.filter(tx => {
        const txId = tx._id ? tx._id.toString() : tx.id?.toString();
        return txId !== transactionId;
      })
    );
  };

  const toggleVisibility = (box: keyof typeof hiddenBoxes) => {
    setHiddenBoxes(prev => ({ ...prev, [box]: !prev[box] }));
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

  const uniqueMonths = new Set(filtered.map(tx => tx.date.slice(0, 7))).size;
  const profitPerMonth = uniqueMonths > 0 ? Math.round((totalIncome - totalExpense) / uniqueMonths) : 0;

  const getPreviousMonth = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const prevMonth = getPreviousMonth(selectedMonth);
  const prevMonthTransactions = transactions.filter(tx => tx.date.startsWith(prevMonth));
  const prevMonthIncome = prevMonthTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const prevMonthExpense = prevMonthTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  const prevMonthProfit = prevMonthIncome - prevMonthExpense;
  const currentProfit = totalIncome - totalExpense;

  let percentageChange = 0;
  let changeText = '';
  if (filterMode === 'month') {
    if (prevMonthTransactions.length === 0 && filtered.length === 0) {
      changeText = 'No data to compare';
    } else if (prevMonthProfit === 0 && currentProfit === 0) {
      changeText = 'No change';
    } else if (prevMonthProfit === 0 && currentProfit !== 0) {
      changeText = `${currentProfit > 0 ? 'Positive' : 'Negative'} profit started`;
    } else {
      percentageChange = ((currentProfit - prevMonthProfit) / Math.abs(prevMonthProfit)) * 100;
      changeText = `${Math.abs(percentageChange).toFixed(1)}% ${percentageChange >= 0 ? 'increase' : 'decrease'}`;
    }
  }

  const isIncrease = percentageChange >= 0 && prevMonthProfit !== 0;

  return (
    <main className="min-h-screen bg-white">
      <div className="p-6">
        {/* Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
          <div className="p-10 bg-green-100 rounded shadow relative">
            <h2 className="text-sm font-semibold">Income</h2>
            <p className="text-2xl font-bold">
              PKR {hiddenBoxes.income ? '***' : totalIncome.toLocaleString('en-IN')}
            </p>
            <button
              onClick={() => toggleVisibility('income')}
              className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700"
            >
              {hiddenBoxes.income ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="p-10 bg-red-100 rounded shadow relative">
            <h2 className="text-sm font-semibold">Expense</h2>
            <p className="text-2xl font-bold">
              PKR {hiddenBoxes.expense ? '***' : totalExpense.toLocaleString('en-IN')}
            </p>
            <button
              onClick={() => toggleVisibility('expense')}
              className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700"
            >
              {hiddenBoxes.expense ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="p-10 bg-blue-100 rounded shadow relative">
            <h2 className="text-sm font-semibold">Profit</h2>
            <p className="text-2xl font-bold">
              PKR {hiddenBoxes.profit ? '***' : (totalIncome - totalExpense).toLocaleString('en-IN')}
            </p>
            {filterMode === 'month' && (
              <p className="text-sm flex items-center gap-1 mt-2">
                {changeText.includes('No') || changeText.includes('started') ? (
                  <span>{changeText}</span>
                ) : (
                  <>
                    {isIncrease ? (
                      <FaArrowUp className="text-green-500" />
                    ) : (
                      <FaArrowDown className="text-red-500" />
                    )}
                    <span className={isIncrease ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                      {changeText}
                    </span>
                  </>
                )}
              </p>
            )}
            <button
              onClick={() => toggleVisibility('profit')}
              className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700"
            >
              {hiddenBoxes.profit ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="p-10 bg-indigo-100 rounded shadow relative">
            <h2 className="text-sm font-semibold">Salary Total</h2>
            <p className="text-2xl font-bold">
              PKR {hiddenBoxes.salary ? '***' : salaryTotal.toLocaleString('en-IN')}
            </p>
            <button
              onClick={() => toggleVisibility('salary')}
              className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700"
            >
              {hiddenBoxes.salary ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="p-10 bg-purple-100 rounded shadow relative">
            <h2 className="text-sm font-semibold">Profit/Month</h2>
            <p className="text-2xl font-bold">
              PKR {hiddenBoxes.profitPerMonth ? '***' : profitPerMonth.toLocaleString('en-IN')}
            </p>
            <button
              onClick={() => toggleVisibility('profitPerMonth')}
              className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700"
            >
              {hiddenBoxes.profitPerMonth ? <FaEyeSlash /> : <FaEye />}
            </button>
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
              max={currentYearMonth}
              className="border px-3 py-1 rounded"
            />
          )}

          <button
            onClick={() => setModalOpen(true)}
            className="bg-black text-white cursor-pointer px-4 py-2 rounded hover:bg-gray-800"
          >
            + Add Transaction
          </button>

          <button
            onClick={() => exportTransactionsToCSV(transactions, selectedMonth, filterMode)}
            className="bg-gray-200 text-black cursor-pointer px-4 py-2 rounded border hover:bg-gray-300"
          >
            ⬇️ Export CSV
          </button>
        </div>

        {/* Transactions and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <TransactionList transactions={filtered} onDelete={handleDelete} />
          <TransactionSummary transactions={filtered} />
        </div>

        {/* Chart */}
        <MonthlyNetProfitChart transactions={filtered} />
      </div>

      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
        onAddBatch={handleAddBatch}
        existingTransactions={transactions}
        selectedMonth={selectedMonth}
        filterMode={filterMode}
      />
    </main>
  );
}