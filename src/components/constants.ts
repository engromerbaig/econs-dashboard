// constants.ts

export type TransactionType = 'income' | 'expense';

export const incomeCategories = [
  'OK Builder',
  'Tanveer Associates',
  'Faizan Heights',
  'Bisma Builders',
  'McDonalds Pakistan',
  'K-Electric',
  'Misc',
];

export const expenseCategories = ['Utilities', 'Salary', 'Petrol', 'Prints', 'Misc'];

export const salaryMap: Record<string, number> = {
  'Ameer Hamza': 39000,
  'Faraz': 23000,
  'Ibrahim': 33000,
  'Tehseen': 20044,
  'Haris': 23812,
  'Omer Baig': 25000,
  'Rafiq': 47700,
  'Usman': 2000,
  'Cleaner': 1500,
  'Jawad': 31500,
};
