const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Legacy compatibility - deprecated
    getLastEntry: () => ipcRenderer.invoke('get-last-entry'),
    clockOut: (workDescription) =>
        ipcRenderer.invoke('clock-out', workDescription),
    clockIn: () => ipcRenderer.invoke('clock-in'),
    getAllEntries: () => ipcRenderer.invoke('get-all-entries'),

    // New comprehensive API
    getAppData: () => ipcRenderer.invoke('getAppData'),
    saveAppData: (data) => ipcRenderer.invoke('saveAppData', data),

    // Work Logs
    createWorkLog: (entry) => ipcRenderer.invoke('createWorkLog', entry),
    updateWorkLog: (id, updates) =>
        ipcRenderer.invoke('updateWorkLog', id, updates),
    deleteWorkLog: (id) => ipcRenderer.invoke('deleteWorkLog', id),

    // Todos
    createTodo: (todo) => ipcRenderer.invoke('createTodo', todo),
    updateTodo: (id, updates) => ipcRenderer.invoke('updateTodo', id, updates),
    deleteTodo: (id) => ipcRenderer.invoke('deleteTodo', id),

    // Notes
    createNote: (note) => ipcRenderer.invoke('createNote', note),
    updateNote: (id, updates) => ipcRenderer.invoke('updateNote', id, updates),
    deleteNote: (id) => ipcRenderer.invoke('deleteNote', id),

    // Habits
    createHabit: (habit) => ipcRenderer.invoke('createHabit', habit),
    updateHabit: (id, updates) =>
        ipcRenderer.invoke('updateHabit', id, updates),
    deleteHabit: (id) => ipcRenderer.invoke('deleteHabit', id),
    completeHabit: (id) => ipcRenderer.invoke('completeHabit', id),

    // Pomodoro
    createPomodoroSession: (session) =>
        ipcRenderer.invoke('createPomodoroSession', session),
    updatePomodoroSession: (id, updates) =>
        ipcRenderer.invoke('updatePomodoroSession', id, updates),

    // Settings
    getSettings: () => ipcRenderer.invoke('getSettings'),
    updateSettings: (settings) =>
        ipcRenderer.invoke('updateSettings', settings),

    // Tray and notifications
    playNotificationSound: () => ipcRenderer.invoke('playNotificationSound'),
    updateTrayTimer: (timerState) =>
        ipcRenderer.invoke('updateTrayTimer', timerState),
});
