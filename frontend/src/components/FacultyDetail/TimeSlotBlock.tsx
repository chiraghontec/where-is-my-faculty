import React from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Lock, MapPin } from 'lucide-react';
import type { CalendarEventSummary } from '../../types';

interface Props {
  event: CalendarEventSummary;
}

const SHOW_AS_STYLE: Record<string, string> = {
  busy: 'bg-red-100 border-red-300 text-red-800',
  tentative: 'bg-amber-100 border-amber-300 text-amber-800',
  out_of_office: 'bg-purple-100 border-purple-300 text-purple-800',
  working_elsewhere: 'bg-blue-100 border-blue-300 text-blue-800',
  free: 'bg-gray-100 border-gray-300 text-gray-600',
};

export default function TimeSlotBlock({ event }: Props) {
  const style = SHOW_AS_STYLE[event.showAs] ?? SHOW_AS_STYLE.busy;
  const startLabel = format(parseISO(event.startTime), 'h:mm a');
  const endLabel = format(parseISO(event.endTime), 'h:mm a');
  const duration = differenceInMinutes(parseISO(event.endTime), parseISO(event.startTime));
  const durationLabel =
    duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60 ? `${duration % 60}m` : ''}`.trim();

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${style} text-sm`}
      role="listitem"
      aria-label={event.isPrivate ? 'Private event' : (event.subject ?? 'No title')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {event.isPrivate && (
              <Lock size={11} className="shrink-0 opacity-70" aria-label="Private event" />
            )}
            <span className="font-medium truncate">
              {event.isPrivate ? 'Private' : (event.subject ?? 'No title')}
            </span>
          </div>
          {event.location && !event.isPrivate && (
            <div className="flex items-center gap-1 mt-0.5 text-xs opacity-70">
              <MapPin size={10} aria-hidden="true" />
              {event.location}
            </div>
          )}
        </div>
        <div className="text-xs opacity-70 shrink-0 text-right">
          <div>{startLabel}</div>
          <div>{endLabel}</div>
          <div className="font-medium">{durationLabel}</div>
        </div>
      </div>
    </div>
  );
}
