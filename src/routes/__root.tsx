import { createRootRoute, Outlet } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ClockOutDialog } from '@/components/clock-out-dialog';
import { CommandPalette } from '@/components/command-palette';
import { Sidebar } from '@/components/sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import type { WorkLogEntry } from '@/shared/rpc-types';

function StartupClockDialog() {
    const [open, setOpen] = useState(false);
    const [clockOutOpen, setClockOutOpen] = useState(false);
    const [activeSession, setActiveSession] = useState<
        WorkLogEntry | undefined
    >();
    const [lastDescription, setLastDescription] = useState('');
    const firedRef = useRef(false);

    const checkClockState = useCallback(async () => {
        if (firedRef.current) return;

        try {
            const data = await api.getAppData();
            firedRef.current = true;

            if (!data.settings.clockInPromptOnLaunch) return;

            const active = data.workLogs.find(
                (log) => log.startTime && !log.endTime,
            );
            setActiveSession(active);

            if (!active) {
                const lastCompleted = data.workLogs
                    .filter((log) => log.startTime && log.endTime)
                    .sort((a, b) => b.timestamp - a.timestamp)[0];
                setLastDescription(lastCompleted?.description ?? '');
            }

            setOpen(true);
        } catch (error) {
            console.error('Failed to check clock state:', error);
        }
    }, []);

    useEffect(() => {
        // Delay to let the RPC bridge fully initialize on app startup
        const timer = setTimeout(checkClockState, 800);
        return () => clearTimeout(timer);
    }, [checkClockState]);

    const handleClockIn = async () => {
        const now = new Date();
        await api.createWorkLog({
            date: format(now, 'yyyy-MM-dd'),
            description: '',
            tags: [],
            startTime: format(now, 'HH:mm'),
        });
        setOpen(false);
        window.dispatchEvent(new CustomEvent('clock-state-changed'));
    };

    const handleClockOut = async (description: string, tags: string[]) => {
        if (!activeSession) return;
        const now = new Date();
        await api.updateWorkLog(activeSession.id, {
            description,
            tags,
            endTime: format(now, 'HH:mm'),
        });
        setClockOutOpen(false);
        setOpen(false);
        window.dispatchEvent(new CustomEvent('clock-state-changed'));
    };

    if (activeSession) {
        return (
            <>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                You're still clocked in
                            </DialogTitle>
                            <DialogDescription>
                                You've been clocked in since{' '}
                                {activeSession.startTime}. Would you like to
                                clock out?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Dismiss
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setOpen(false);
                                    setClockOutOpen(true);
                                }}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Clock Out
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <ClockOutDialog
                    open={clockOutOpen}
                    onOpenChange={setClockOutOpen}
                    onClockOut={handleClockOut}
                    clockedInSince={activeSession.startTime}
                />
            </>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Ready to start your day?
                    </DialogTitle>
                    <DialogDescription>
                        {lastDescription
                            ? `Your last session: "${lastDescription}". Would you like to clock in?`
                            : "You're not clocked in. Would you like to clock in?"}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Dismiss
                    </Button>
                    <Button onClick={handleClockIn}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Clock In
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export const Route = createRootRoute({
    component: () => (
        <ThemeProvider defaultTheme="system" storageKey="devlog-theme">
            <div className="flex h-dvh bg-background">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
            <CommandPalette />
            <StartupClockDialog />
        </ThemeProvider>
    ),
});
