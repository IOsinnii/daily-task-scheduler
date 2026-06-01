/**
 * script.js - Main JavaScript file for Daily Task Scheduler
 * Handles all functionality including:
 * - Adding, editing, and deleting tasks
 * - Marking tasks as complete
 * - Filtering tasks by category and status
 * - Storing tasks in local storage for persistence
 * - Updating task statistics
 * - Theme switching (Yantra / Sage / Obsidian)
 * - Drag-and-drop task reordering (list view)
 * - Kanban board view with drag-and-drop between columns
 * - Priority levels and browser notification reminders
 */

// DOM Elements
const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDate');
const categorySelect = document.getElementById('category');
const prioritySelect = document.getElementById('priority');
const addTaskBtn = document.getElementById('addTask');
const taskList = document.getElementById('taskList');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const pendingTasksSpan = document.getElementById('pendingTasks');
const clearCompletedBtn = document.getElementById('clearCompleted');
const clearAllBtn = document.getElementById('clearAll');

// Task array to store all tasks
let tasks = [];

// Drag source ID shared by list and kanban drag-and-drop
let dragSrcId = null;

// Reminder timeouts keyed by task ID
const reminderTimeouts = {};

// Current view: 'list' or 'board'
let currentView = 'list';

// Initialize the application
function init() {
    loadTasks();

    // Restore saved theme
    const savedTheme = localStorage.getItem('theme') || 'theme-yantra';
    applyTheme(savedTheme);

    // Restore saved view
    const savedView = localStorage.getItem('view') || 'list';
    switchView(savedView);

    // Set today's date as the default due date
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.value = today;

    // Request notification permission and schedule reminders for existing tasks
    if ('Notification' in window) {
        Notification.requestPermission();
    }
    scheduleAllReminders();

    // Add event listeners
    addTaskBtn.addEventListener('click', addTask);
    taskList.addEventListener('click', handleTaskActions);
    filterCategory.addEventListener('change', filterTasks);
    filterStatus.addEventListener('change', filterTasks);
    clearCompletedBtn.addEventListener('click', clearCompleted);
    clearAllBtn.addEventListener('click', clearAll);

    // Theme switcher buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            applyTheme(theme);
            localStorage.setItem('theme', theme);
        });
    });

    // View toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
            localStorage.setItem('view', view);
            renderView();
        });
    });

    // Set up kanban column drop zones once (not recreated on each render)
    document.querySelectorAll('.kanban-column').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', (e) => {
            if (!column.contains(e.relatedTarget)) {
                column.classList.remove('drag-over');
            }
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            const newStatus = column.dataset.status;
            if (dragSrcId !== null) {
                const taskIndex = tasks.findIndex(t => t.id === dragSrcId);
                if (taskIndex !== -1 && tasks[taskIndex].status !== newStatus) {
                    tasks[taskIndex].status = newStatus;
                    tasks[taskIndex].completed = newStatus === 'completed';
                    saveTasks();
                    renderKanban();
                    updateTaskStats();
                }
            }
            dragSrcId = null;
        });
    });

    // Initial render of tasks
    renderView();
}

/**
 * Apply a theme class to the body and update active button state
 * @param {string} theme - Theme class name (e.g. 'theme-yantra')
 */
function applyTheme(theme) {
    document.body.className = theme;
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

/**
 * Switch between list and board views
 * @param {string} view - 'list' or 'board'
 */
function switchView(view) {
    currentView = view;

    const filterContainer = document.querySelector('.filter-container');
    const taskListContainer = document.querySelector('.task-list-container');
    const kanbanBoard = document.getElementById('kanbanBoard');

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    if (view === 'board') {
        filterContainer.style.display = 'none';
        taskListContainer.style.display = 'none';
        kanbanBoard.style.display = 'flex';
    } else {
        filterContainer.style.display = '';
        taskListContainer.style.display = '';
        kanbanBoard.style.display = 'none';
    }
}

/**
 * Render the current view (list or board) and update stats
 */
function renderView() {
    if (currentView === 'board') {
        renderKanban();
    } else {
        renderTasks(filterCategory.value, filterStatus.value);
    }
}

/**
 * Parse a YYYY-MM-DD date string as local midnight (avoids UTC-offset issues)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date}
 */
function parseDueDate(dateStr) {
    if (!dateStr) return new Date(NaN);
    // Strip any existing time/timezone component and re-parse as local midnight
    const datePart = dateStr.slice(0, 10);
    return new Date(datePart + 'T00:00:00');
}

/**
 * Add a new task to the tasks array
 */
function addTask() {
    const taskText = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const category = categorySelect.value;
    const priority = prioritySelect.value;

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: taskText,
        dueDate: dueDate,
        category: category,
        priority: priority,
        completed: false,
        status: 'pending',
        createdAt: new Date()
    };

    tasks.push(newTask);
    saveTasks();
    scheduleReminder(newTask);

    taskInput.value = '';
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.value = today;
    categorySelect.value = 'personal';
    prioritySelect.value = 'medium';

    renderView();
    taskInput.focus();
}

