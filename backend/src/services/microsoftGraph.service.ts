import { ConfidentialClientApplication } from '@azure/msal-node';
import axios from 'axios';
import { addDays, subDays, formatISO } from 'date-fns';
import { config } from '../config';
import logger from '../utils/logger';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

interface GraphCalendarEvent {
  id: string;
  subject: string | null;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  showAs: string;
  sensitivity: string;
  location?: { displayName?: string };
  isCancelled?: boolean;
  isAllDay?: boolean;
}

interface OofStatus {
  automaticRepliesSetting: {
    status: 'alwaysEnabled' | 'scheduled' | 'disabled';
    scheduledStartDateTime?: { dateTime: string };
    scheduledEndDateTime?: { dateTime: string };
  };
}

let msalApp: ConfidentialClientApplication | null = null;

function getMsalApp(): ConfidentialClientApplication {
  if (!msalApp) {
    msalApp = new ConfidentialClientApplication({
      auth: {
        clientId: config.azure.clientId,
        authority: config.azure.authority,
        clientSecret: config.azure.clientSecret,
      },
    });
  }
  return msalApp;
}

export async function getAccessToken(): Promise<string> {
  if (!config.azure.clientId || !config.azure.clientSecret) {
    throw new Error('Microsoft Graph credentials not configured. Set AZURE_CLIENT_ID and AZURE_CLIENT_SECRET.');
  }
  const result = await getMsalApp().acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });
  if (!result?.accessToken) throw new Error('Failed to acquire Microsoft Graph access token');
  return result.accessToken;
}

export async function getCalendarEvents(
  token: string,
  userPrincipalName: string,
  options?: { daysBack?: number; daysAhead?: number }
): Promise<GraphCalendarEvent[]> {
  const daysBack = options?.daysBack ?? 1;
  const daysAhead = options?.daysAhead ?? config.sync.lookaheadDays;
  const start = formatISO(subDays(new Date(), daysBack));
  const end = formatISO(addDays(new Date(), daysAhead));

  try {
    const url =
      `${GRAPH_BASE}/users/${encodeURIComponent(userPrincipalName)}/calendarView` +
      `?startDateTime=${start}&endDateTime=${end}` +
      `&$select=id,subject,start,end,showAs,sensitivity,location,isCancelled,isAllDay` +
      `&$top=100`;

    const res = await axios.get<{ value: GraphCalendarEvent[] }>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.value ?? [];
  } catch (err: unknown) {
    logger.error('Graph API calendar fetch failed', { user: userPrincipalName, err });
    throw err;
  }
}

export async function getOofStatus(
  token: string,
  userPrincipalName: string
): Promise<boolean> {
  try {
    const url = `${GRAPH_BASE}/users/${encodeURIComponent(userPrincipalName)}/mailboxSettings`;
    const res = await axios.get<OofStatus>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const status = res.data.automaticRepliesSetting?.status;
    if (status === 'alwaysEnabled') return true;
    if (status === 'scheduled') {
      const { scheduledStartDateTime, scheduledEndDateTime } = res.data.automaticRepliesSetting;
      const now = new Date();
      if (scheduledStartDateTime && scheduledEndDateTime) {
        return (
          now >= new Date(scheduledStartDateTime.dateTime) &&
          now <= new Date(scheduledEndDateTime.dateTime)
        );
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function mapGraphEvent(event: GraphCalendarEvent) {
  const showAsMap: Record<string, string> = {
    free: 'free',
    tentative: 'tentative',
    busy: 'busy',
    oof: 'out_of_office',
    workingElsewhere: 'working_elsewhere',
  };

  return {
    outlookEventId: event.id,
    subject: event.sensitivity === 'private' ? null : (event.subject ?? null),
    startTime: new Date(event.start.dateTime),
    endTime: new Date(event.end.dateTime),
    showAs: (showAsMap[event.showAs] ?? 'busy') as 'free' | 'tentative' | 'busy' | 'out_of_office' | 'working_elsewhere',
    isPrivate: event.sensitivity === 'private',
    isAllDay: event.isAllDay ?? false,
    location: event.location?.displayName ?? null,
    isCancelled: event.isCancelled ?? false,
  };
}
