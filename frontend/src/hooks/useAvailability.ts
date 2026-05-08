import { useQuery } from '@tanstack/react-query';
import { checkAvailability } from '../services/api';
import type { AvailabilityCheckParams } from '../types';

export function useAvailabilityCheck(params: AvailabilityCheckParams | null) {
  return useQuery({
    queryKey: ['availability', params],
    queryFn: () => checkAvailability(params!),
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
    select: (res) => res.data,
  });
}
