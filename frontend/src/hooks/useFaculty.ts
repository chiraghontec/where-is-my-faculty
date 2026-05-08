import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFaculty, getFacultyById, getDepartments, triggerSync } from '../services/api';
import { useFacultyStore } from '../store/facultyStore';
import { REFETCH_INTERVAL_MS, STALE_TIME_MS } from '../constants';
import type { FacultyFilters } from '../types';

export function useFacultyList() {
  const { searchQuery, selectedDepartmentId, statusFilters } = useFacultyStore();

  const filters: FacultyFilters = {
    search: searchQuery || undefined,
    departmentId: selectedDepartmentId ?? undefined,
    status: statusFilters.length > 0 ? statusFilters : undefined,
    sortBy: 'name',
  };

  return useQuery({
    queryKey: ['faculty', filters],
    queryFn: () => getFaculty(filters),
    staleTime: STALE_TIME_MS,
    refetchInterval: REFETCH_INTERVAL_MS,
    select: (res) => res.data,
  });
}

export function useFacultyDetail(id: string | null) {
  return useQuery({
    queryKey: ['faculty', id, 'detail'],
    queryFn: () => getFacultyById(id!),
    enabled: !!id,
    staleTime: STALE_TIME_MS,
    select: (res) => res.data,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 10 * 60 * 1000,
    select: (res) => res.data,
  });
}

export function useSyncTrigger() {
  const queryClient = useQueryClient();
  const { setLastSyncTime, setIsSyncing } = useFacultyStore();

  return useMutation({
    mutationFn: (facultyId?: string) => triggerSync(facultyId),
    onMutate: () => setIsSyncing(true),
    onSuccess: () => {
      setLastSyncTime(new Date());
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    },
    onSettled: () => setIsSyncing(false),
  });
}
