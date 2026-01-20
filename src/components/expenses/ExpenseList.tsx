'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExpenseForm } from './ExpenseForm';
import { createExpense, updateExpense, deleteExpense } from '@/lib/api';
import type { Expense, ExpenseFormData } from '@/lib/types';
import { EXPENSE_CATEGORIES } from '@/lib/types';

interface Member {
  id: string;
  label: string;
}

interface ExpenseListProps {
  tripId: string;
  expenses: Expense[];
  members: Member[];
  currentUserId?: string;
  onUpdate: () => void;
}

export function ExpenseList({ tripId, expenses, members, currentUserId, onUpdate }: ExpenseListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getCategoryMeta = (category: string) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === category) ?? { emoji: '', label: category };
  };

  const getMemberLabel = (userId: string | null) => {
    if (!userId) return null;
    return members.find((m) => m.id === userId)?.label ?? 'Unknown';
  };

  async function handleCreate(data: ExpenseFormData) {
    await createExpense(tripId, data);
    onUpdate();
  }

  async function handleUpdate(data: ExpenseFormData) {
    if (!editingExpense) return;
    await updateExpense(editingExpense.id, data);
    setEditingExpense(null);
    onUpdate();
  }

  async function handleDelete() {
    if (!deletingExpense) return;
    setDeleting(true);
    try {
      await deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
      onUpdate();
    } finally {
      setDeleting(false);
    }
  }

  const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const primaryCurrency = expenses[0]?.currency || 'EUR';

  // Group expenses by date
  const expensesByDate = expenses.reduce(
    (acc, expense) => {
      const dateKey = expense.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(expense);
      return acc;
    },
    {} as Record<string, Expense[]>
  );

  const sortedDates = Object.keys(expensesByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Expenses</h3>
          <p className="text-sm text-gray-500">
            {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
            {expenses.length > 0 && ` · Total: ${totalAmount.toLocaleString()} ${primaryCurrency}`}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add Expense</Button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
          <p className="text-gray-500 mb-2">No expenses recorded yet</p>
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Add your first expense
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                {format(new Date(dateKey), 'EEEE, MMM d, yyyy')}
              </h4>
              <div className="space-y-2">
                {expensesByDate[dateKey].map((expense) => {
                  const meta = getCategoryMeta(expense.category);
                  const paidByLabel = getMemberLabel(expense.paid_by);
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{meta.emoji}</span>
                        <div>
                          <p className="font-medium">
                            {expense.description || meta.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {meta.label}
                            {paidByLabel && <span> · Paid by {paidByLabel}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {Number(expense.amount).toLocaleString()} {expense.currency}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingExpense(expense)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => setDeletingExpense(expense)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      <ExpenseForm
        open={showForm}
        members={members}
        currentUserId={currentUserId}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />

      {/* Edit Form */}
      {editingExpense && (
        <ExpenseForm
          expense={editingExpense}
          members={members}
          currentUserId={currentUserId}
          open={true}
          onClose={() => setEditingExpense(null)}
          onSubmit={handleUpdate}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deletingExpense} onOpenChange={() => setDeletingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingExpense(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
