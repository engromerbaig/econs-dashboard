'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from './types';
import { formatPKR } from '@/lib/format';
import { salaryMap, fixedExpenseMap } from './constants';
import Image from 'next/image';

interface Props {
  transactions: Transaction[];
  type: string;
  showChartOnly?: boolean;
}

export default function TypeSummary({ transactions, type, showChartOnly = false }: Props) {
  const isEmployee = Object.keys(salaryMap).includes(type);
  const isFixedExpense = Object.keys(fixedExpenseMap).includes(type);

  // Calculate totals
  const income = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const salaryTotal = transactions
    .filter((tx) => tx.category === 'Salary' && tx.employee === type)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const petrolTotal = transactions
    .filter((tx) => tx.category === 'Petrol' && tx.employee === type)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const total = transactions.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

  // Static attendance data (placeholder)
  const attendanceData = {
    present: 22,
    absent: 3,
    total: 25,
  };

  // Calculate attendance percentage (whole number)
  const attendanceRate = attendanceData.total > 0
    ? Math.round((attendanceData.present / attendanceData.total) * 100)
    : 0;

  // Dynamic employee image path
  const getEmployeeImage = (employeeName: string) => {
    const normalizedName = employeeName.toLowerCase().replace(/\s+/g, '-');
    return `/images/${normalizedName}.webp`;
  };

  // Pie chart data
  const chartData = [
    { name: 'Income', value: income },
    { name: 'Expense', value: expense },
  ].filter((entry) => entry.value > 0);

  const COLORS = ['#34d399', '#f87171'];

  if (showChartOnly) {
    return (
      <div className="w-full border-2 border-gray-200 rounded-lg p-6 bg-white shadow-md">
        <h2 className="text-lg font-bold mb-4">{type} Summary</h2>
        {chartData.length === 0 ? (
          <p className="text-gray-500">No data to display.</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={150}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Summary Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {isEmployee ? (
          <>
            <div className="p-6 bg-indigo-100 rounded shadow">
              <h2 className="text-sm font-semibold">Salary Total</h2>
              <p className="text-2xl font-bold">{formatPKR(salaryTotal)}</p>
            </div>
            <div className="p-6 bg-blue-100 rounded shadow">
              <h2 className="text-sm font-semibold">Petrol Total</h2>
              <p className="text-2xl font-bold">{formatPKR(petrolTotal)}</p>
            </div>
            <div className="p-6 bg-purple-100 rounded shadow">
              <h2 className="text-sm font-semibold">Total</h2>
              <p className="text-2xl font-bold">{formatPKR(salaryTotal + petrolTotal)}</p>
            </div>
          </>
        ) : isFixedExpense ? (
          <div className="p-6 bg-purple-100 rounded shadow">
            <h2 className="text-sm font-semibold">Total {type}</h2>
            <p className="text-2xl font-bold">{formatPKR(expense)}</p>
          </div>
        ) : (
          <>
            <div className="p-6 bg-green-100 rounded shadow">
              <h2 className="text-sm font-semibold">Income</h2>
              <p className="text-2xl font-bold">{formatPKR(income)}</p>
            </div>
            <div className="p-6 bg-red-100 rounded shadow">
              <h2 className="text-sm font-semibold">Expense</h2>
              <p className="text-2xl font-bold">{formatPKR(expense)}</p>
            </div>
            <div className="p-6 bg-blue-100 rounded shadow">
              <h2 className="text-sm font-semibold">Net</h2>
              <p className="text-2xl font-bold">{formatPKR(total)}</p>
            </div>
          </>
        )}
      </div>

      {/* Employee Details */}
      {isEmployee && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Employee Picture */}
          <div className="flex justify-center">
            <Image
              src={getEmployeeImage(type)}
              alt={`${type} profile picture`}
              width={200}
              height={200}
              className="rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/default.webp';
              }}
            />
          </div>
          {/* Attendance Box */}
          <div className="p-6 bg-gray-100 rounded shadow">
            <h2 className="text-sm font-semibold mb-2">Attendance (This Month)</h2>
            <div className="text-sm space-y-1">
              <p>Total: {attendanceData.total} days</p>
              <p>Present: {attendanceData.present} days</p>
              <p>Absent: {attendanceData.absent} days</p>
              <p className="text-2xl pt-4 xl:text-[40px] font-bold text-green-500">{attendanceRate}%</p>
              <p className="text-xs text-gray-500">attendance</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}