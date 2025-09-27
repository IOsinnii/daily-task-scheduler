/**
 * script.js - Main JavaScript file for Daily Task Scheduler
 * Handles all functionality including:
 * - Adding, editing, and deleting tasks
 * - Marking tasks as complete
 * - Filtering tasks by category and status
 * - Storing tasks in local storage for persistence
 * - Updating task statistics
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
    
    // Initial render of tasks
    renderTasks();
}

/**
 * Add a new task to the tasks array
 */
function addTask() {
    // Get input values
    const taskText = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const category = categorySelect.value;
    
    // Validate input
    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }
    
    // Create new task object
    const newTask = {
        id: Date.now(), // Use timestamp as unique ID
        text: taskText,
        dueDate: dueDate,
        category: category,
        completed: false,
        createdAt: new Date()
    };
    
    // Add task to array
    tasks.push(newTask);
    
    // Save to local storage
    saveTasks();
    
    // Clear input fields
    taskInput.value = '';
    
    // Reset due date to today
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.value = today;
    
    // Reset category to default
    categorySelect.value = 'personal';
    
    // Re-render task list
    renderTasks();
    
    // Focus on input field for next task
    taskInput.focus();
}

/**
 * Handle task actions (complete, delete)
 * @param {Event} e - Click event
 */
function handleTaskActions(e) {
    const target = e.target;
    
    // Check if delete button was clicked
    if (target.classList.contains('delete-btn')) {
        const taskId = parseInt(target.closest('.task-item').dataset.id);
        deleteTask(taskId);
    }
    
    // Check if checkbox was clicked
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
    // Filter out the task with the given ID
    tasks = tasks.filter(task => task.id !== id);
    
    // Save to local storage
    saveTasks();
    
    // Re-render task list
    renderTasks();
}

/**
 * Toggle task completion status
 * @param {number} id - Task ID to toggle
 */
function toggleTaskComplete(id) {
    // Find the task and toggle its completed status
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    // Save to local storage
    saveTasks();
    
    // Re-render task list
    renderTasks();
}

/**
 * Filter tasks based on category and status filters
 */
function filterTasks() {
    // Get filter values
    const categoryFilter = filterCategory.value;
    const statusFilter = filterStatus.value;
    
    // Apply filters and render
    renderTasks(categoryFilter, statusFilter);
}

/**
 * Clear all completed tasks
 */
function clearCompleted() {
    // Filter out completed tasks
    tasks = tasks.filter(task => !task.completed);
    
    // Save to local storage
    saveTasks();
    
    // Re-render task list
    renderTasks();
}

/**
 * Clear all tasks
 */
function clearAll() {
    // Confirm before clearing all tasks
    if (confirm('Are you sure you want to clear all tasks?')) {
        // Empty tasks array
        tasks = [];
        
        // Save to local storage
        saveTasks();
        
        // Re-render task list
        renderTasks();
    }
}

/**
 * Render tasks to the DOM based on filters
 * @param {string} categoryFilter - Category to filter by
 * @param {string} statusFilter - Status to filter by
 */
function renderTasks(categoryFilter = 'all', statusFilter = 'all') {
    // Clear current task list
    taskList.innerHTML = '';
    
    // Filter tasks based on category and status
    let filteredTasks = tasks;
    
    // Apply category filter
    if (categoryFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
    }
    
    // Apply status filter
    if (statusFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (statusFilter === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    }
    
    // Sort tasks by due date (closest first)
    filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Create task elements
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.classList.add('task-item');
        taskItem.dataset.id = task.id;
        
        // Add completed class if task is completed
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        
        // Format due date for display
        const dueDate = new Date(task.dueDate);
        const formattedDate = dueDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Check if task is overdue
        const isOverdue = !task.completed && new Date() > dueDate;
        
        // Create task HTML
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
        
        // Add to task list
        taskList.appendChild(taskItem);
    });
    
    // Update task statistics
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
