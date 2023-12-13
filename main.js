import config from './config.js';

const tasks = [];
let lastTaskId = 0;

let taskList;
let addTask;
let authToken;

// kui leht on brauseris laetud siis lisame esimesed taskid lehele
window.addEventListener('load', () => {
    taskList = document.querySelector('#task-list');
    addTask = document.querySelector('#add-task');
    fetch('http://demo2.z-bit.ee/users/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: config.username,
          password: config.password,
        }),
      })
      .then(response => response.json())
      .then(data => {
          authToken = data.access_token;
          fetchTasks();
      });
  
      addTask.addEventListener('click', async () => {
          const task = await createTask();
          if (task) {
          renderTask(task)
          }
      });
  });


function renderTask(task) {
    const taskRow = createTaskRow(task);
    taskList.appendChild(taskRow);
}

function createTask() {
    lastTaskId++;

    const task = {
        id: lastTaskId,
        title: 'New Task ' + lastTaskId,
        desc: '',
        marked_as_done: false,
        created_at: new Date().toLocaleString() 
    };

    return fetch('http://demo2.z-bit.ee/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(task),
    })
    .then(response => response.json())
    .then(result => {
        task.id = result.id; 
        tasks.push(task);
        return task;
    })
    .catch(error => {
        console.error('Error adding task:', error);
        return null; // Return null in case of an error
    });
}

function updateTaskName(task) {
    fetch(`http://demo2.z-bit.ee/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
            title: task.title,
        }),
    })
    .then(response => {
        if (!response.ok) {
            console.log('Error updating task name:', response.statusText);
        }
    })
    .catch(error => console.log('Error updating task name:', error));
}


function deleteTask(task, taskRow) {
    
    fetch(`http://demo2.z-bit.ee/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
    })
    .then(response => {
        if (response.ok) {
            taskList.removeChild(taskRow);
            tasks.splice(tasks.indexOf(task), 1);
        } else {
            console.error('Error deleting task:', response.statusText);
        }
    })
    .catch(error => console.error('Error deleting task:', error));
}

function fetchTasks() {
    fetch('http://demo2.z-bit.ee/tasks', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Unauthorized');
        }
        return response.json();
    })
    .then(data => {
        if (Array.isArray(data)) {
            tasks.push(...data);
            tasks.forEach(renderTask);
        } else {
            console.error('Data is not an array:', data);
        }
    })
    .catch(error => {
        console.error('Error fetching tasks:', error);
    });
}


function createTaskRow(task) {

    const taskRow = document.querySelector('[data-template="task-row"]').cloneNode(true);
    taskRow.removeAttribute('data-template');

    const name = taskRow.querySelector("[name='name']");
     if (task) {
        console.log('Setting name value:', task.title);
        name.value = task.title || '';
    } else {
        console.error('Task is undefined or null.');
    }



    const checkbox = taskRow.querySelector("[name='completed']");
    checkbox.checked = task.marked_as_done;
    

     name.addEventListener('input', () => {
        task.title = name.value;
        updateTaskName(task);
    });

    const deleteButton = taskRow.querySelector('.delete-task');
    deleteButton.addEventListener('click', () => deleteTask(task, taskRow));

    hydrateAntCheckboxes(taskRow);

    return taskRow;
}

function createAntCheckbox() {
    const checkbox = document.querySelector('[data-template="ant-checkbox"]').cloneNode(true);
    checkbox.removeAttribute('data-template');
    hydrateAntCheckboxes(checkbox);
    return checkbox;
}

/**
 * See funktsioon aitab lisada eridisainiga checkboxile vajalikud event listenerid
 * @param {HTMLElement} element Checkboxi wrapper element või konteiner element mis sisaldab mitut checkboxi
 */
function hydrateAntCheckboxes(element) {
    const elements = element.querySelectorAll('.ant-checkbox-wrapper');
    for (let i = 0; i < elements.length; i++) {
        let wrapper = elements[i];

        // Kui element on juba töödeldud siis jäta vahele
        if (wrapper.__hydrated)
            continue;
        wrapper.__hydrated = true;

        const checkbox = wrapper.querySelector('.ant-checkbox');

        // Kontrollime kas checkbox peaks juba olema checked, see on ainult erikujundusega checkboxi jaoks
        const input = wrapper.querySelector('.ant-checkbox-input');
        if (input.checked) {
            checkbox.classList.add('ant-checkbox-checked');
        }

        // Kui checkboxi või label'i peale vajutatakse siis muudetakse checkboxi olekut
        wrapper.addEventListener('click', () => {
            input.checked = !input.checked;
            checkbox.classList.toggle('ant-checkbox-checked');
        });
    }
}