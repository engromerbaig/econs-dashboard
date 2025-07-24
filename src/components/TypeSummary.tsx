'use client';

import { useState, useEffect } from 'react';
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

interface AttendanceRecord {
  employee: string;
  date: string;
  status: 'present' | 'absent';
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

  // Attendance data state for both tabs
  const [attendanceData, setAttendanceData] = useState<{
    currentMonth: { present: number; absent: number; total: number };
    allTime: { present: number; absent: number; total: number };
  }>({
    currentMonth: { present: 0, absent: 0, total: 0 },
    allTime: { present: 0, absent: 0, total: 0 },
  });
  const [activeTab, setActiveTab] = useState<'currentMonth' | 'allTime'>('currentMonth');

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!isEmployee) return;
      try {
        // Fetch current month attendance
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentMonthRes = await fetch(`/api/attendance?employee=${encodeURIComponent(type)}&month=${yearMonth}`);
        const currentMonthData = await currentMonthRes.json();

        // Fetch all-time attendance
        const allTimeRes = await fetch(`/api/attendance?employee=${encodeURIComponent(type)}`);
        const allTimeData = await allTimeRes.json();

        let currentMonthStats = { present: 0, absent: 0, total: 0 };
        let allTimeStats = { present: 0, absent: 0, total: 0 };

        if (currentMonthRes.ok && currentMonthData.status === 'success') {
          const records: AttendanceRecord[] = currentMonthData.records;
          currentMonthStats = {
            present: records.filter((r) => r.status === 'present').length,
            absent: records.filter((r) => r.status === 'absent').length,
            total: records.length,
          };
        } else {
          console.error('Failed to fetch current month attendance:', currentMonthData.message);
        }

        if (allTimeRes.ok && allTimeData.status === 'success') {
          const records: AttendanceRecord[] = allTimeData.records;
          allTimeStats = {
            present: records.filter((r) => r.status === 'present').length,
            absent: records.filter((r) => r.status === 'absent').length,
            total: records.length,
          };
        } else {
          console.error('Failed to fetch all-time attendance:', allTimeData.message);
        }

        setAttendanceData({
          currentMonth: currentMonthStats,
          allTime: allTimeStats,
        });
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
    };

    fetchAttendance();
  }, [type, isEmployee]);

  // Calculate attendance percentage (whole number)
  const attendanceRate = attendanceData[activeTab].total > 0
    ? Math.round((attendanceData[activeTab].present / attendanceData[activeTab].total) * 100)
    : 0;

  // Dynamic employee image path
  const getEmployeeImage = (employeeName: string) => {
    const normalizedName = employeeName.toLowerCase().replace(/\s+/g, '-');
    const imagePath = `/images/${normalizedName}.webp`;
    console.log(`Generating image path for ${employeeName}: ${imagePath}`); // Debug log
    return imagePath;
  };

  // Filter active employees based on today's date
  const getActiveEmployees = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    return Object.keys(salaryMap).filter((employee) => {
      if (employee === 'Lawyer' || employee === 'Cleaner') return false; // Exclude Lawyer and Cleaner
      const departureDate = salaryMap[employee].departureDate;
      if (!departureDate) return true; // Current employee
      const departure = new Date(departureDate);
      departure.setHours(0, 0, 0, 0); // Normalize to start of day
      return departure >= today; // Include if departure is today or future
    });
  };

  // Check if type is a valid employee for image display
  const isValidEmployeeForImage = isEmployee && getActiveEmployees().includes(type);

  if (showChartOnly) {
    const chartData = [
      { name: 'Income', value: income },
      { name: 'Expense', value: expense },
    ].filter((entry) => entry.value > 0);

    const COLORS = ['#34d399', '#f87171'];

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
            {isValidEmployeeForImage ? (
              <Image
                src={getEmployeeImage(type)}
                alt={`${type} profile picture`}
                width={200}
                height={200}
                className="rounded-full object-cover border-2"
                onError={(e) => {
                  console.log(`Image failed to load for ${type}, falling back to default`); // Debug log
                  e.currentTarget.src = '/images/default.webp';
                }}
                unoptimized // Add to prevent optimization issues
              />
            ) : (
              <Image
                src="/images/default.webp"
                alt="Default profile picture"
                width={100}
                height={100}
                className="rounded-full object-cover border-2"
              />
            )}
          </div>
          {/* Attendance Box */}
          <div className="p-6 bg-gray-100 rounded shadow">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('currentMonth')}
                className={`px-3 py-1 rounded ${
                  activeTab === 'currentMonth' ? 'bg-black text-white' : 'bg-gray-200 text-black'
                }`}
              >
                Current Month
              </button>
              <button
                onClick={() => setActiveTab('allTime')}
                className={`px-3 py-1 rounded ${
                  activeTab === 'allTime' ? 'bg-black text-white' : 'bg-gray-200 text-black'
                }`}
              >
                All Time
              </button>
            </div>
            <h2 className="text-sm font-semibold mb-2">
              Attendance ({activeTab === 'currentMonth' ? 'This Month' : 'All Time'})
            </h2>
            <div className="text-sm space-y-1">
              <p>Total: {attendanceData[activeTab].total} days</p>
              <p>Present: {attendanceData[activeTab].present} days</p>
              <p>Absent: {attendanceData[activeTab].absent} days</p>
              <p
                className={`text-2xl pt-4 xl:text-[40px] font-bold ${
                  attendanceRate < 50 ? 'text-red-500' : 'text-green-500'
                }`}
              >
                {attendanceRate}%
              </p>
              <p className="text-xs text-gray-500">attendance</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
