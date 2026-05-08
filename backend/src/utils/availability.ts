import { parse, isWithinInterval, parseISO } from 'date-fns';

export type ShowAs = 'free' | 'tentative' | 'busy' | 'out_of_office' | 'working_elsewhere';

export type AvailabilityStatus =
  | 'available'
  | 'in_meeting'
  | 'busy'
  | 'on_leave'
  | 'out_of_office'
  | 'offline'
  | 'unknown';

export interface CalendarEvent {
  id: string;
  outlookEventId: string;
  subject: string | null;
  startTime: Date;
  endTime: Date;
  showAs: ShowAs;
  isPrivate: boolean;
  isAllDay: boolean;
  location: string | null;
  isCancelled: boolean;
}

export interface Leave {
  id: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

export interface Faculty {
  id: string;
  workingHoursStart: string;
  workingHoursEnd: string;
}

export interface AvailabilityResult {
  status: AvailabilityStatus;
  statusLabel: string;
  currentEvent?: CalendarEvent | null;
  nextEvent?: CalendarEvent | null;
  freeUntil?: Date;
  busyUntil?: Date;
  leaveType?: string;
}

function isWithinWorkingHours(checkTime: Date, faculty: Faculty): boolean {
  const [startH, startM] = faculty.workingHoursStart.split(':').map(Number);
  const [endH, endM] = faculty.workingHoursEnd.split(':').map(Number);
  const h = checkTime.getHours();
  const m = checkTime.getMinutes();
  const nowMins = h * 60 + m;
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  // Also exclude weekends
  const day = checkTime.getDay();
  if (day === 0 || day === 6) return false;
  return nowMins >= startMins && nowMins < endMins;
}

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Available',
  in_meeting: 'In Meeting',
  busy: 'Busy',
  on_leave: 'On Leave',
  out_of_office: 'Out of Office',
  offline: 'Offline',
  unknown: 'Unknown',
};

export function resolveAvailability(
  faculty: Faculty,
  events: CalendarEvent[],
  leaves: Leave[],
  checkTime: Date = new Date()
): AvailabilityResult {
  if (!isWithinWorkingHours(checkTime, faculty)) {
    return { status: 'offline', statusLabel: STATUS_LABELS.offline };
  }

  // Check approved leave
  const activeLeave = leaves.find(
    (l) =>
      l.status === 'approved' &&
      checkTime >= l.startDate &&
      checkTime <= l.endDate
  );
  if (activeLeave) {
    return {
      status: 'on_leave',
      statusLabel: STATUS_LABELS.on_leave,
      leaveType: activeLeave.leaveType,
    };
  }

  // Check active calendar event
  const activeEvent = events
    .filter(
      (e) =>
        !e.isCancelled &&
        e.showAs !== 'free' &&
        checkTime >= e.startTime &&
        checkTime < e.endTime
    )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

  if (activeEvent) {
    let status: AvailabilityStatus = 'busy';
    if (activeEvent.showAs === 'out_of_office') status = 'out_of_office';
    else if (activeEvent.showAs === 'tentative') status = 'in_meeting';
    else if (activeEvent.showAs === 'busy') status = 'busy';

    const nextEvent = events
      .filter(
        (e) =>
          !e.isCancelled &&
          e.showAs !== 'free' &&
          e.startTime > checkTime &&
          e !== activeEvent
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

    return {
      status,
      statusLabel: STATUS_LABELS[status],
      currentEvent: activeEvent,
      busyUntil: activeEvent.endTime,
      nextEvent: nextEvent ?? null,
    };
  }

  // Available — find next event
  const nextEvent = events
    .filter(
      (e) => !e.isCancelled && e.showAs !== 'free' && e.startTime > checkTime
    )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

  return {
    status: 'available',
    statusLabel: STATUS_LABELS.available,
    nextEvent: nextEvent ?? null,
    freeUntil: nextEvent?.startTime,
  };
}
