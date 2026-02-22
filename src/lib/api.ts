import type {
    ActiveTimerState,
    AppData,
    AppSettings,
    Habit,
    Note,
    PomodoroSession,
    Todo,
    WorkLogEntry,
} from '../shared/rpc-types';

type RpcProxy = {
    requestProxy: {
        getAppData: () => Promise<AppData>;
        saveAppData: (params: { data: Partial<AppData> }) => Promise<boolean>;
        createWorkLog: (params: {
            entry: Omit<WorkLogEntry, 'id' | 'timestamp'>;
        }) => Promise<{ id: string }>;
        updateWorkLog: (params: {
            id: string;
            updates: Partial<WorkLogEntry>;
        }) => Promise<boolean>;
        deleteWorkLog: (params: { id: string }) => Promise<boolean>;
        createTodo: (params: {
            todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>;
        }) => Promise<{ id: string }>;
        updateTodo: (params: {
            id: string;
            updates: Partial<Todo>;
        }) => Promise<boolean>;
        deleteTodo: (params: { id: string }) => Promise<boolean>;
        createNote: (params: {
            note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;
        }) => Promise<{ id: string }>;
        updateNote: (params: {
            id: string;
            updates: Partial<Note>;
        }) => Promise<boolean>;
        deleteNote: (params: { id: string }) => Promise<boolean>;
        createHabit: (params: {
            habit: {
                name: string;
                description?: string;
                frequency?: string;
                targetCount?: number;
                color?: string;
                icon?: string;
            };
        }) => Promise<{ id: string }>;
        updateHabit: (params: {
            id: string;
            updates: Partial<Habit>;
        }) => Promise<boolean>;
        deleteHabit: (params: { id: string }) => Promise<boolean>;
        completeHabit: (params: { id: string }) => Promise<boolean>;
        createPomodoroSession: (params: {
            session: Omit<PomodoroSession, 'id'>;
        }) => Promise<{ id: string }>;
        updatePomodoroSession: (params: {
            id: string;
            updates: Partial<PomodoroSession>;
        }) => Promise<boolean>;
        getSettings: () => Promise<AppSettings>;
        updateSettings: (params: {
            settings: Partial<AppSettings>;
        }) => Promise<boolean>;
    };
    sendProxy: {
        playNotificationSound: () => void;
        updateTrayTimer: (params: {
            timerState?: ActiveTimerState | null;
        }) => void;
    };
};

let _rpc: RpcProxy | null = null;

async function getRpc(): Promise<RpcProxy> {
    if (_rpc) return _rpc;

    const { Electroview } = await import('electrobun/view');

    const rpc = Electroview.defineRPC({
        handlers: {
            requests: {},
            messages: {},
        },
    });

    void new Electroview({ rpc }); // keep instance for RPC bridge
    _rpc = rpc as unknown as RpcProxy;
    return _rpc;
}

export const api = {
    getAppData: async () => {
        const rpc = await getRpc();
        return rpc.requestProxy.getAppData();
    },
    saveAppData: async (data: Partial<AppData>) => {
        const rpc = await getRpc();
        return rpc.requestProxy.saveAppData({ data });
    },

    getAllEntries: async () => {
        const rpc = await getRpc();
        const d = await rpc.requestProxy.getAppData();
        return d.workLogs;
    },

    createWorkLog: async (entry: Omit<WorkLogEntry, 'id' | 'timestamp'>) => {
        const rpc = await getRpc();
        return rpc.requestProxy.createWorkLog({ entry });
    },
    updateWorkLog: async (id: string, updates: Partial<WorkLogEntry>) => {
        const rpc = await getRpc();
        return rpc.requestProxy.updateWorkLog({ id, updates });
    },
    deleteWorkLog: async (id: string) => {
        const rpc = await getRpc();
        return rpc.requestProxy.deleteWorkLog({ id });
    },

    createTodo: async (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
        const rpc = await getRpc();
        return rpc.requestProxy.createTodo({ todo });
    },
    updateTodo: async (id: string, updates: Partial<Todo>) => {
        const rpc = await getRpc();
        return rpc.requestProxy.updateTodo({ id, updates });
    },
    deleteTodo: async (id: string) => {
        const rpc = await getRpc();
        return rpc.requestProxy.deleteTodo({ id });
    },

    createNote: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
        const rpc = await getRpc();
        return rpc.requestProxy.createNote({ note });
    },
    updateNote: async (id: string, updates: Partial<Note>) => {
        const rpc = await getRpc();
        return rpc.requestProxy.updateNote({ id, updates });
    },
    deleteNote: async (id: string) => {
        const rpc = await getRpc();
        return rpc.requestProxy.deleteNote({ id });
    },

    createHabit: async (habit: {
        name: string;
        description?: string;
        frequency?: string;
        targetCount?: number;
        color?: string;
        icon?: string;
    }) => {
        const rpc = await getRpc();
        return rpc.requestProxy.createHabit({ habit });
    },
    updateHabit: async (id: string, updates: Partial<Habit>) => {
        const rpc = await getRpc();
        return rpc.requestProxy.updateHabit({ id, updates });
    },
    deleteHabit: async (id: string) => {
        const rpc = await getRpc();
        return rpc.requestProxy.deleteHabit({ id });
    },
    completeHabit: async (id: string) => {
        const rpc = await getRpc();
        return rpc.requestProxy.completeHabit({ id });
    },

    createPomodoroSession: async (session: Omit<PomodoroSession, 'id'>) => {
        const rpc = await getRpc();
        return rpc.requestProxy.createPomodoroSession({ session });
    },
    updatePomodoroSession: async (
        id: string,
        updates: Partial<PomodoroSession>,
    ) => {
        const rpc = await getRpc();
        return rpc.requestProxy.updatePomodoroSession({ id, updates });
    },

    getSettings: async () => {
        const rpc = await getRpc();
        return rpc.requestProxy.getSettings();
    },
    updateSettings: async (settings: Partial<AppSettings>) => {
        const rpc = await getRpc();
        return rpc.requestProxy.updateSettings({ settings });
    },

    playNotificationSound: async () => {
        const rpc = await getRpc();
        rpc.sendProxy.playNotificationSound();
    },
    updateTrayTimer: async (timerState?: ActiveTimerState | null) => {
        const rpc = await getRpc();
        rpc.sendProxy.updateTrayTimer({ timerState });
    },
};
