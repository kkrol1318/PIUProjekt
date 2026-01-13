import {
    loadState,
    setTheme,
    addSubject,
    selectSubject,
    addTask,
    toggleTaskDone,
    deleteTask,
} from './store.js';
import { priorityWeight } from './utils.js';
import './components/task-card.js';
import './components/quote-box.js';

const state = loadState();

// ELEMENTY
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

// THEME
applyTheme(state.theme);

themeToggle.addEventListener('click', () => {
    const next =
        document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(state, next);
});

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute(
        'aria-pressed',
        theme === 'dark' ? 'true' : 'false'
    );
}

// SUBJECTS
subjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = subjectName.value.trim();
    if (!name) return;
    addSubject(state, name);
    subjectName.value = '';
    render();
});

subjectsList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    selectSubject(state, li.dataset.id);
    render();
});

// MODAL
openTaskModal.addEventListener('click', () => taskModal.showModal());
closeTaskModal.addEventListener('click', () => taskModal.close());
cancelTask.addEventListener('click', () => taskModal.close());

// TASKS
taskForm.addEventListener('submit', (e) => {
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

// Zdarzenia z Web Componentów (CustomEvent)
tasksList.addEventListener('toggleDone', (e) => {
    toggleTaskDone(state, e.detail.id);
    render();
});

tasksList.addEventListener('delete', (e) => {
    deleteTask(state, e.detail.id);
    render();
});

// FILTER/SORT
filterSelect.addEventListener('change', () => render());
sortSelect.addEventListener('change', () => render());

// RENDER
render();

function render({ animateNewTaskId = null } = {}) {
    renderSubjects();
    renderHeader();
    renderTasks(animateNewTaskId);
    renderProgress();
}

function renderSubjects() {
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

    // filtr
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    const in7ISO = in7.toISOString().slice(0, 10);

    switch (filterSelect.value) {
        case 'today':
            list = list.filter((t) => t.dueDate === todayISO && !t.done);
            break;
        case 'week':
            list = list.filter(
                (t) =>
                    t.dueDate &&
                    t.dueDate >= todayISO &&
                    t.dueDate <= in7ISO &&
                    !t.done
            );
            break;
        case 'overdue':
            list = list.filter(
                (t) => t.dueDate && t.dueDate < todayISO && !t.done
            );
            break;
        case 'done':
            list = list.filter((t) => t.done);
            break;
        default:
            break;
    }

    // sort
    const sort = sortSelect.value;
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
