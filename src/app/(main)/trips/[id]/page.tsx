'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { getTrip, updateTrip, deleteTrip } from '@/lib/api';
import { getHouseholdMembers } from '@/lib/household';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TripForm } from '@/components/trips/TripForm';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import type { TripWithDetails, TripFormData, HouseholdMember } from '@/lib/types';

interface Member {
  id: string;
  label: string;
}

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [id]);

  async function loadTrip() {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Get household members
      const householdMembers = await getHouseholdMembers();
      const memberList: Member[] = householdMembers
        .filter((m) => m.status === 'active' && m.user_id)
        .map((m) => ({
          id: m.user_id!,
          label: m.user_id === user?.id ? 'Me' : 'Partner',
        }));
      setMembers(memberList);

      const data = await getTrip(id);
      if (!data) {
        setError('Trip not found');
        return;
      }
      setTrip(data);
    } catch (err) {
      setError('Failed to load trip');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(data: Omit<TripFormData, 'household_id'>) {
    if (!trip) return;
    const updated = await updateTrip(trip.id, data);
    setTrip({ ...trip, ...updated });
    setShowEditForm(false);
  }

  async function handleDelete() {
    if (!trip) return;
    setDeleting(true);
    try {
      await deleteTrip(trip.id);
      router.push('/');
    } catch (err) {
      console.error('Failed to delete trip:', err);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading trip...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Trip not found'}</p>
        <Button onClick={() => router.push('/')}>Back to Trips</Button>
      </div>
    );
  }

  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const duration = differenceInDays(endDate, startDate) + 1;
  const now = new Date();
  const isPast = endDate < now;
  const isOngoing = startDate <= now && endDate >= now;
  const isUpcoming = startDate > now;

  const completedItems = trip.checklists.reduce(
    (sum, cl) => sum + cl.items.filter((i) => i.checked).length,
    0
  );
  const totalItems = trip.checklists.reduce((sum, cl) => sum + cl.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              ← Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{trip.name}</h1>
          <p className="text-lg text-gray-600">{trip.destination}</p>
        </div>
        <div className="flex items-center gap-2">
          {isPast && <Badge variant="secondary">Completed</Badge>}
          {isOngoing && <Badge className="bg-green-500">Ongoing</Badge>}
          {isUpcoming && <Badge className="bg-blue-500">Upcoming</Badge>}
        </div>
      </div>

      {/* Trip Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Trip Details</CardTitle>
            <CardDescription>
              {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')} ({duration} {duration === 1 ? 'day' : 'days'})
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditForm(true)}>
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </Button>
          </div>
        </CardHeader>
        {trip.notes && (
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{trip.notes}</p>
          </CardContent>
        )}
      </Card>

      {/* Expenses */}
      <Card>
        <CardContent className="pt-6">
          <ExpenseList
            tripId={trip.id}
            expenses={trip.expenses}
            members={members}
            currentUserId={currentUserId}
            onUpdate={loadTrip}
          />
        </CardContent>
      </Card>

      {/* Checklists Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Checklists</CardTitle>
          <CardDescription>
            {trip.checklists.length} {trip.checklists.length === 1 ? 'checklist' : 'checklists'}
            {totalItems > 0 && ` · ${completedItems}/${totalItems} items completed`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trip.checklists.length === 0 ? (
            <p className="text-gray-500 text-sm">No checklists created yet.</p>
          ) : (
            <div className="space-y-3">
              {trip.checklists.map((checklist) => {
                const completed = checklist.items.filter((i) => i.checked).length;
                const total = checklist.items.length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div key={checklist.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{checklist.name}</span>
                      <span className="text-xs text-gray-500">{completed}/{total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form */}
      <TripForm
        trip={trip}
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleUpdate}
      />

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trip</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{trip.name}&quot;? This will also delete all expenses and checklists. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Trip'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
