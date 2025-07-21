import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from './types';
import { formatPKR } from '@/lib/format';

interface Props {
  transactions: Transaction[];
}

export default function TransactionSummary({ transactions }: Props) {
  const income = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expense = transactions
    .filter(tx => tx.type === 'expense' || tx.category.toLowerCase().includes('personal'))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const chartData = [
    { name: 'Income', value: income },
    { name: 'Expense', value: expense },
  ];

  const COLORS = ['#34d399', '#f87171'];

  return (
    <div className="w-full border-2 border-gray-200 rounded-lg p-6 bg-white shadow-md">
      <h2 className="text-lg font-bold mb-4">Summary</h2>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={120}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 text-sm space-y-1">
        <div>Income: {formatPKR(income)}</div>
        <div>Expense: {formatPKR(expense)}</div>
        <div className="font-bold">Net: {formatPKR(income - expense)}</div>
      </div>
    </div>
  );
}
