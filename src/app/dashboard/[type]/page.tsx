// app/dashboard/[type]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TransactionList from '@/components/TransactionList';
import { Transaction } from '@/components/types';
import { FaArrowLeft } from 'react-icons/fa';
import { incomeCategories, expenseCategories, salaryMap, fixedExpenseMap } from '@/components/constants';

export default function CategoryPage() {
  const router = useRouter();
  const { type } = useParams(); // Get the dynamic 'type' parameter from the URL
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Valid categories and employee names
  const validCategories = [...incomeCategories, ...expenseCategories];
  const validEmployees = Object.keys(salaryMap);
  const validFixedExpenses = Object.keys(fixedExpenseMap);

  // Decode the type parameter (since it may be URL-encoded, e.g., "Omer%20Baig")
  const decodedType = type ? decodeURIComponent(type as string) : '';

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/transactions');
        const data = await res.json();
        if (data.status === 'success') {
          setTransactions(data.transactions);
        } else {
          setError('Failed to fetch transactions');
        }
      } catch (error) {
        setError('Error fetching transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Validate the type parameter
  const isValidType =
    validCategories.includes(decodedType) ||
    validEmployees.includes(decodedType) ||
    validFixedExpenses.includes(decodedType);

  if (!isValidType && !loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-blue-500 hover:underline mb-4"
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold mb-4">Invalid Category or Name</h1>
        <p>The requested category or name "{decodedType}" is not valid.</p>
      </div>
    );
  }

  // Filter transactions based on the type
  const filteredTransactions = transactions.filter((tx) => {
    if (validCategories.includes(decodedType)) {
      return tx.category === decodedType;
    } else if (validEmployees.includes(decodedType)) {
      return tx.employee === decodedType && tx.category === 'Salary';
    } else if (validFixedExpenses.includes(decodedType)) {
      return tx.fixedExpense === decodedType && tx.category === 'Fixed';
    }
    return false;
  });

  // Handle deletion of a transaction
  const handleDelete = (transactionId: string) => {
    setTransactions((prev) =>
      prev.filter((tx) => {
        const txId = tx._id ? tx._id.toString() : tx.id?.toString();
        return txId !== transactionId;
      })
    );
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-blue-500 hover:underline mb-4"
      >
        <FaArrowLeft /> Back to Dashboard
      </button>
      <h1 className="text-2xl font-bold mb-4">
        Transactions for {decodedType}
      </h1>
      {loading ? (
        <p>Loading transactions...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : filteredTransactions.length === 0 ? (
        <p>No transactions found for {decodedType}.</p>
      ) : (
        <TransactionList transactions={filteredTransactions} onDelete={handleDelete} />
      )}
    </div>
  );
}