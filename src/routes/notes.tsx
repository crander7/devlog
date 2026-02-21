import { createFileRoute } from '@tanstack/react-router';
import { Notes } from '@/components/notes';

export const Route = createFileRoute('/notes')({
    component: Notes,
});
