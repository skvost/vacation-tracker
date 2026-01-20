'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Expense, ExpenseFormData, ExpenseCategory } from '@/lib/types';
import { EXPENSE_CATEGORIES } from '@/lib/types';

interface Member {
  id: string;
  label: string;
}

interface ExpenseFormProps {
  expense?: Expense;
  members: Member[];
  currentUserId?: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
}

export function ExpenseForm({ expense, members, currentUserId, open, onClose, onSubmit }: ExpenseFormProps) {
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? 'other');
  const [description, setDescription] = useState(expense?.description ?? '');
  const [date, setDate] = useState<Date | undefined>(
    expense?.date ? new Date(expense.date) : new Date()
  );
  const [paidBy, setPaidBy] = useState(expense?.paid_by ?? currentUserId ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    setLoading(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        currency: 'CZK',
        category,
        description: description || undefined,
        date: format(date, 'yyyy-MM-dd'),
        paid_by: paidBy || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getCategoryEmoji = (cat: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.emoji ?? '';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (CZK)</Label>
            <Input
              id="amount"
              type="number"
              step="1"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger>
                <SelectValue>
                  {getCategoryEmoji(category)} {EXPENSE_CATEGORIES.find((c) => c.value === category)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {date ? format(date, 'MMM d, yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {members.length > 0 && (
            <div className="space-y-2">
              <Label>Paid by</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount || !date}>
              {loading ? 'Saving...' : expense ? 'Save Changes' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