/**
 * Handle task actions (complete, delete) via event delegation
 * @param {Event} e - Click event
 */
function handleTaskActions(e) {
    const target = e.target;

    if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
        const taskItem = target.closest('.task-item');
        if (taskItem) {
            const taskId = parseInt(taskItem.dataset.id);
            deleteTask(taskId);
        }
    }

    if (target.classList.contains('task-checkbox')) {
        const taskId = parseInt(target.closest('.task-item').dataset.id);
        toggleTaskComplete(taskId);
    }
}

/**
 * Delete a task by ID
 * @param {number} id - Task ID to delete
 */
function deleteTask(id) {
    if (reminderTimeouts[id]) {
        clearTimeout(reminderTimeouts[id]);
        delete reminderTimeouts[id];
    }
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderView();
}

/**
 * Toggle task completion status
 * @param {number} id - Task ID to toggle
 */
function toggleTaskComplete(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            const completed = !task.completed;
            return { ...task, completed, status: completed ? 'completed' : 'pending' };
        }
        return task;
    });
    saveTasks();
    renderView();
}

/**
 * Filter tasks based on category and status filters
 */
function filterTasks() {
    renderTasks(filterCategory.value, filterStatus.value);
}

/**
 * Clear all completed tasks
 */
function clearCompleted() {
    tasks.filter(task => task.completed).forEach(task => {
        if (reminderTimeouts[task.id]) {
            clearTimeout(reminderTimeouts[task.id]);
            delete reminderTimeouts[task.id];
        }
    });
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderView();
}

/**
 * Clear all tasks
 */
function clearAll() {
    if (confirm('Are you sure you want to clear all tasks?')) {
        Object.keys(reminderTimeouts).forEach(id => {
            clearTimeout(reminderTimeouts[id]);
            delete reminderTimeouts[id];
        });
        tasks = [];
        saveTasks();
        renderView();
    }
}

/**
 * Render tasks to the DOM based on filters (List view)
 * @param {string} categoryFilter - Category to filter by
 * @param {string} statusFilter - Status to filter by
 */
