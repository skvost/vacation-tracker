export type ExpenseCategory =
  | 'flights'
  | 'hotels'
  | 'food'
  | 'activities'
  | 'transport'
  | 'other';

export interface Household {
  id: string;
  name: string;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string | null;
  role: 'owner' | 'member';
  invited_email: string | null;
  invite_token: string;
  status: 'pending' | 'active';
  created_at: string;
}

export interface Trip {
  id: string;
  household_id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Checklist {
  id: string;
  trip_id: string;
  name: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  text: string;
  checked: boolean;
  created_at: string;
}

// Form types
export interface TripFormData {
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  notes?: string;
  household_id: string;
}

export interface ExpenseFormData {
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description?: string;
  date: string;
}

export interface ChecklistFormData {
  name: string;
}

export interface ChecklistItemFormData {
  text: string;
}

// Extended types with relations
export interface TripWithExpenses extends Trip {
  expenses: Expense[];
}

export interface TripWithDetails extends Trip {
  expenses: Expense[];
  checklists: (Checklist & { items: ChecklistItem[] })[];
}

// Category metadata
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'flights', label: 'Flights', emoji: '✈️' },
  { value: 'hotels', label: 'Hotels', emoji: '🏨' },
  { value: 'food', label: 'Food', emoji: '🍽️' },
  { value: 'activities', label: 'Activities', emoji: '🎯' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'other', label: 'Other', emoji: '📦' },
];

export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CZK', label: 'CZK (Kč)' },
  { value: 'PLN', label: 'PLN (zł)' },
];
