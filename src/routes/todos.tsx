import { createFileRoute } from '@tanstack/react-router';
import { Todos } from '@/components/todos';

export const Route = createFileRoute('/todos')({
    component: Todos,
});
