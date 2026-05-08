import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeaves, submitLeave, reviewLeave, cancelLeave } from '../services/api';
import type { LeaveFormData } from '../types';

export function useLeaves(facultyId?: string) {
  return useQuery({
    queryKey: ['leaves', facultyId ?? 'all'],
    queryFn: () => getLeaves(facultyId),
    staleTime: 60_000,
    select: (res) => res.data,
  });
}

export function useSubmitLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeaveFormData) => submitLeave(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
  });
}

export function useReviewLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject'; note?: string }) =>
      reviewLeave(id, action, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['faculty'] });
    },
  });
}

export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelLeave(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
  });
}
