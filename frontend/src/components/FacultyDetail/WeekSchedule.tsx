import React from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import type { DaySchedule } from '../../types';
import TimeSlotBlock from './TimeSlotBlock';

interface Props {
  schedule: DaySchedule[];
}

export default function WeekSchedule({ schedule }: Props) {
  if (!schedule.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <CalendarDays size={32} className="mx-auto mb-2" />
        <p className="text-sm">No schedule data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedule.map((day) => {
        const dayIsToday = isToday(parseISO(day.date));
        return (
          <div key={day.date}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`flex items-center gap-1.5 text-sm font-semibold ${
                  dayIsToday ? 'text-blue-700' : 'text-gray-700'
                }`}
              >
                {dayIsToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                )}
                <span>{day.dayLabel}</span>
                <span className="text-xs font-normal text-gray-400 ml-1">
                  {format(parseISO(day.date), 'MMM d')}
                </span>
              </div>
              {dayIsToday && (
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>

            {day.events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400 text-center">
                No scheduled events — available all day
              </div>
            ) : (
              <div className="space-y-1.5" role="list" aria-label={`Events for ${day.dayLabel}`}>
                {day.events.map((event) => (
                  <TimeSlotBlock key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
