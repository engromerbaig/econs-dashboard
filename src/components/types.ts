// types.ts
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: number;
  _id?: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
  employee?: string;
  fixedExpense?: string;
}
