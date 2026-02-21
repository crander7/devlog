import { createFileRoute } from '@tanstack/react-router';
import { Habits } from '@/components/habits';

export const Route = createFileRoute('/habits')({
    component: Habits,
});
