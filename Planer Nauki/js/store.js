const STORAGE_KEY = 'smart-study-planner:v1';

function pad2(n) {
    return String(n).padStart(2, '0');
}

function toISODate(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function defaultSemesterConfig() {
    const now = new Date();
    const startYear =
        now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const start = new Date(startYear, 9, 1); // 1 października
    const session = new Date(startYear + 1, 0, 20); // 20 stycznia
    const end = new Date(startYear + 1, 1, 15); // 15 lutego

    return {
        semesterStart: toISODate(start),
        semesterEnd: toISODate(end),
        sessionDate: toISODate(session),
    };
}

const defaultState = {
    theme: 'light',
    selectedSubjectId: null,
    subjects: [],
    tasks: [],
    ...defaultSemesterConfig(),
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

export function setSemesterConfig(state, patch) {
    state.semesterStart = patch.semesterStart ?? state.semesterStart;
    state.semesterEnd = patch.semesterEnd ?? state.semesterEnd;
    state.sessionDate = patch.sessionDate ?? state.sessionDate;
    saveState(state);
}
