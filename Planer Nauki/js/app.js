import {
    loadState,
    setTheme,
    addSubject,
    selectSubject,
    addTask,
    toggleTaskDone,
    deleteTask,
    setSemesterSettings,
    setView,
} from './store.js';

import {
    priorityWeight,
    todayISO,
    daysFromNowISO,
    daysBetween,
} from './utils.js';

import './components/task-card.js';
import './components/quote-box.js';

import { initEscape } from './escape.js';

import { renderGallery } from './gallery.js';

const state = loadState();

// elementy
const themeToggle = document.getElementById('themeToggle');
const subjectForm = document.getElementById('subjectForm');
const subjectName = document.getElementById('subjectName');
const subjectsList = document.getElementById('subjectsList');

const currentSubjectTitle = document.getElementById('currentSubjectTitle');
const currentSubjectMeta = document.getElementById('currentSubjectMeta');

const openTaskModal = document.getElementById('openTaskModal');
const taskModal = document.getElementById('taskModal');
const closeTaskModal = document.getElementById('closeTaskModal');
const cancelTask = document.getElementById('cancelTask');

const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const taskDueDate = document.getElementById('taskDueDate');
const taskPriority = document.getElementById('taskPriority');
const taskType = document.getElementById('taskType');

const filterSelect = document.getElementById('filterSelect');
const sortSelect = document.getElementById('sortSelect');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');

const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

const sessionCountdown = document.getElementById('sessionCountdown');
const semesterProgressBar = document.getElementById('semesterProgressBar');
const semesterProgressText = document.getElementById('semesterProgressText');

const semesterStart = document.getElementById('semesterStart');
const semesterEnd = document.getElementById('semesterEnd');
const sessionDate = document.getElementById('sessionDate');

const tabGallery = document.getElementById('tabGallery');
const plannerView = document.getElementById('plannerView');
const escapeView = document.getElementById('escapeView');
const galleryView = document.getElementById('galleryView');

applyTheme(state.theme);

themeToggle?.addEventListener('click', () => {
    const next =
        document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(state, next);
});

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle?.setAttribute(
        'aria-pressed',
        theme === 'dark' ? 'true' : 'false'
    );
}

function galleryReady() {
    return Boolean(galleryView && document.getElementById('galleryGrid'));
}

function showOnlyGallery() {
    if (plannerView) plannerView.hidden = true;
    if (escapeView) escapeView.hidden = true;
    if (galleryView) galleryView.hidden = false;

    document.getElementById('tabPlanner')?.classList.remove('tab--active');
    document.getElementById('tabEscape')?.classList.remove('tab--active');

    tabGallery?.classList.add('tab--active');
}

function hideGallery() {
    if (galleryView) galleryView.hidden = true;
    tabGallery?.classList.remove('tab--active');
}

tabGallery?.addEventListener('click', () => {
    if (state.view === 'gallery') {
        setView(state, 'planner');
        hideGallery();

        if (plannerView) plannerView.hidden = false;
        if (escapeView) escapeView.hidden = true;
        return;
    }

    setView(state, 'gallery');
    showOnlyGallery();

    if (galleryReady()) renderGallery();
});

document.getElementById('tabPlanner')?.addEventListener('click', () => {
    if (state.view === 'gallery') hideGallery();
});
document.getElementById('tabEscape')?.addEventListener('click', () => {
    if (state.view === 'gallery') hideGallery();
});

// subjects
subjectForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = subjectName.value.trim();
    if (!name) return;
    addSubject(state, name);
    subjectName.value = '';
    render();
});

subjectsList?.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    selectSubject(state, li.dataset.id);
    render();
});

// modal
openTaskModal?.addEventListener('click', () => taskModal.showModal());
closeTaskModal?.addEventListener('click', () => taskModal.close());
cancelTask?.addEventListener('click', () => taskModal.close());

// taski
taskForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.selectedSubjectId) return;

    const task = {
        id: crypto.randomUUID(),
        subjectId: state.selectedSubjectId,
        title: taskTitle.value.trim(),
        dueDate: taskDueDate.value || null,
        priority: taskPriority.value,
        type: taskType.value,
        done: false,
        createdAt: Date.now(),
    };

    addTask(state, task);
    taskModal.close();
    taskForm.reset();
    render({ animateNewTaskId: task.id });
});

// Zdarzenia z Web Componentów
tasksList?.addEventListener('toggleDone', (e) => {
    toggleTaskDone(state, e.detail.id);
    render();
});

tasksList?.addEventListener('delete', (e) => {
    deleteTask(state, e.detail.id);
    render();
});

// filter/sort
filterSelect?.addEventListener('change', () => render());
sortSelect?.addEventListener('change', () => render());

// semestr sett
function wireSemesterInputs() {
    if (!semesterStart || !semesterEnd || !sessionDate) return;

    // wczytaj z state do inputów
    if (state.semester?.start) semesterStart.value = state.semester.start;
    if (state.semester?.end) semesterEnd.value = state.semester.end;
    if (state.semester?.sessionDate)
        sessionDate.value = state.semester.sessionDate;

    const onChange = () => {
        setSemesterSettings(state, {
            start: semesterStart.value || null,
            end: semesterEnd.value || null,
            sessionDate: sessionDate.value || null,
        });
        renderSemester();
    };

    semesterStart.addEventListener('change', onChange);
    semesterEnd.addEventListener('change', onChange);
    sessionDate.addEventListener('change', onChange);
}

