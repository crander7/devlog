import { Link, useLocation } from '@tanstack/react-router';
import {
    BarChart3,
    CheckSquare,
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
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
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

export function Sidebar() {
    const location = useLocation();
    const { theme, setTheme } = useTheme();

    return (
        <div className="w-64 bg-card border-r border-border flex flex-col">
            <div className="p-6 flex justify-center">
                <img
                    src={logoImg}
                    alt="DevLog"
                    className="w-50 h-50 rounded-lg"
                />
            </div>

            <nav className="flex-1 px-4">
                <ul className="space-y-2">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;

                        return (
                            <li key={item.name}>
                                <Link
                                    to={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                        'hover:bg-accent hover:text-accent-foreground',
                                        isActive
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Theme</span>
                    <div className="flex gap-1">
                        <Button
                            variant={theme === 'light' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTheme('light')}
                            className="h-8 w-8 p-0"
                        >
                            <Sun className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={theme === 'dark' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTheme('dark')}
                            className="h-8 w-8 p-0"
                        >
                            <Moon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={theme === 'system' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTheme('system')}
                            className="h-8 w-8 p-0"
                        >
                            <Monitor className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
