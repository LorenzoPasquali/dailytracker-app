import { format, subDays } from 'date-fns';

export const PRESETS = [
  { key: '7d', label: '7 dias', days: 7 },
  { key: '30d', label: '30 dias', days: 30 },
  { key: '90d', label: '90 dias', days: 90 },
];

export function rangeFor(preset, custom) {
  const [start, end] = custom || [];
  if (start) {
    return { from: format(start, 'yyyy-MM-dd'), to: format(end || start, 'yyyy-MM-dd') };
  }
  const days = PRESETS.find((p) => p.key === preset)?.days ?? 30;
  const now = new Date();
  return { from: format(subDays(now, days - 1), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
}
