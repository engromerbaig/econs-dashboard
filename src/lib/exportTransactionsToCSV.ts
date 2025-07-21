import { Transaction } from "@/components/types";

export function exportTransactionsToCSV(transactions: Transaction[], month: string) {
  const filtered = transactions.filter(tx => tx.date.startsWith(month));
  if (filtered.length === 0) {
    alert('No transactions to export for this month.');
    return;
  }

  const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
  const rows = filtered.map(tx => [
    tx.date,
    tx.type,
    tx.category,
    tx.amount.toString(),
    tx.description || ''
  ]);

  // Calculate totals
  const totalIncome = filtered
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = filtered
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Add empty row, then summary
  const summarySection = [
    [],
    ['Total Income', '', '', totalIncome.toString()],
    ['Total Expense', '', '', totalExpense.toString()],
    ['Net Profit', '', '', netProfit.toString()]
  ];

  const csvContent = [headers, ...rows, ...summarySection]
    .map(r => r.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `transactions-${month}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
