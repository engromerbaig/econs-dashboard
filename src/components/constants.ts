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

export const expenseCategories = ['Utilities', 'Salary', 'Petrol', 'Al Azhar Prints', "Office IT", 'Fixed', 'Misc'];

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
  'Lawyer': 6000,
};

export const fixedExpenseMap: Record<string, number> = {
  'Rent': 35000,
  'Electricity Bill': 33000,
    'Water Bill': 1115,
    'PTCL Bill': 2340,

  'Office Maintenance': 5140,
  'Petty Cash': 7000,
  'Naila Cash': 50000,
  'Naila HBL': 20000,
};