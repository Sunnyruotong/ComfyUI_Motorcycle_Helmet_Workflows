class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.storageKey = 'todoAppData';
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        const todoInput = document.getElementById('todoInput');
        const addBtn = document.getElementById('addBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const fileInput = document.getElementById('fileInput');

        addBtn.addEventListener('click', () => this.addTodo());
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
        });

        clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        exportBtn.addEventListener('click', () => this.exportData());
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.importData(e));
    }

    addTodo() {
        const todoInput = document.getElementById('todoInput');
        const text = todoInput.value.trim();

        if (text === '') {
            alert('请输入待办事项！');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toLocaleString('zh-CN'),
            priority: 'medium'
        };

        this.todos.push(todo);
        todoInput.value = '';
        todoInput.focus();
        this.saveToLocalStorage();
        this.render();
    }

    deleteTodo(id) {
        if (confirm('确定要删除这个任务吗？')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveToLocalStorage();
            this.render();
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToLocalStorage();
            this.render();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            alert('没有已完成的任务！');
            return;
        }
        if (confirm(`确定要清空 ${completedCount} 个已完成的任务吗？`)) {
            this.todos = this.todos.filter(todo => !todo.completed);
            this.saveToLocalStorage();
            this.render();
        }
    }

    updateStats() {
        const totalCount = this.todos.length;
        const activeCount = this.todos.filter(t => !t.completed).length;
        const completedCount = this.todos.filter(t => t.completed).length;

        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('activeCount').textContent = activeCount;
        document.getElementById('completedCount').textContent = completedCount;
    }

    render() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos();

        todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            emptyState.classList.add('show');
        } else {
            emptyState.classList.remove('show');
            filteredTodos.forEach(todo => {
                const li = document.createElement('li');
                li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'todo-checkbox';
                checkbox.checked = todo.completed;
                checkbox.addEventListener('change', () => this.toggleTodo(todo.id));

                const textContainer = document.createElement('div');
                textContainer.style.flex = '1';

                const text = document.createElement('span');
                text.className = 'todo-text';
                text.textContent = todo.text;

                const date = document.createElement('div');
                date.className = 'todo-date';
                date.textContent = `创建于: ${todo.createdAt}`;

                textContainer.appendChild(text);
                textContainer.appendChild(date);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = '删除';
                deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

                li.appendChild(checkbox);
                li.appendChild(textContainer);
                li.appendChild(deleteBtn);

                todoList.appendChild(li);
            });
        }

        this.updateStats();
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
            console.log('✅ 数据已保存到本地存储');
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，本地存储可能已满！');
        }
    }

    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.todos = JSON.parse(data);
                console.log(`✅ 从本地存储加载了 ${this.todos.length} 个任务`);
            }
        } catch (error) {
            console.error('加载失败:', error);
            this.todos = [];
        }
    }

    exportData() {
        if (this.todos.length === 0) {
            alert('没有任务可以导出！');
            return;
        }

        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        console.log('✅ 任务已导出');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTodos = JSON.parse(e.target.result);
                if (!Array.isArray(importedTodos)) {
                    throw new Error('导入的文件格式不正确');
                }

                if (confirm(`确定要导入 ${importedTodos.length} 个任务吗？当前任务会被替换。`)) {
                    this.todos = importedTodos;
                    this.saveToLocalStorage();
                    this.render();
                    console.log('✅ 任务已导入');
                }
            } catch (error) {
                alert('导入失败: ' + error.message);
                console.error('导入错误:', error);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // 重置文件输入
    }
}

// 初始化应用
window.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});