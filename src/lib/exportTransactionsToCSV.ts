import { Transaction } from "@/components/types";

export function exportTransactionsToCSV(
  transactions: Transaction[],
  selectedMonth: string,
  filterMode: 'month' | '3m' | '6m' | '1y' | '3y' | 'all'
) {
  // Helper function to get date X months ago
  const getDateXMonthsAgo = (months: number): string => {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d.toISOString().split('T')[0];
  };

  // Filter transactions based on filterMode and selectedMonth
  const filtered = transactions.filter((tx) => {
    const txDate = tx.date;
    const today = new Date().toISOString().split('T')[0];

    if (filterMode === 'all') return true;
    if (filterMode === 'month') return txDate.startsWith(selectedMonth);
    if (filterMode === '3m') return txDate >= getDateXMonthsAgo(3) && txDate <= today;
    if (filterMode === '6m') return txDate >= getDateXMonthsAgo(6) && txDate <= today;
    if (filterMode === '1y') return txDate >= getDateXMonthsAgo(12) && txDate <= today;
    if (filterMode === '3y') return txDate >= getDateXMonthsAgo(36) && txDate <= today;
    return false;
  });

  if (filtered.length === 0) {
    alert(`No transactions to export for the selected ${filterMode === 'month' ? 'month' : 'time range'}.`);
    return;
  }

  // Define CSV headers
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Employee', 'Fixed Expense'];

  // Map transactions to CSV rows
  const rows = filtered.map(tx => [
    tx.date,
    tx.type,
    tx.category,
    tx.amount.toString(),
    tx.description || '',
    tx.employee || '',
    tx.fixedExpense || ''
  ]);

  // Group transactions by month for monthly summaries
  const monthlySummaries: { [month: string]: { income: number; expense: number; profit: number } } = {};
  filtered.forEach(tx => {
    const month = tx.date.slice(0, 7); // YYYY-MM
    if (!monthlySummaries[month]) {
      monthlySummaries[month] = { income: 0, expense: 0, profit: 0 };
    }
    if (tx.type === 'income') {
      monthlySummaries[month].income += tx.amount;
    } else {
      monthlySummaries[month].expense += tx.amount;
    }
    monthlySummaries[month].profit = monthlySummaries[month].income - monthlySummaries[month].expense;
  });

  // Calculate overall totals
  const totalIncome = filtered
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = filtered
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Create monthly summary rows
  const monthlySummaryRows = Object.keys(monthlySummaries)
    .sort() // Sort months chronologically
    .map(month => [
      [`${month}`, '', '', '', ''],
      [`Monthly Income`, '', '', monthlySummaries[month].income.toString(), ''],
      [`Monthly Expense`, '', '', monthlySummaries[month].expense.toString(), ''],
      [`Monthly Net Profit`, '', '', monthlySummaries[month].profit.toString(), '']
    ])
    .flat();

  // Create overall summary
  const overallSummary = [
    [],
    ['Overall Total Income', '', '', totalIncome.toString(), ''],
    ['Overall Total Expense', '', '', totalExpense.toString(), ''],
    ['Overall Net Profit', '', '', netProfit.toString(), '']
  ];

  // Combine all content
  const csvContent = [
    headers,
    ...rows,
    [],
    ['Monthly Summaries'],
    ...monthlySummaryRows,
    [],
    ['Overall Summary'],
    ...overallSummary
  ]
    .map(r => r.join(','))
    .join('\n');

  // Generate filename based on filter mode
  const filename = filterMode === 'month'
    ? `transactions-${selectedMonth}.csv`
    : `transactions-${filterMode}-${new Date().toISOString().slice(0, 10)}.csv`;

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}