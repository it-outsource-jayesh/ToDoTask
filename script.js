$(document).ready(function() {
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // DOM Elements
    const $taskInput = $('#taskInput');
    const $addTaskBtn = $('#addTaskBtn');
    const $taskList = $('#taskList');
    const $emptyState = $('#emptyState');

    // Initialize
    renderTasks();

    // Event Listeners
    $addTaskBtn.on('click', addTask);
    
    $taskInput.on('keypress', function(e) {
        if (e.which === 13) {
            addTask();
        }
    });

    // Dynamic Event Listeners for Task Items
    $taskList.on('click', '.checkbox, .task-text', toggleTask);
    $taskList.on('click', '.btn-delete', deleteTask);
    $taskList.on('click', '.btn-edit', enableEditMode);
    
    // Edit Mode Events
    $taskList.on('blur', '.edit-input', saveEdit);
    $taskList.on('keypress', '.edit-input', function(e) {
        if (e.which === 13) {
            $(this).blur();
        }
    });

    // Functions
    function addTask() {
        const text = $taskInput.val().trim();
        if (text === '') return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };

        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        $taskInput.val('');
        $taskInput.focus();
    }

    function toggleTask(e) {
        // Prevent toggling when clicking on edit input
        if ($(e.target).hasClass('edit-input')) return;

        const $item = $(this).closest('.task-item');
        const id = $item.data('id');
        
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
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
            renderTasks();
        }, 300);
    }

    function enableEditMode(e) {
        e.stopPropagation();
        const $item = $(this).closest('.task-item');
        const id = $item.data('id');
        const task = tasks.find(t => t.id === id);
        
        if (task.completed) return; // Don't edit completed tasks

        const $textSpan = $item.find('.task-text');
        const currentText = task.text;

        $item.addClass('edit-mode');
        $textSpan.html(`<input type="text" class="edit-input" value="${currentText}">`);
        
        const $input = $item.find('.edit-input');
        $input.focus();
        
        // Move cursor to end
        const val = $input.val();
        $input.val('').val(val);
    }

    function saveEdit() {
        const $input = $(this);
        const $item = $input.closest('.task-item');
        const id = $item.data('id');
        const newText = $input.val().trim();

        if (newText === '') {
            // If empty, revert or delete? Let's revert to original if empty
            renderTasks();
            return;
        }

        const task = tasks.find(t => t.id === id);
        if (task) {
            task.text = newText;
            saveTasks();
        }
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        $taskList.empty();

        if (tasks.length === 0) {
            $emptyState.show();
        } else {
            $emptyState.hide();
            
            tasks.forEach(task => {
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
                $taskList.append(html);
            });
        }
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
