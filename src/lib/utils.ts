import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getHabitStreak(completedDates: string[]): number {
    if (completedDates.length === 0) return 0;

    const sorted = [...completedDates].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split('T')[0];

    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

    let streak = 0;
    let checkDate =
        sorted[0] === today ? new Date() : new Date(Date.now() - 86400000);

    for (const dateStr of sorted) {
        const expected = checkDate.toISOString().split('T')[0];
        if (dateStr === expected) {
            streak++;
            checkDate = new Date(checkDate.getTime() - 86400000);
        } else if (dateStr < expected) {
            break;
        }
    }

    return streak;
}

export function getHabitLongestStreak(completedDates: string[]): number {
    if (completedDates.length === 0) return 0;

    const sorted = [...new Set(completedDates)].sort();
    let longest = 1;
    let current = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / 86400000;

        if (diffDays === 1) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 1;
        }
    }

    return longest;
}

export function isHabitCompletedToday(completedDates: string[]): boolean {
    const today = new Date().toISOString().split('T')[0];
    return completedDates.includes(today);
}
