import { createRootRoute, Outlet } from '@tanstack/react-router';
import { CommandPalette } from '@/components/command-palette';
import { Sidebar } from '@/components/sidebar';
import { ThemeProvider } from '@/components/theme-provider';

export const Route = createRootRoute({
    component: () => (
        <ThemeProvider defaultTheme="system" storageKey="devlog-theme">
            <div className="flex h-screen bg-background">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
            <CommandPalette />
        </ThemeProvider>
    ),
});
