import { supabase } from './supabase';
import type {
  Trip,
  TripFormData,
  TripWithDetails,
  Expense,
  ExpenseFormData,
  Checklist,
  ChecklistFormData,
  ChecklistItem,
  ChecklistItemFormData,
} from './types';

// ============ Trips ============

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getTrip(id: string): Promise<TripWithDetails | null> {
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (tripError) throw tripError;
  if (!trip) return null;

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', id)
    .order('date', { ascending: false });

  if (expensesError) throw expensesError;

  const { data: checklists, error: checklistsError } = await supabase
    .from('checklists')
    .select('*')
    .eq('trip_id', id)
    .order('created_at', { ascending: true });

  if (checklistsError) throw checklistsError;

  const checklistsWithItems = await Promise.all(
    (checklists ?? []).map(async (checklist) => {
      const { data: items, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('checklist_id', checklist.id)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;
      return { ...checklist, items: items ?? [] };
    })
  );

  return {
    ...trip,
    expenses: expenses ?? [],
    checklists: checklistsWithItems,
  };
}

export async function createTrip(data: TripFormData): Promise<Trip> {
  const { data: trip, error } = await supabase
    .from('trips')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return trip;
}

export async function updateTrip(id: string, data: Partial<TripFormData>): Promise<Trip> {
  const { data: trip, error } = await supabase
    .from('trips')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return trip;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

// ============ Expenses ============

export async function createExpense(tripId: string, data: ExpenseFormData): Promise<Expense> {
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({ ...data, trip_id: tripId })
    .select()
    .single();

  if (error) throw error;
  return expense;
}

export async function updateExpense(id: string, data: Partial<ExpenseFormData>): Promise<Expense> {
  const { data: expense, error } = await supabase
    .from('expenses')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ============ Checklists ============

export async function createChecklist(tripId: string, data: ChecklistFormData): Promise<Checklist> {
  const { data: checklist, error } = await supabase
    .from('checklists')
    .insert({ ...data, trip_id: tripId })
    .select()
    .single();

  if (error) throw error;
  return checklist;
}

export async function deleteChecklist(id: string): Promise<void> {
  const { error } = await supabase.from('checklists').delete().eq('id', id);
  if (error) throw error;
}

// ============ Checklist Items ============

export async function createChecklistItem(
  checklistId: string,
  data: ChecklistItemFormData
): Promise<ChecklistItem> {
  const { data: item, error } = await supabase
    .from('checklist_items')
    .insert({ ...data, checklist_id: checklistId })
    .select()
    .single();

  if (error) throw error;
  return item;
}

export async function toggleChecklistItem(id: string, checked: boolean): Promise<ChecklistItem> {
  const { data: item, error } = await supabase
    .from('checklist_items')
    .update({ checked })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return item;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase.from('checklist_items').delete().eq('id', id);
  if (error) throw error;
}

// ============ Statistics ============

export async function getYearlyStats(year: number) {
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('*, expenses(*)')
    .gte('start_date', startOfYear)
    .lte('start_date', endOfYear)
    .order('start_date', { ascending: true });

  if (tripsError) throw tripsError;

  const allExpenses = (trips ?? []).flatMap((trip) => trip.expenses || []);
  const totalSpent = allExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const byCategory = allExpenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    trips: trips ?? [],
    totalTrips: trips?.length ?? 0,
    totalSpent,
    byCategory,
  };
}
