import { create } from 'zustand';
import type { AvailabilityStatus } from '../types';

interface FacultyStore {
  selectedDepartmentId: string | null;
  searchQuery: string;
  statusFilters: AvailabilityStatus[];
  selectedFacultyId: string | null;
  lastSyncTime: Date | null;
  isSyncing: boolean;

  setSelectedDepartmentId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setStatusFilters: (filters: AvailabilityStatus[]) => void;
  toggleStatusFilter: (status: AvailabilityStatus) => void;
  setSelectedFacultyId: (id: string | null) => void;
  setLastSyncTime: (t: Date) => void;
  setIsSyncing: (v: boolean) => void;
  clearFilters: () => void;
}

export const useFacultyStore = create<FacultyStore>((set) => ({
  selectedDepartmentId: null,
  searchQuery: '',
  statusFilters: [],
  selectedFacultyId: null,
  lastSyncTime: null,
  isSyncing: false,

  setSelectedDepartmentId: (id) => set({ selectedDepartmentId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setStatusFilters: (filters) => set({ statusFilters: filters }),
  toggleStatusFilter: (status) =>
    set((state) => ({
      statusFilters: state.statusFilters.includes(status)
        ? state.statusFilters.filter((s) => s !== status)
        : [...state.statusFilters, status],
    })),
  setSelectedFacultyId: (id) => set({ selectedFacultyId: id }),
  setLastSyncTime: (t) => set({ lastSyncTime: t }),
  setIsSyncing: (v) => set({ isSyncing: v }),
  clearFilters: () =>
    set({ selectedDepartmentId: null, searchQuery: '', statusFilters: [] }),
}));