wireSemesterInputs();

try {
    initEscape?.(state);
} catch {}

if (state.view === 'gallery' && galleryReady()) {
    showOnlyGallery();
    renderGallery();
} else if (state.view === 'gallery' && !galleryReady()) {
    setView(state, 'planner');
}

// render
render();

function render({ animateNewTaskId = null } = {}) {
    renderSubjects();
    renderHeader();
    renderTasks(animateNewTaskId);
    renderProgress();
    renderSemester();
}

function renderSubjects() {
    if (!subjectsList) return;
    subjectsList.innerHTML = '';

    for (const s of state.subjects) {
        const li = document.createElement('li');
        li.className =
            'subject-chip' +
            (s.id === state.selectedSubjectId ? ' subject-chip--active' : '');
        li.dataset.id = s.id;
        li.textContent = s.name;
        subjectsList.appendChild(li);
    }
}

function renderHeader() {
    if (!currentSubjectTitle || !currentSubjectMeta || !openTaskModal) return;

    const subject = state.subjects.find(
        (s) => s.id === state.selectedSubjectId
    );

    if (!subject) {
        currentSubjectTitle.textContent = 'Wybierz przedmiot';
        currentSubjectMeta.textContent = 'Dodaj przedmiot po lewej.';
        openTaskModal.disabled = true;
        return;
    }

    currentSubjectTitle.textContent = subject.name;
    const count = state.tasks.filter((t) => t.subjectId === subject.id).length;
    currentSubjectMeta.textContent = `Zadań w tym przedmiocie: ${count}`;
    openTaskModal.disabled = false;
}

function getVisibleTasks() {
    const subjectId = state.selectedSubjectId;
    if (!subjectId) return [];

    let list = state.tasks.filter((t) => t.subjectId === subjectId);

    const today = todayISO();
    const in7 = daysFromNowISO(7);

    switch (filterSelect?.value) {
        case 'today':
            list = list.filter((t) => t.dueDate === today && !t.done);
            break;
        case 'week':
            list = list.filter(
                (t) =>
                    t.dueDate &&
                    t.dueDate >= today &&
                    t.dueDate <= in7 &&
                    !t.done
            );
            break;
        case 'overdue':
            list = list.filter(
                (t) => t.dueDate && t.dueDate < today && !t.done
            );
            break;
        case 'done':
            list = list.filter((t) => t.done);
            break;
        default:
            break;
    }

    const sort = sortSelect?.value ?? 'dueDateAsc';
    list = [...list].sort((a, b) => {
        if (sort === 'dueDateAsc')
            return (a.dueDate ?? '9999-99-99').localeCompare(
                b.dueDate ?? '9999-99-99'
            );
        if (sort === 'dueDateDesc')
            return (b.dueDate ?? '0000-00-00').localeCompare(
                a.dueDate ?? '0000-00-00'
            );
        if (sort === 'priorityDesc')
            return priorityWeight(b.priority) - priorityWeight(a.priority);
        if (sort === 'createdDesc') return b.createdAt - a.createdAt;
        return 0;
    });

    return list;
}

function renderTasks(animateNewTaskId) {
    if (!tasksList || !emptyState) return;

    const list = getVisibleTasks();
    tasksList.innerHTML = '';

    if (!state.selectedSubjectId) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = list.length ? 'none' : 'block';

    for (const t of list) {
        const li = document.createElement('li');
        if (animateNewTaskId && t.id === animateNewTaskId)
            li.classList.add('task-enter');

        const el = document.createElement('task-card');
        el.dataset.id = t.id;
        el.setAttribute('title', t.title);
        el.setAttribute('priority', t.priority);
        el.setAttribute('type', t.type);
        el.setAttribute('done', String(t.done));
        if (t.dueDate) el.setAttribute('duedate', t.dueDate);

        li.appendChild(el);
        tasksList.appendChild(li);
    }
}

function renderProgress() {
    if (!progressBar || !progressText) return;

    const subjectId = state.selectedSubjectId;
    if (!subjectId) {
        progressBar.style.width = '0%';
        progressText.textContent = '0% (0/0)';
        return;
    }

    const all = state.tasks.filter((t) => t.subjectId === subjectId);
    const done = all.filter((t) => t.done).length;
    const total = all.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${pct}% (${done}/${total})`;
}

function renderSemester() {
    if (!sessionCountdown || !semesterProgressBar || !semesterProgressText)
        return;

    const today = todayISO();
    const { start, end, sessionDate } = state.semester ?? {};

    // dni do sesji
    if (!sessionDate) {
        sessionCountdown.textContent = '—';
    } else {
        const d = daysBetween(today, sessionDate);
        sessionCountdown.textContent =
            d >= 0 ? `${d} dni` : `minęło ${Math.abs(d)} dni`;
    }

    // progres semestru
    if (!start || !end) {
        semesterProgressBar.style.width = '0%';
        semesterProgressText.textContent = '0%';
        return;
    }

    const total = Math.max(1, daysBetween(start, end));
    const passed = daysBetween(start, today);
    const pct = Math.max(0, Math.min(100, Math.round((passed / total) * 100)));

    semesterProgressBar.style.width = `${pct}%`;
    semesterProgressText.textContent = `${pct}%`;
}
