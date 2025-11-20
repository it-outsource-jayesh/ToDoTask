$(document).ready(function () {
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentView = 'all';
    let dateFilter = null;
    let editingTaskId = null;

    // DOM Elements
    const $addTaskBtn = $('#addTaskBtn');
    const $taskListContainer = $('#taskList');
    const $emptyState = $('#emptyState');
    const $navItems = $('.nav-item');
    const $pageTitle = $('#pageTitle');
    const $currentDate = $('#currentDate');
    const $dateFilter = $('#dateFilter');
    const $clearFilterBtn = $('#clearFilterBtn');

    // Stats Elements
    const $todayPending = $('#todayPending');
    const $todayCompleted = $('#todayCompleted');
    const $totalPending = $('#totalPending');
    const $totalCompleted = $('#totalCompleted');

    // Modal Elements
    const $modal = $('#taskModal');
    const $modalTitle = $('#modalTitle');
    const $modalTaskInput = $('#modalTaskInput');
    const $modalTaskDescription = $('#modalTaskDescription');
    const $modalTaskDate = $('#modalTaskDate');
    const $saveTask = $('#saveTask');
    const $cancelModal = $('#cancelModal');
    const $closeModal = $('#closeModal');

    // Initialize
    updateDateDisplay();
    updateStats();
    toggleViewDisplay();
    renderTasks();

    // Event Listeners
    $addTaskBtn.on('click', openAddModal);
    $saveTask.on('click', saveTask);
    $cancelModal.on('click', closeModal);
    $closeModal.on('click', closeModal);

    // Close modal on outside click
    $modal.on('click', function (e) {
        if ($(e.target).is($modal)) {
            closeModal();
        }
    });

    // Navigation / View Switching
    $navItems.on('click', function () {
        $navItems.removeClass('active');
        $(this).addClass('active');

        currentView = $(this).data('view');
        updatePageTitle();
        toggleViewDisplay();
        renderTasks();
    });

    // Date Filter Events
    $dateFilter.on('change', function () {
        dateFilter = $(this).val();
        if (dateFilter) {
            $clearFilterBtn.show();
        } else {
            $clearFilterBtn.hide();
        }
        renderTasks();
    });

    $clearFilterBtn.on('click', function () {
        dateFilter = null;
        $dateFilter.val('');
        $clearFilterBtn.hide();
        renderTasks();
    });

    // Stat card click handlers
    $('#statsSection').on('click', '.stat-card', function () {
        const statType = $(this).data('stat');

        // Switch to appropriate view
        $navItems.removeClass('active');
        if (statType === 'today-pending' || statType === 'total-pending') {
            currentView = 'active';
            $navItems.filter('[data-view="active"]').addClass('active');
        } else if (statType === 'today-completed' || statType === 'total-completed') {
            currentView = 'completed';
            $navItems.filter('[data-view="completed"]').addClass('active');
        }

        updatePageTitle();
        toggleViewDisplay();
        renderTasks();
    });

    // Dynamic Event Listeners for Task Items
    $taskListContainer.on('click', '.checkbox, .task-text', toggleTask);
    $taskListContainer.on('click', '.btn-delete', deleteTask);
    $taskListContainer.on('click', '.btn-edit', openEditModal);

    // Functions
    function updateDateDisplay() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        $currentDate.text(new Date().toLocaleDateString('en-US', options));
    }

    function updatePageTitle() {
        const titles = {
            'all': 'Dashboard',
            'active': 'My Tasks',
            'completed': 'Completed Tasks'
        };
        $pageTitle.text(titles[currentView]);
    }

    function toggleViewDisplay() {
        if (currentView === 'all') {
            // Dashboard: Show only stats
            $('#statsSection').show();
            $('.content-area').hide();
        } else {
            // Other views: Show only tasks
            $('#statsSection').hide();
            $('.content-area').show();
        }
    }

    function updateStats() {
        const today = new Date().toISOString().split('T')[0];

        const todayTasks = tasks.filter(t => t.date === today);
        const todayPendingCount = todayTasks.filter(t => !t.completed).length;
        const todayCompletedCount = todayTasks.filter(t => t.completed).length;

        const totalPendingCount = tasks.filter(t => !t.completed).length;
        const totalCompletedCount = tasks.filter(t => t.completed).length;

        $todayPending.text(todayPendingCount);
        $todayCompleted.text(todayCompletedCount);
        $totalPending.text(totalPendingCount);
        $totalCompleted.text(totalCompletedCount);
    }

    function openAddModal() {
        editingTaskId = null;
        $modalTitle.text('Add New Task');
        $modalTaskInput.val('');
        $modalTaskDescription.val('');
        $modalTaskDate.val(new Date().toISOString().split('T')[0]);
        $modal.addClass('active');
        $modalTaskInput.focus();
    }

    function openEditModal(e) {
        e.stopPropagation();
        const $item = $(this).closest('.task-item');
        const id = $item.data('id');
        const task = tasks.find(t => t.id === id);

        if (task.completed) return;

        editingTaskId = id;
        $modalTitle.text('Edit Task');
        $modalTaskInput.val(task.text);
        $modalTaskDescription.val(task.description || '');
        $modalTaskDate.val(task.date);
        $modal.addClass('active');
        $modalTaskInput.focus();
    }

    function closeModal() {
        $modal.removeClass('active');
        editingTaskId = null;
    }

    function saveTask() {
        const text = $modalTaskInput.val().trim();
        const description = $modalTaskDescription.val().trim();
        const date = $modalTaskDate.val();

        if (text === '') {
            $modalTaskInput.focus();
            return;
        }

        if (editingTaskId) {
            // Edit existing task
            const task = tasks.find(t => t.id === editingTaskId);
            if (task) {
                task.text = text;
                task.description = description;
                task.date = date || new Date().toISOString().split('T')[0];
            }
        } else {
            // Add new task
            const newTask = {
                id: Date.now(),
                text: text,
                description: description,
                date: date || new Date().toISOString().split('T')[0],
                completed: false
            };
            tasks.unshift(newTask);
        }

        saveTasks();
        updateStats();
        renderTasks();
        closeModal();
    }

    function toggleTask(e) {
        const $item = $(this).closest('.task-item');
        const id = $item.data('id');

        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            updateStats();
            renderTasks();
        }
    }

    function deleteTask(e) {
        e.stopPropagation();
        const $item = $(this).closest('.task-item');
        const id = $item.data('id');

        $item.css('animation', 'slideIn 0.3s reverse forwards');

        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            updateStats();
            renderTasks();
        }, 300);
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function getFilteredTasks() {
        let filtered = tasks;

        if (currentView === 'active') {
            filtered = filtered.filter(t => !t.completed);
        } else if (currentView === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }

        if (dateFilter) {
            filtered = filtered.filter(t => t.date === dateFilter);
        }

        return filtered;
    }

    function groupTasksByDate(taskList) {
        const groups = {};

        taskList.sort((a, b) => new Date(a.date) - new Date(b.date));

        taskList.forEach(task => {
            const dateKey = task.date;
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(task);
        });

        return groups;
    }

    function formatDateHeader(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dString = dateString;
        const tString = today.toISOString().split('T')[0];
        const tomString = tomorrow.toISOString().split('T')[0];

        if (dString === tString) return 'Today';
        if (dString === tomString) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    function renderTasks() {
        $taskListContainer.empty();
        const filteredTasks = getFilteredTasks();

        if (filteredTasks.length === 0) {
            $emptyState.show();
            return;
        }

        $emptyState.hide();
        const groupedTasks = groupTasksByDate(filteredTasks);

        const sortedDates = Object.keys(groupedTasks).sort();

        sortedDates.forEach(date => {
            const dateHeader = formatDateHeader(date);
            const tasksForDate = groupedTasks[date];

            const $group = $(`
                <div class="date-group">
                    <div class="date-header">${dateHeader}</div>
                    <ul class="task-list"></ul>
                </div>
            `);

            const $ul = $group.find('ul');

            tasksForDate.forEach(task => {
                const completedClass = task.completed ? 'completed' : '';
                const descriptionHtml = task.description ?
                    `<div class="task-description">${escapeHtml(task.description)}</div>` : '';

                const html = `
                    <li class="task-item ${completedClass}" data-id="${task.id}">
                        <div class="task-content">
                            <div class="checkbox">
                                <i class="fa-solid fa-check"></i>
                            </div>
                            <div class="task-details">
                                <div class="task-text">${escapeHtml(task.text)}</div>
                                ${descriptionHtml}
                            </div>
                        </div>
                        <div class="actions">
                            <button class="btn-icon btn-edit" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn-icon btn-delete" title="Delete">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </li>
                `;
                $ul.append(html);
            });

            $taskListContainer.append($group);
        });
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
