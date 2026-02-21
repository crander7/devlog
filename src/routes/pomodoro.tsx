import { createFileRoute } from '@tanstack/react-router';
import { Pomodoro } from '@/components/pomodoro';

export const Route = createFileRoute('/pomodoro')({
    component: Pomodoro,
});
