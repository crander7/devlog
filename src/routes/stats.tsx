import { createFileRoute } from '@tanstack/react-router';
import { Stats } from '@/components/stats';

export const Route = createFileRoute('/stats')({
    component: Stats,
});
