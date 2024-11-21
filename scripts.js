/**
 * JavaScript for the To-Do List website
 */
document.addEventListener('DOMContentLoaded', () => {
  const taskContainer = document.querySelector('.task-container');
  const addTaskButton = document.getElementById('add-task-button');
  const addCategoryButton = document.getElementById('add-category-button');
  const categoryList = document.getElementById('category-list');

  // Default and saved categories
  const defaultCategories = ['Work', 'Personal', 'Shopping'];
  let categories =
    JSON.parse(localStorage.getItem('categories')) || defaultCategories;

  // Pre-defined titles for specific pages
  const pageTitles = {
    prioritized: 'Prioritized Tasks',
    due2: 'Due in 2 Days',
    overdue: 'Overdue Tasks',
  };

  // Set the title based on the current page
  const queryParams = new URLSearchParams(window.location.search);
  const currentPage = queryParams.get('category');
  const titleElement = document.querySelector('h1');

  if (currentPage && titleElement) {
    // Use specific title for predefined pages, or category name as default
    titleElement.textContent = pageTitles[currentPage] || currentPage;
  }

  // Add a default task if no tasks exist and user is on the home page
  function addDefaultTaskIfNone() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    if (tasks.length === 0 && !window.location.search) {
      const defaultTask = {
        title: 'New Task',
        dueDate: '',
        completed: false,
        prioritized: false,
        category: 'Uncategorized',
      };
      saveTask(defaultTask);
      displayTask(defaultTask);
    }
  }

  /*
      CATEGORIES
  */

  // Load and display all categories in the sidebar
  function loadCategories() {
    categoryList.innerHTML = ''; // Clear previous categories
    categories.forEach((category) => {
      const categoryItem = document.createElement('li');

      // Navigation link for the category
      const categoryLink = document.createElement('a');
      categoryLink.href = `index.html?category=${encodeURIComponent(category)}`;
      categoryLink.textContent = category;
      categoryLink.classList.add('category-link');

      // Delete button for removing a category
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '✖';
      deleteButton.classList.add('category-delete-button');
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Avoid triggering navigation
        deleteCategory(category);
      });

      // Append elements to the category list
      categoryItem.appendChild(categoryLink);
      categoryItem.appendChild(deleteButton);
      categoryList.appendChild(categoryItem);
    });

    saveCategories();
    updateAllDropdowns(); // Update category dropdowns
  }

  // Add a new category after user input
  addCategoryButton.addEventListener('click', () => {
    const newCategory = prompt('Enter a new category:');
    if (newCategory) {
      // Capitalize the first letter of each word
      const formattedCategory = newCategory
        .trim()
        .split(' ')
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ');

      // Prevent duplicate categories (case-insensitive)
      const lowerCaseCategories = categories.map((c) => c.toLowerCase());
      if (!lowerCaseCategories.includes(formattedCategory.toLowerCase())) {
        categories.push(formattedCategory);
        loadCategories(); // Refresh category list
        updateAllDropdowns(); // Update dropdown menus
      } else {
        alert('Category already exists!');
      }
    }
  });

  // Save updated categories to localStorage
  function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
  }

  // Remove a category and update the display
  function deleteCategory(category) {
    categories = categories.filter((c) => c !== category);
    loadCategories();
  }

  // Filter tasks based on the selected category or condition
  function setCategoryFilter(filter) {
    const taskDivs = document.querySelectorAll('.task');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    taskDivs.forEach((taskDiv) => {
      const taskCategory = taskDiv.querySelector('.task-category').value;
      const taskPrioritized =
        taskDiv.querySelector('.prioritize-task-button').textContent ===
        'Unprioritize';
      const taskDueDate = taskDiv.querySelector('.task-due-date').value;
      const dueDate = new Date(taskDueDate);
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let shouldShow = false;

      if (filter === 'prioritized') {
        shouldShow = taskPrioritized;
      } else if (filter === 'due2') {
        shouldShow = diffDays <= 2 && diffDays >= 0;
      } else if (filter === 'overdue') {
        if (taskDueDate != '') {
          shouldShow = taskDueDate < todayString;
        }
      } else if (filter === 'all') {
        shouldShow = true;
      } else {
        shouldShow = taskCategory === filter;
      }

      taskDiv.classList.toggle('hidden', !shouldShow);
    });
  }

  // Update all dropdown menus to reflect current categories
  function updateAllDropdowns() {
    const dropdowns = document.querySelectorAll('.task-category');
    dropdowns.forEach((dropdown) => {
      const currentValue = dropdown.value;

      dropdown.innerHTML = '';

      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = 'Uncategorized';
      placeholderOption.disabled = true;
      placeholderOption.selected =
        currentValue === '' || !categories.includes(currentValue);
      dropdown.appendChild(placeholderOption);

      categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        option.selected = currentValue === category;
        dropdown.appendChild(option);
      });

      if (!categories.includes(currentValue)) {
        dropdown.value = '';
      }
    });
  }

  /*
      TASKS
  */

  // Load and display all tasks
  function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    taskContainer.innerHTML = '';
    tasks.forEach((task) => {
      displayTask(task);
    });
  }

  // Save a task to localStorage
  function saveTask(task) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const existingIndex = tasks.findIndex((t) => t.id === task.id);

    if (existingIndex > -1) {
      tasks[existingIndex] = task; // Update existing task
    } else {
      tasks.push(task); // Add new task
    }

    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Display task in the task container
  function displayTask(task) {
    const taskDiv = document.createElement('div');
    taskDiv.classList.add('task');
    taskDiv.dataset.id = task.id || Date.now();

    // Task row with title, checkbox, and buttons
    const row1 = document.createElement('div');
    row1.classList.add('task-row');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveTask(task);

      // Auto-delete completed tasks after 2 seconds
      if (task.completed) {
        setTimeout(() => {
          deleteTask(task);
          taskDiv.remove();
        }, 2000);
      }
    });

    const taskTitle = document.createElement('span');
    taskTitle.classList.add('task-title');
    taskTitle.textContent = task.title;

    // Buttons for prioritization and deletion
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('task-buttons');

    const prioritizeButton = document.createElement('button');
    prioritizeButton.classList.add('prioritize-task-button');
    prioritizeButton.textContent = task.prioritized
      ? 'Unprioritize'
      : 'Prioritize';
    prioritizeButton.addEventListener('click', () => {
      task.prioritized = !task.prioritized;
      prioritizeButton.textContent = task.prioritized
        ? 'Unprioritize'
        : 'Prioritize';
      saveTask(task);
    });

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-task-button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      deleteTask(task);
      taskDiv.remove();
    });

    // Append buttons to the container
    buttonContainer.appendChild(prioritizeButton);
    buttonContainer.appendChild(deleteButton);

    // Append row 1 elements for a task
    row1.appendChild(checkbox);
    row1.appendChild(taskTitle);
    row1.appendChild(buttonContainer);

    // Row 2: Due date and category dropdown
    const row2 = document.createElement('div');
    row2.classList.add('task-row');

    const dueDate = document.createElement('input');
    dueDate.type = 'date';
    dueDate.classList.add('task-due-date');
    dueDate.value = task.dueDate;

    dueDate.addEventListener('change', () => {
      task.dueDate = dueDate.value;
      saveTask(task);
    });

    const categorySelect = document.createElement('select');
    categorySelect.classList.add('task-category');

    // Placeholder option for uncategorized tasks
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Uncategorized';
    placeholderOption.disabled = true;
    placeholderOption.selected = task.category === 'Uncategorized';
    categorySelect.appendChild(placeholderOption);

    // Populate category dropdown
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      option.selected = task.category === category;
      categorySelect.appendChild(option);
    });

    categorySelect.addEventListener('change', () => {
      task.category = categorySelect.value || 'Uncategorized';
      saveTask(task);
    });

    // Append row 2 elements for a task
    row2.appendChild(dueDate);
    row2.appendChild(categorySelect);

    // Append rows to the task container
    taskDiv.appendChild(row1);
    taskDiv.appendChild(row2);
    taskContainer.appendChild(taskDiv);
  }

  // Delete a task and update the task list
  function deleteTask(taskToDelete) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const updatedTasks = tasks.filter((task) => task.id !== taskToDelete.id);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  }

  // Add a new task when the button is clicked
  if (addTaskButton) {
    addTaskButton.addEventListener('click', () => {
      const newTask = {
        id: Date.now(),
        title: 'New Task',
        dueDate: '',
        completed: false,
        prioritized: false,
        category: 'Uncategorized',
      };
      saveTask(newTask);
      displayTask(newTask);
    });
  }

  // Initial setup: Load categories, load tasks, and add default task if none on home page
  loadCategories();
  loadTasks();
  addDefaultTaskIfNone();

  // Apply task filters based on URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const filter = urlParams.get('category') || 'all';
  setCategoryFilter(filter);
});
