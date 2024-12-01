/**
 * JavaScript for the To-Do List website
 */
document.addEventListener('DOMContentLoaded', () => {
  const taskContainer = document.querySelector('.task-container');
  const addTaskButton = document.getElementById('add-task-button');
  const addCategoryButton = document.getElementById('add-category-button');
  const categoryList = document.getElementById('category-list');
  let paginationPage = 1; // Tracks the current pagination page
  const tasksPerPage = 7; // Maximum tasks per page

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

    // Update tasks in localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const updatedTasks = tasks.map((task) => {
      if (task.category === category) {
        task.category = 'Uncategorized'; // Reset to "Uncategorized"
      }
      return task;
    });

    // Save updated tasks to localStorage
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
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

    // Apply pagination after filtering
    paginateTasks();
  }

  function paginateTasks() {
    const taskDivs = Array.from(document.querySelectorAll('.task')).filter(
      (task) => !task.classList.contains('hidden')
    ); // Only include visible (filtered) tasks
    const totalTasks = taskDivs.length;
    const totalPages = Math.ceil(totalTasks / tasksPerPage);

    // Adjust the current page if it exceeds the total number of pages
    if (paginationPage > totalPages) {
      paginationPage = totalPages;
    }

    // Update pagination controls
    document.getElementById('prev-page').disabled = paginationPage === 1;
    document.getElementById('next-page').disabled =
      paginationPage === totalPages || totalPages === 0;

    // Show tasks for the current page, hide others
    taskDivs.forEach((task, index) => {
      task.style.display =
        index >= (paginationPage - 1) * tasksPerPage &&
          index < paginationPage * tasksPerPage
          ? 'block'
          : 'none';
    });

    // Update the current page number
    document.getElementById('page-number').textContent = `Page ${paginationPage}`;
  }

  document.getElementById('prev-page').addEventListener('click', () => {
    if (paginationPage > 1) {
      paginationPage--;
      paginateTasks();
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    const taskDivs = Array.from(document.querySelectorAll('.task')).filter(
      (task) => !task.classList.contains('hidden')
    );
    const totalTasks = taskDivs.length;
    const totalPages = Math.ceil(totalTasks / tasksPerPage);

    if (paginationPage < totalPages) {
      paginationPage++;
      paginateTasks();
    }
  });

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    // Create the main container for the task
    const taskDiv = document.createElement('div');
    taskDiv.classList.add('task');
    taskDiv.dataset.id = task.id || Date.now();

    // Apply prioritized and overdue classes based on task properties
    if (task.prioritized) {
      taskDiv.classList.add('prioritized'); // Add CSS class for prioritized tasks
    }
    if (task.dueDate && task.dueDate < todayString) {
      taskDiv.classList.add('overdue'); // Add CSS class for overdue tasks
    }

    // Row 1: Includes the checkbox, title, and control buttons
    const row1 = document.createElement('div');
    row1.classList.add('task-row');

    // Checkbox to mark task as completed or not
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveTask(task);

      // Automatically delete the task after 2 seconds if marked as completed
      if (task.completed) {
        setTimeout(() => {
          deleteTask(task);
          taskDiv.remove();
        }, 2000);
      }
    });

    // Editable title for the task
    const taskTitle = document.createElement('span');
    taskTitle.classList.add('task-title');
    taskTitle.textContent = task.title;
    taskTitle.contentEditable = true; // Makes the title editable
    taskTitle.addEventListener('blur', () => {
      task.title = taskTitle.textContent.trim(); // Save changes when editing ends
      saveTask(task); // Persist updated task title in localStorage
    });

    // Container for the control buttons (e.g., prioritize and delete)
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('task-buttons');

    // Button to toggle prioritization status
    const prioritizeButton = document.createElement('button');
    prioritizeButton.classList.add('prioritize-task-button');
    prioritizeButton.textContent = task.prioritized
      ? 'Unprioritize'
      : 'Prioritize';
    prioritizeButton.addEventListener('click', () => {
      task.prioritized = !task.prioritized; // Toggle prioritization

      if (task.prioritized) {
        taskDiv.classList.add('prioritized'); // Add prioritized class
      } else {
        taskDiv.classList.remove('prioritized'); // Remove prioritized class
      }

      prioritizeButton.textContent = task.prioritized
        ? 'Unprioritize'
        : 'Prioritize';
      saveTask(task); // Persist updated prioritization status
    });

    // Button to delete the task
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-task-button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      deleteTask(task); // Remove task from storage
      taskDiv.remove(); // Remove task from the DOM
    });

    // Add buttons to the control container
    buttonContainer.appendChild(prioritizeButton);
    buttonContainer.appendChild(deleteButton);

    // Append all elements to the first row of the task
    row1.appendChild(checkbox);
    row1.appendChild(taskTitle);
    row1.appendChild(buttonContainer);

    // Row 2: Includes due date input and category dropdown
    const row2 = document.createElement('div');
    row2.classList.add('task-row');

    // Input for setting the task's due date
    const dueDate = document.createElement('input');
    dueDate.type = 'date';
    dueDate.classList.add('task-due-date');
    dueDate.value = task.dueDate;

    dueDate.addEventListener('change', () => {
      const newDueDate = dueDate.value;
      task.dueDate = dueDate.value; // Update task due date

      if (newDueDate && newDueDate < todayString) {
        taskDiv.classList.add('overdue'); // Add overdue class
        taskDiv.classList.remove('prioritized'); // Remove prioritized class if applicable
      } else {
        taskDiv.classList.remove('overdue'); // Remove overdue class
        if (task.prioritized) {
          taskDiv.classList.add('prioritized'); // Reapply prioritized class if applicable
        }
      }

      saveTask(task); // Persist updated due date
    });

    // Dropdown for assigning the task to a category
    const categorySelect = document.createElement('select');
    categorySelect.classList.add('task-category');

    // Default "Uncategorized" option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Uncategorized';
    placeholderOption.disabled = true;
    placeholderOption.selected = task.category === 'Uncategorized';
    categorySelect.appendChild(placeholderOption);

    // Populate dropdown with available categories
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      option.selected = task.category === category; // Pre-select the current category
      categorySelect.appendChild(option);
    });

    categorySelect.addEventListener('change', () => {
      task.category = categorySelect.value || 'Uncategorized'; // Update category
      saveTask(task); // Persist updated category
    });

    // Add due date and category dropdown to the second row
    row2.appendChild(dueDate);
    row2.appendChild(categorySelect);

    // Add both rows to the task container
    taskDiv.appendChild(row1);
    taskDiv.appendChild(row2);

    // Append the task container to the main task display area
    taskContainer.prepend(taskDiv);
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
