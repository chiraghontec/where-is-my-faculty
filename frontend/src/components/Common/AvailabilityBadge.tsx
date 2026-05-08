import React from 'react';
import { STATUS_CONFIG } from '../../constants';
import type { AvailabilityStatus } from '../../types';

interface Props {
  status: AvailabilityStatus;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export default function AvailabilityBadge({ status, size = 'md', showPulse = false }: Props) {
  const cfg = STATUS_CONFIG[status];

  const sizes = {
    sm: { dot: 'w-2 h-2', text: 'text-xs', gap: 'gap-1.5', px: 'px-2 py-0.5' },
    md: { dot: 'w-2.5 h-2.5', text: 'text-sm', gap: 'gap-2', px: 'px-2.5 py-1' },
    lg: { dot: 'w-3 h-3', text: 'text-base', gap: 'gap-2', px: 'px-3 py-1.5' },
  }[size];

  return (
    <span
      className={`inline-flex items-center ${sizes.gap} ${sizes.px} rounded-full font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}
      role="status"
      aria-label={`Status: ${cfg.label}`}
    >
      <span className="relative flex shrink-0">
        {showPulse && status === 'available' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60`}
          />
        )}
        <span className={`relative rounded-full ${sizes.dot} ${cfg.dot}`} />
      </span>
      <span className={sizes.text}>{cfg.label}</span>
    </span>
  );
}
