$(document).ready(function () {
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentView = 'all'; // 'all', 'active', 'completed'
    let dateFilter = null;

    // DOM Elements
    const $taskInput = $('#taskInput');
    const $taskDate = $('#taskDate');
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

    // Initialize
    updateDateDisplay();
    updateStats();
    renderTasks();

    // Event Listeners
    $addTaskBtn.on('click', addTask);

    $taskInput.on('keypress', function (e) {
        if (e.which === 13) {
            addTask();
        }
    });

    // Navigation / View Switching
    $navItems.on('click', function () {
        $navItems.removeClass('active');
        $(this).addClass('active');

        currentView = $(this).data('view');
        updatePageTitle();
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

    // Dynamic Event Listeners for Task Items
    $taskListContainer.on('click', '.checkbox, .task-text', toggleTask);
    $taskListContainer.on('click', '.btn-delete', deleteTask);
    $taskListContainer.on('click', '.btn-edit', enableEditMode);

    // Edit Mode Events
    $taskListContainer.on('blur', '.edit-input', saveEdit);
    $taskListContainer.on('keypress', '.edit-input', function (e) {
        if (e.which === 13) {
            $(this).blur();
        }
    });

    // Functions
    function updateDateDisplay() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        $currentDate.text(new Date().toLocaleDateString('en-US', options));

        // Set default date input to today
        const today = new Date().toISOString().split('T')[0];
        $taskDate.val(today);
    }

    function updatePageTitle() {
        const titles = {
            'all': 'Dashboard',
            'active': 'My Tasks',
            'completed': 'Completed Tasks'
        };
        $pageTitle.text(titles[currentView]);
    }

    function updateStats() {
        const today = new Date().toISOString().split('T')[0];

        // Today's stats
        const todayTasks = tasks.filter(t => t.date === today);
        const todayPendingCount = todayTasks.filter(t => !t.completed).length;
        const todayCompletedCount = todayTasks.filter(t => t.completed).length;

        // Total stats
        const totalPendingCount = tasks.filter(t => !t.completed).length;
        const totalCompletedCount = tasks.filter(t => t.completed).length;

        // Update DOM
        $todayPending.text(todayPendingCount);
        $todayCompleted.text(todayCompletedCount);
        $totalPending.text(totalPendingCount);
        $totalCompleted.text(totalCompletedCount);
    }

    function addTask() {
        const text = $taskInput.val().trim();
        const date = $taskDate.val();

        if (text === '') return;

        const newTask = {
            id: Date.now(),
            text: text,
            date: date || new Date().toISOString().split('T')[0],
            completed: false
        };

        tasks.unshift(newTask);
        saveTasks();
        updateStats();
        renderTasks();

        $taskInput.val('');
        $taskInput.focus();
    }

    function toggleTask(e) {
        if ($(e.target).hasClass('edit-input')) return;

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

    function enableEditMode(e) {
        e.stopPropagation();
        const $item = $(this).closest('.task-item');
        const id = $item.data('id');
        const task = tasks.find(t => t.id === id);

        if (task.completed) return;

        const $textSpan = $item.find('.task-text');
        const currentText = task.text;

        $item.addClass('edit-mode');
        $textSpan.html(`<input type="text" class="edit-input" value="${currentText}">`);

        const $input = $item.find('.edit-input');
        $input.focus();

        const val = $input.val();
        $input.val('').val(val);
    }

    function saveEdit() {
        const $input = $(this);
        const $item = $input.closest('.task-item');
        const id = $item.data('id');
        const newText = $input.val().trim();

        if (newText === '') {
            renderTasks();
            return;
        }

        const task = tasks.find(t => t.id === id);
        if (task) {
            task.text = newText;
            saveTasks();
            updateStats();
        }
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function getFilteredTasks() {
        let filtered = tasks;

        // Filter by View
        if (currentView === 'active') {
            filtered = filtered.filter(t => !t.completed);
        } else if (currentView === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }

        // Filter by Date
        if (dateFilter) {
            filtered = filtered.filter(t => t.date === dateFilter);
        }

        return filtered;
    }

    function groupTasksByDate(taskList) {
        const groups = {};

        // Sort tasks by date
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

        // Sort dates (keys)
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
                const html = `
                    <li class="task-item ${completedClass}" data-id="${task.id}">
                        <div class="task-content">
                            <div class="checkbox">
                                <i class="fa-solid fa-check"></i>
                            </div>
                            <span class="task-text">${escapeHtml(task.text)}</span>
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
