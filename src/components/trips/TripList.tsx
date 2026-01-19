'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TripCard } from './TripCard';
import { TripForm } from './TripForm';
import { getTrips, createTrip } from '@/lib/api';
import type { Trip, TripFormData } from '@/lib/types';

export function TripList() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTrips();
      setTrips(data);
    } catch (err) {
      setError('Failed to load trips. Make sure Supabase is configured.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (data: TripFormData) => {
    const newTrip = await createTrip(data);
    setTrips((prev) => [...prev, newTrip]);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading trips...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <p className="text-sm text-gray-500 mb-4">
          Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file with your Supabase credentials.
        </p>
        <Button onClick={loadTrips}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Trips</h1>
          <p className="text-gray-500">
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>New Trip</Button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No trips yet. Start planning your first vacation!</p>
          <Button onClick={() => setShowForm(true)}>Create Your First Trip</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onClick={() => router.push(`/trips/${trip.id}`)}
            />
          ))}
        </div>
      )}

      <TripForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateTrip}
      />
    </div>
  );
}
