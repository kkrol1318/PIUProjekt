const STORAGE_KEY = 'smart-study-planner:v1';

const defaultState = {
    theme: 'light',
    selectedSubjectId: null,
    subjects: [],
    tasks: [],
};

export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return structuredClone(defaultState);
        const parsed = JSON.parse(raw);
        return { ...structuredClone(defaultState), ...parsed };
    } catch {
        return structuredClone(defaultState);
    }
}

export function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function setTheme(state, theme) {
    state.theme = theme;
    saveState(state);
}

export function addSubject(state, name) {
    const subject = { id: crypto.randomUUID(), name: name.trim() };
    state.subjects.push(subject);
    if (!state.selectedSubjectId) state.selectedSubjectId = subject.id;
    saveState(state);
    return subject;
}

export function selectSubject(state, id) {
    state.selectedSubjectId = id;
    saveState(state);
}

export function addTask(state, task) {
    state.tasks.push(task);
    saveState(state);
}

export function toggleTaskDone(state, taskId) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return;
    t.done = !t.done;
    saveState(state);
}

export function deleteTask(state, taskId) {
    state.tasks = state.tasks.filter((x) => x.id !== taskId);
    saveState(state);
}
