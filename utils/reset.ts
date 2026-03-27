import { ResetInterval } from '@/types/task';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const RESET_INTERVALS: Record<Exclude<ResetInterval, 'none'>, number> = {
  daily: DAY_IN_MS,
  weekly: 7 * DAY_IN_MS,
  monthly: 30 * DAY_IN_MS,
  yearly: 365 * DAY_IN_MS,
};

export function shouldResetTasks(
  interval: ResetInterval,
  lastResetAt: string | null,
  now = Date.now()
) {
  if (interval === 'none') {
    return false;
  }

  if (!lastResetAt) {
    return true;
  }

  const elapsed = now - new Date(lastResetAt).getTime();
  return elapsed >= RESET_INTERVALS[interval];
}

export function formatRelativeResetLabel(interval: ResetInterval) {
  switch (interval) {
    case 'daily':
      return 'Every day';
    case 'weekly':
      return 'Every 7 days';
    case 'monthly':
      return 'Every 30 days';
    case 'yearly':
      return 'Every 365 days';
    default:
      return 'Never';
  }
}
