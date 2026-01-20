'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import { getTrips } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Trip } from '@/lib/types';

const TRIP_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
];

interface TripWithColor extends Trip {
  color: string;
}

export function CalendarView() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripWithColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTrip, setSelectedTrip] = useState<TripWithColor | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    try {
      const data = await getTrips();
      const tripsWithColors = data.map((trip, index) => ({
        ...trip,
        color: TRIP_COLORS[index % TRIP_COLORS.length],
      }));
      setTrips(tripsWithColors);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTripsForDay = (day: Date) => {
    return trips.filter((trip) => {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      return isWithinInterval(day, { start, end });
    });
  };

  const isStartOfTrip = (day: Date, trip: Trip) => {
    return isSameDay(day, new Date(trip.start_date));
  };

  const isEndOfTrip = (day: Date, trip: Trip) => {
    return isSameDay(day, new Date(trip.end_date));
  };

  const today = new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Month Title */}
      <h2 className="text-xl font-semibold text-center">
        {format(currentDate, 'MMMM yyyy')}
      </h2>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayTrips = getTripsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] border-b border-r p-1 ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                } ${index % 7 === 6 ? 'border-r-0' : ''}`}
              >
                <div
                  className={`text-sm mb-1 ${
                    isToday
                      ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                      : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayTrips.map((trip) => {
                    const isStart = isStartOfTrip(day, trip);
                    const isEnd = isEndOfTrip(day, trip);

                    return (
                      <Popover key={trip.id}>
                        <PopoverTrigger asChild>
                          <button
                            className={`w-full text-left text-xs text-white px-1 py-0.5 truncate cursor-pointer hover:opacity-80 transition-opacity ${trip.color} ${
                              isStart ? 'rounded-l' : ''
                            } ${isEnd ? 'rounded-r' : ''}`}
                            onClick={() => setSelectedTrip(trip)}
                          >
                            {isStart ? trip.name : ''}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="start">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{trip.name}</h3>
                            <p className="text-sm text-gray-600">
                              {trip.destination}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(trip.start_date), 'MMM d')} -{' '}
                              {format(new Date(trip.end_date), 'MMM d, yyyy')}
                            </p>
                            {trip.notes && (
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {trip.notes}
                              </p>
                            )}
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => router.push(`/trips/${trip.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {trips.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {trips.map((trip) => (
            <div key={trip.id} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded ${trip.color}`} />
              <span>{trip.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {trips.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
          <p className="text-gray-500 mb-2">No trips planned yet</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/')}>
            Create your first trip
          </Button>
        </div>
      )}
    </div>
  );
}
