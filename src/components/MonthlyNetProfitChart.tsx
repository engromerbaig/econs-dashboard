'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Transaction } from "@/components/types";

interface MonthlyNetProfitChartProps {
  transactions: Transaction[];
}

interface MonthlyData {
  month: string;
  netProfit: number;
}

const MonthlyNetProfitChart = ({ transactions }: MonthlyNetProfitChartProps) => {
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

    const monthlyData: MonthlyData[] = Object.keys(monthlyMap)
      .map((monthKey) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const formattedMonth = date.toLocaleString('en-US', {
          month: 'short',
          year: '2-digit',
        }); // e.g., "Jul 25"

        return {
          month: formattedMonth,
          netProfit: monthlyMap[monthKey].income - monthlyMap[monthKey].expense,
          sortDate: date.getTime(),
        };
      })
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ month, netProfit }) => ({ month, netProfit }));

    return monthlyData;
  };

  const data = getMonthlyData();

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Monthly Net Profit Growth</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value: number) => `PKR ${value.toLocaleString('en-IN')}`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="netProfit"
            stroke="#2563eb"
            strokeWidth={3} // Bolder line
            activeDot={{ r: 8 }}
            name="Net Profit"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyNetProfitChart;
