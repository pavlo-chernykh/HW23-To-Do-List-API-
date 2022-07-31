class ToDoModel {
  #baseUrl = 'https://todo.hillel.it';
  token = '';

  constructor() {
    this.list = [];
  }

  async auth(email, password) {

    const requestBody = JSON.stringify({
      value: email + password
    });

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.#baseUrl}/auth/login`, {
      method: 'POST',
      headers,
      body: requestBody
    });
    const { access_token: accessToken } = await response.json();
    this.token = accessToken;
  }

// eslint-disable-next-line no-magic-numbers
  async addNote(toDoName, toDoText, priority = 1) {

    const requestBody = JSON.stringify({
      value: `${toDoName} iiizzzddd ${toDoText}`,
      priority
    });

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${this.token}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.#baseUrl}/todo`, {
      method: 'POST',
      headers,
      body: requestBody
    });

    await response.json();
  }

  async getAll() {

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${this.token}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.#baseUrl}/todo`, {
      method: 'GET',
      headers
    });

    const allNotes = await response.json();
    this.list.push(allNotes);

    return allNotes;
  }

  async deleteNote(id) {
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${this.token}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.#baseUrl}/todo/${id}`, {
      method: 'DELETE',
      headers
    });

    this.list.push(response);
  }

// eslint-disable-next-line no-magic-numbers
  async editNote(id, toDoName, toDoText, priority = 1) {
    await fetch(`${this.#baseUrl}/todo/${id}`,{
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: `${toDoName} iiizzzddd ${toDoText}`,
        priority
      })
    });
  }

  async toggleNote(id) {
    await fetch(`${this.#baseUrl}/todo/${id}/toggle`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getStats() {
    const result = await this.getAll();
    const allTasks = result.length;
    const finishedStartingVal = 0;
    const finishedTasks = result.reduce((checked, task) => {
      if (task.checked) {
        // eslint-disable-next-line no-param-reassign
        checked++;
      }
      return checked;
    },finishedStartingVal);


    const leftTasks = allTasks - finishedTasks;
    const statusesCount = {
      allTasks,
      finishedTasks,
      leftTasks,
    };

    return statusesCount;
  }
}


for (const key in ToDoModel) {
  Object.defineProperty(ToDoModel, key, {
    configurable: false
  });
}

class TodoView {

  constructor(model) {

    this.model = model;
    this.form = document.querySelector('.create-form');
    this.list = document.querySelector('.todo-list');
    this.total = document.querySelector('.total');
    this.finished = document.querySelector('.finished');
    this.notFinished = document.querySelector('.not-finished');
    this.total = document.querySelector('.total');
    this.finished = document.querySelector('.finished');
    this.notFinished = document.querySelector('.not-finished');

    this.login();
    this.loginSignIn();
    this.initSubmit();
    this.initModify();
    this.renderStats();
  }

  async renderStats() {
    const modelStats = await this.model.getStats();

    const {allTasks, finishedTasks, leftTasks} = modelStats;


    this.total.textContent = allTasks;
    this.finished.textContent = finishedTasks;
    this.notFinished.textContent = leftTasks;
  }

  async renderList() {

    const notesArr = await this.model.getAll();
    const fragment = new DocumentFragment();

    notesArr.forEach(note => {
      const val = note.value.split('iiizzzddd');
      const id = note._id;

      const listItem = document.createElement('li');
      listItem.classList.add('todo-card');
      listItem.setAttribute('id', id);

      const toDoName = document.createElement('div');
      toDoName.classList.add('todo-card__name');
      // eslint-disable-next-line prefer-destructuring, no-magic-numbers
      toDoName.textContent = val[0];

      const toDoText = document.createElement('div');
      toDoText.classList.add('todo-card__task');
      // eslint-disable-next-line prefer-destructuring, no-magic-numbers
      toDoText.textContent = val[1];

      const actionContainer = document.createElement('div');
      actionContainer.classList.add('todo-card__actions');

      const toggleButton = document.createElement('button');
      toggleButton.classList.add('todo-card__toggle');
      toggleButton.textContent = 'Done';

      if (note.checked) {
        listItem.classList.add('checked');


      } else {
        listItem.classList.remove('checked');
      }

      const removeButton = document.createElement('button');
      removeButton.classList.add('todo-card__remove');
      removeButton.textContent = 'Delete';

      const editButton = document.createElement('button');
      editButton.classList.add('todo-card__edit');
      editButton.textContent = '✎';

      actionContainer.append(toggleButton, removeButton, editButton);
      listItem.append(toDoName, toDoText, actionContainer);
      fragment.append(listItem);

    });
    this.list.innerHTML = '';

    this.list.append(fragment);
  }

  loginSignIn() {
    const localToken = localStorage.getItem('localToken');
    if (!localToken) {
      this.login();
    } else {
      this.model.token = localToken;
      this.renderList();
      const loginArea = document.querySelector('.signup-form');
      loginArea.hidden = true;

      const todoArea = document.querySelector('.create-form');
      todoArea.hidden = false;
    }
  }

  login() {
    const loginBtn = document.querySelector('.create-form__submit');
    loginBtn.addEventListener('click', async(e) => {
      e.preventDefault();
      const email = document.querySelector('#email').value;
      const password = document.querySelector('#password').value;
      await this.model.auth(email, password);

      localStorage.setItem('localToken', this.model.token);
    });
  }

  initSubmit() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const name = formData.get('todoName').trim();
      const text = formData.get('todoText').trim();

      if(name && text) {
        await this.model.addNote(name, text);
        await this.renderList();
        await this.renderStats();
        e.target.reset();
      }
    });
  }

  initModify() {
    this.list.addEventListener('click', async ({target}) => {
      const item = target.closest('.todo-card');
      const deleteBtn = target.closest('.todo-card__remove');
      const editBtn = target.closest('.todo-card__edit');
      const toggleBtn = target.closest('.todo-card__toggle');
        if (deleteBtn) {
          await item.remove();
          await this.model.deleteNote(item.id);
          this.renderList();
          this.renderStats();
        }

        if (editBtn) {
          const toDoName = item.querySelector('.todo-card__name');
          const toDoText = item.querySelector('.todo-card__task');

          if (!editBtn.classList.contains('todo-card__edit-confirm')) {
            const prevValueName = toDoName.textContent;
            const prevValueText = toDoText.textContent;
            // eslint-disable-next-line max-len
            toDoName.innerHTML = `<input class="todo-card__edit-nameinput" type="text" name="edit" value="${prevValueName}">`;
            // eslint-disable-next-line max-len
            toDoText.innerHTML = `<input class="todo-card__edit-textinput" type="text" name="edit" value="${prevValueText}">`;

            editBtn.classList.add('todo-card__edit-confirm');
          } else {
            const newValueName = item.querySelector('.todo-card__edit-nameinput').value;
            const newValueText = item.querySelector('.todo-card__edit-textinput').value;

            this.model.editNote(item.id, newValueName, newValueText);

            toDoName.innerHTML = `${newValueName}`;
            toDoText.innerHTML = `${newValueText}`;

            editBtn.classList.remove('todo-card__edit-confirm');
          }
        }

        if (toggleBtn) {
          await this.model.toggleNote(item.id);
          this.renderList();
          this.renderStats();
        }
    });
  }
}

const tdlm = new ToDoModel();
new TodoView(tdlm);

