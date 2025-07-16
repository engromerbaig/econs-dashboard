import { Transaction } from './AddTransactionModal';
import { formatPKR } from '@/lib/format';

interface Props {
  transactions: Transaction[];
  selectedMonth: string;
}

export default function TransactionList({ transactions, selectedMonth }: Props) {
  const filtered = transactions.filter(tx => tx.date.startsWith(selectedMonth));

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Transactions</h2>
      {filtered.length === 0 ? (
        <p className="text-gray-500">No transactions for this month.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map(tx => (
            <li key={tx.id} className="border-b py-2">
              <div className="flex justify-between">
                <span>{tx.category}</span>
                <span>{formatPKR(tx.amount)}</span>
              </div>
              <div className="text-sm text-gray-600">{tx.type} • {tx.date}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
