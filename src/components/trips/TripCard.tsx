'use client';

import { format, differenceInDays, isPast, isFuture, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Trip, Expense } from '@/lib/types';

interface TripCardProps {
  trip: Trip & { expenses?: Expense[] };
  onClick?: () => void;
}

export function TripCard({ trip, onClick }: TripCardProps) {
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const today = new Date();

  const duration = differenceInDays(endDate, startDate) + 1;
  const totalExpenses = trip.expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) ?? 0;

  const getStatus = () => {
    if (isPast(endDate)) return { label: 'Completed', variant: 'secondary' as const };
    if (isFuture(startDate)) {
      const daysUntil = differenceInDays(startDate, today);
      return { label: `In ${daysUntil} days`, variant: 'default' as const };
    }
    if (isWithinInterval(today, { start: startDate, end: endDate })) {
      return { label: 'Ongoing', variant: 'default' as const };
    }
    return { label: 'Upcoming', variant: 'default' as const };
  };

  const status = getStatus();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{trip.name}</CardTitle>
            <p className="text-sm text-gray-500">{trip.destination}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm text-gray-600">
          <div>
            <p>{format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}</p>
            <p className="text-gray-400">{duration} days</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900">
              {totalExpenses > 0 ? `€${totalExpenses.toFixed(2)}` : 'No expenses'}
            </p>
            {trip.expenses && trip.expenses.length > 0 && (
              <p className="text-gray-400">{trip.expenses.length} expenses</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
