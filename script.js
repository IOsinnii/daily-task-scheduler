/**
 * script.js - Main JavaScript file for Daily Task Scheduler
 * Handles all functionality including:
 * - Adding, editing, and deleting tasks
 * - Marking tasks as complete
 * - Filtering tasks by category and status
 * - Storing tasks in local storage for persistence
 * - Updating task statistics
 * - Theme switching (Yantra / Sage)
 */

// DOM Elements
const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDate');
const categorySelect = document.getElementById('category');
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

// Initialize the application
function init() {
    // Load tasks from local storage
    loadTasks();

    // Restore saved theme
    const savedTheme = localStorage.getItem('theme') || 'theme-yantra';
    applyTheme(savedTheme);

    // Set today's date as the default due date
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.value = today;

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

    // Initial render of tasks
    renderTasks();
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
 * Add a new task to the tasks array
 */
function addTask() {
    const taskText = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const category = categorySelect.value;

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: taskText,
        dueDate: dueDate,
        category: category,
        completed: false,
        createdAt: new Date()
    };

    tasks.push(newTask);
    saveTasks();

    taskInput.value = '';
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.value = today;
    categorySelect.value = 'personal';

    renderTasks();
    taskInput.focus();
}

/**
 * Handle task actions (complete, delete)
 * @param {Event} e - Click event
 */
function handleTaskActions(e) {
    const target = e.target;

    if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
        const taskId = parseInt(target.closest('.task-item').dataset.id);
        deleteTask(taskId);
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
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

/**
 * Toggle task completion status
 * @param {number} id - Task ID to toggle
 */
function toggleTaskComplete(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

/**
 * Filter tasks based on category and status filters
 */
function filterTasks() {
    const categoryFilter = filterCategory.value;
    const statusFilter = filterStatus.value;
    renderTasks(categoryFilter, statusFilter);
}

/**
 * Clear all completed tasks
 */
function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

/**
 * Clear all tasks
 */
function clearAll() {
    if (confirm('Are you sure you want to clear all tasks?')) {
        tasks = [];
        saveTasks();
        renderTasks();
    }
}

/**
 * Render tasks to the DOM based on filters
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

    filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.classList.add('task-item');
        taskItem.dataset.id = task.id;

        if (task.completed) {
            taskItem.classList.add('completed');
        }

        const dueDate = new Date(task.dueDate);
        const formattedDate = dueDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const isOverdue = !task.completed && new Date() > dueDate;

        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${task.text}</div>
                <div class="task-details-display">
                    <span class="task-category category-${task.category}">${task.category}</span>
                    <span class="task-due-date ${isOverdue ? 'overdue' : ''}">${formattedDate}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;

        taskList.appendChild(taskItem);
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
 * Load tasks from local storage
 */
function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
