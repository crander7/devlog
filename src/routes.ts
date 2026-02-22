import { createHashHistory, createRouter } from '@tanstack/react-router';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Hash routing works with the views:// protocol in production builds
export const router = createRouter({
    routeTree,
    history: createHashHistory(),
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
