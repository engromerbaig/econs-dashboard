'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '@/components/AddTransactionModal';

interface MonthlyNetProfitChartProps {
  transactions: Transaction[];
}

interface MonthlyData {
  month: string;
  netProfit: number;
}

const MonthlyNetProfitChart = ({ transactions }: MonthlyNetProfitChartProps) => {
  // Process transactions to calculate monthly net profit
  const getMonthlyData = (): MonthlyData[] => {
    const monthlyMap: { [key: string]: { income: number; expense: number } } = {};

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // e.g., "2025-07"

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expense: 0 };
      }

      if (tx.type === 'income') {
        monthlyMap[monthKey].income += tx.amount;
      } else if (tx.type === 'expense') {
        monthlyMap[monthKey].expense += tx.amount;
      }
    });

    // Convert to array and sort by month
    const monthlyData: MonthlyData[] = Object.keys(monthlyMap)
      .map((month) => ({
        month,
        netProfit: monthlyMap[month].income - monthlyMap[month].expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month)); // Sort chronologically

    return monthlyData;
  };

  const data = getMonthlyData();

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Monthly Net Profit Growth</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value: number) => `PKR ${value.toLocaleString('en-IN')}`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="netProfit"
            stroke="#2563eb" // Blue color for the line
            activeDot={{ r: 8 }}
            name="Net Profit"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyNetProfitChart;