import { Link, useLocation } from '@tanstack/react-router';
import {
    BarChart3,
    CheckSquare,
    ChevronsLeft,
    ChevronsRight,
    FileText,
    LayoutDashboard,
    Monitor,
    Moon,
    Settings,
    StickyNote,
    Sun,
    Target,
    Timer,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
// @ts-expect-error - logo.png is a valid image
import logoImg from '/logo.png';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Work Log', href: '/work-log', icon: FileText },
    { name: 'Todos', href: '/todos', icon: CheckSquare },
    { name: 'Pomodoro', href: '/pomodoro', icon: Timer },
    { name: 'Notes', href: '/notes', icon: StickyNote },
    { name: 'Habits', href: '/habits', icon: Target },
    { name: 'Stats', href: '/stats', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
];

const STORAGE_KEY = 'devlog-sidebar-collapsed';

function getInitialCollapsed(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

export function Sidebar() {
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(getInitialCollapsed);

    const toggleCollapsed = () => {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
            // localStorage unavailable
        }
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div
                className={cn(
                    'bg-card border-r border-border flex flex-col h-full overflow-hidden transition-[width] duration-200 ease-in-out',
                    collapsed ? 'w-16' : 'w-64',
                )}
            >
                {/* Logo + collapse toggle */}
                <div
                    className={cn(
                        'flex items-center shrink-0',
                        collapsed
                            ? 'justify-center p-3'
                            : 'justify-between px-4 py-3',
                    )}
                >
                    {!collapsed && (
                        <img
                            src={logoImg}
                            alt="DevLog"
                            className="w-14 h-14 rounded-lg"
                        />
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleCollapsed}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            >
                                {collapsed ? (
                                    <ChevronsRight className="h-4 w-4" />
                                ) : (
                                    <ChevronsLeft className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        {collapsed && (
                            <TooltipContent side="right">
                                Expand sidebar
                            </TooltipContent>
                        )}
                    </Tooltip>
                </div>

                {/* Navigation */}
                <nav className="flex-1 min-h-0 overflow-auto px-2 py-2">
                    <ul className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;

                            const link = (
                                <Link
                                    to={item.href}
                                    className={cn(
                                        'flex items-center rounded-md text-sm font-medium transition-colors',
                                        'hover:bg-primary/10 hover:text-primary',
                                        isActive
                                            ? 'bg-primary/15 text-primary'
                                            : 'text-muted-foreground',
                                        collapsed
                                            ? 'justify-center px-2 py-2'
                                            : 'gap-3 px-3 py-2',
                                    )}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {!collapsed && (
                                        <span className="truncate">
                                            {item.name}
                                        </span>
                                    )}
                                </Link>
                            );

                            return (
                                <li key={item.name}>
                                    {collapsed ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                {link}
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                {item.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        link
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Theme switcher — pinned to bottom */}
                <div className="p-2 border-t border-border shrink-0">
                    {collapsed ? (
                        <div className="flex flex-col items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={
                                            theme === 'light'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        onClick={() => setTheme('light')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Sun className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    Light
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={
                                            theme === 'dark'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        onClick={() => setTheme('dark')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Moon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    Dark
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={
                                            theme === 'system'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        onClick={() => setTheme('system')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Monitor className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    System
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-medium">Theme</span>
                            <div className="flex gap-1">
                                <Button
                                    variant={
                                        theme === 'light' ? 'default' : 'ghost'
                                    }
                                    size="sm"
                                    onClick={() => setTheme('light')}
                                    className="h-8 w-8 p-0"
                                >
                                    <Sun className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={
                                        theme === 'dark' ? 'default' : 'ghost'
                                    }
                                    size="sm"
                                    onClick={() => setTheme('dark')}
                                    className="h-8 w-8 p-0"
                                >
                                    <Moon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={
                                        theme === 'system' ? 'default' : 'ghost'
                                    }
                                    size="sm"
                                    onClick={() => setTheme('system')}
                                    className="h-8 w-8 p-0"
                                >
                                    <Monitor className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
