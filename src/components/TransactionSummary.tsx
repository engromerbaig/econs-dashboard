import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from './AddTransactionModal';
import { formatPKR } from '@/lib/format';

interface Props {
  transactions: Transaction[];
  selectedMonth: string;
}

export default function TransactionSummary({ transactions, selectedMonth }: Props) {
  const filtered = transactions.filter(tx => tx.date.startsWith(selectedMonth));
  const income = filtered.filter(tx => tx.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expense = filtered.filter(tx => tx.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const net = income - expense;

  const chartData = [
    { name: 'Income', value: income },
    { name: 'Expense', value: expense },
    { name: 'Net Profit', value: net < 0 ? 0 : net },
  ];

  const COLORS = ['#34d399', '#f87171', '#60a5fa'];

  return (
    <div className="w-full">
      <h2 className="text-lg font-bold mb-4">Summary</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} label>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 text-sm space-y-1">
        <div>Income: {formatPKR(income)}</div>
        <div>Expense: {formatPKR(expense)}</div>
        <div className="font-bold">Net: {formatPKR(net)}</div>
      </div>
    </div>
  );
}
