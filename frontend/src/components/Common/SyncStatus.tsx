import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useFacultyStore } from '../../store/facultyStore';
import { useSyncTrigger } from '../../hooks/useFaculty';

export default function SyncStatus() {
  const { lastSyncTime, isSyncing } = useFacultyStore();
  const syncMutation = useSyncTrigger();

  return (
    <div className="flex items-center gap-2 text-sm">
      {isSyncing ? (
        <span className="flex items-center gap-1.5 text-blue-600">
          <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
          <span>Syncing...</span>
        </span>
      ) : lastSyncTime ? (
        <span className="flex items-center gap-1.5 text-gray-500">
          <CheckCircle size={14} className="text-emerald-500" aria-hidden="true" />
          <span>Synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-amber-600">
          <AlertCircle size={14} aria-hidden="true" />
          <span>Not yet synced</span>
        </span>
      )}
      <button
        onClick={() => syncMutation.mutate(undefined)}
        disabled={isSyncing}
        className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Trigger calendar sync"
        title="Sync now"
      >
        <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
