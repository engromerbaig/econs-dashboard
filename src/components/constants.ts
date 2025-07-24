
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

export const expenseCategories = [
  'Utilities',
  'Salary',
  'Petrol',
  'Al Azhar Prints',
  'Talha HVAC',
  'Office IT',
  'Fixed',
  'Misc',
];

export interface Employee {
  salary: number;
  departureDate?: string; // ISO date string (e.g., '2025-06-30') or undefined for current employees
}

export const salaryMap: Record<string, Employee> = {
  'Ameer Hamza': { salary: 39000 },
  'Faraz': { salary: 23000 },
  'Ibrahim': { salary: 33000 },
  'Tehseen': { salary: 20044 },
  'Haris': { salary: 23812 },
  'Omer Baig': { salary: 25000 },
  'Rafiq': { salary: 47700 },
  'Usman': { salary: 2000 },
  'Cleaner': { salary: 1500 },
  'Lawyer': { salary: 6000 },
  'Laequee': { salary: 40000, departureDate: '2025-04-30' }, // Example past employee
'Jawad': { salary: 40000, departureDate: '2025-05-30' }, // Example past employee

};

export const fixedExpenseMap: Record<string, number> = {
  'Rent': 35000,
  'Electricity Bill': 33000,
  'Water Bill': 1115,
  'PTCL Bill': 2340,
  'Office Maintenance': 5140,
  'Petty Cash': 7000,
};