function renderTasks(categoryFilter = 'all', statusFilter = 'all') {
    taskList.innerHTML = '';

    let filteredTasks = tasks;

    if (categoryFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
    }

    if (statusFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (statusFilter === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    }

    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.classList.add('task-item');
        taskItem.dataset.id = task.id;
        taskItem.setAttribute('draggable', 'true');

        if (task.completed) {
            taskItem.classList.add('completed');
        }

        const dueDate = parseDueDate(task.dueDate);
        const formattedDate = dueDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const isOverdue = !task.completed && new Date() > dueDate;
        const priority = task.priority || 'medium';
        const hasReminder = !!reminderTimeouts[task.id];

        taskItem.innerHTML = `
            <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">
                    ${task.text}
                    ${hasReminder ? '<span class="reminder-bell" title="Reminder set">🔔</span>' : ''}
                </div>
                <div class="task-details-display">
                    <span class="task-category category-${task.category}">${task.category}</span>
                    <span class="task-due-date ${isOverdue ? 'overdue' : ''}">${formattedDate}</span>
                    <span class="priority-badge priority-${priority}">${priority}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Drag-and-drop for list reordering
        taskItem.addEventListener('dragstart', (e) => {
            dragSrcId = task.id;
            taskItem.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        taskItem.addEventListener('dragend', () => {
            taskItem.classList.remove('dragging');
            document.querySelectorAll('.task-item').forEach(item => {
                item.classList.remove('drag-over');
            });
        });

        taskItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            taskItem.classList.add('drag-over');
        });

        taskItem.addEventListener('dragleave', () => {
            taskItem.classList.remove('drag-over');
        });

        taskItem.addEventListener('drop', (e) => {
            e.preventDefault();
            taskItem.classList.remove('drag-over');
            if (dragSrcId !== null && dragSrcId !== task.id) {
                const srcIndex = tasks.findIndex(t => t.id === dragSrcId);
                const destIndex = tasks.findIndex(t => t.id === task.id);
                if (srcIndex !== -1 && destIndex !== -1) {
                    const [removed] = tasks.splice(srcIndex, 1);
                    tasks.splice(destIndex, 0, removed);
                    saveTasks();
                    renderTasks(filterCategory.value, filterStatus.value);
                }
            }
            dragSrcId = null;
        });

        taskList.appendChild(taskItem);
    });

    updateTaskStats();
}

/**
 * Render the Kanban board view
 */
function renderKanban() {
    const columns = {
        'pending': document.getElementById('kanban-pending'),
        'in-progress': document.getElementById('kanban-in-progress'),
        'completed': document.getElementById('kanban-completed')
    };

    // Clear columns
    Object.values(columns).forEach(col => { col.innerHTML = ''; });

    tasks.forEach(task => {
        const status = task.status || 'pending';
        const col = columns[status];
        if (!col) return;

        const card = document.createElement('div');
        card.classList.add('kanban-card');
        card.dataset.id = task.id;
        card.setAttribute('draggable', 'true');

        const dueDate = parseDueDate(task.dueDate);
        const formattedDate = dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        const priority = task.priority || 'medium';
        const hasReminder = !!reminderTimeouts[task.id];

        card.innerHTML = `
            <div class="kanban-card-title">
                ${task.text}
                ${hasReminder ? '<span class="reminder-bell" title="Reminder set">🔔</span>' : ''}
            </div>
            <div class="kanban-card-meta">
                <span class="task-category category-${task.category}">${task.category}</span>
                <span class="task-due-date">${formattedDate}</span>
                <span class="priority-badge priority-${priority}">${priority}</span>
            </div>
            <button class="delete-btn kanban-delete-btn"><i class="fas fa-trash"></i></button>
        `;

        card.querySelector('.kanban-delete-btn').addEventListener('click', () => {
            deleteTask(task.id);
        });

        card.addEventListener('dragstart', (e) => {
            dragSrcId = task.id;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        col.appendChild(card);
    });

    updateTaskStats();
}

/**
 * Update task statistics
 */
function updateTaskStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    totalTasksSpan.textContent = totalTasks;
    completedTasksSpan.textContent = completedTasks;
    pendingTasksSpan.textContent = pendingTasks;
}

/**
 * Save tasks to local storage
 */
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

/**
 * Load tasks from local storage with migration for older task formats
 */
function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks).map(task => ({
            ...task,
            // Provide defaults only when values are absent or null
            priority: task.priority || 'medium',
            status: task.status || (task.completed ? 'completed' : 'pending')
        }));
    }
}

/**
 * Schedule a browser notification reminder for a task due within 7 days
 * @param {Object} task - Task object
 */
function scheduleReminder(task) {
    if (!task.dueDate || task.completed) return;
    if (!('Notification' in window)) return;

    const dueTime = parseDueDate(task.dueDate).getTime();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (dueTime > now && dueTime - now <= sevenDaysMs) {
        if (reminderTimeouts[task.id]) {
            clearTimeout(reminderTimeouts[task.id]);
        }
        reminderTimeouts[task.id] = setTimeout(() => {
            if (Notification.permission === 'granted') {
                new Notification('Task Due Today', { body: task.text });
            }
            delete reminderTimeouts[task.id];
            renderView();
        }, dueTime - now);
    }
}

/**
 * Schedule reminders for all non-completed tasks due within 7 days (called on page load)
 */
function scheduleAllReminders() {
    tasks.forEach(task => {
        if (!task.completed) {
            scheduleReminder(task);
        }
    });
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
