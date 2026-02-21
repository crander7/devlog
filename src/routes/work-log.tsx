import { createFileRoute } from '@tanstack/react-router';
import { WorkLog } from '@/components/work-log';

export const Route = createFileRoute('/work-log')({
    component: WorkLog,
});
