import { api } from './api.js';

// ---------- Estado de la aplicación ----------
const state = {
  tasks: [],
  filter: 'all',
  loading: false,
  editingId: null,
};

// ---------- Referencias al DOM ----------
const $ = (sel) => document.querySelector(sel);
const form = $('#task-form');
const titleInput = $('#title');
const descInput = $('#description');
const submitBtn = $('#submit-btn');
const list = $('#task-list');
const loadingEl = $('#loading');
const emptyEl = $('#empty');
const counterEl = $('#counter');
const alertEl = $('#alert');
const alertText = $('#alert-text');
const taskTemplate = $('#task-template');
const editTemplate = $('#edit-template');

// ---------- Mensajes ----------
let alertTimer;
function showAlert(message, type = 'error') {
  alertText.textContent = message;
  alertEl.className = `alert alert-${type}`;
  alertEl.hidden = false;
  clearTimeout(alertTimer);
  alertTimer = setTimeout(hideAlert, type === 'error' ? 6000 : 2500);
}
function hideAlert() {
  alertEl.hidden = true;
}
$('#alert-close').addEventListener('click', hideAlert);

// ---------- Validación en cliente ----------
function validate(title, description) {
  const errors = {};
  if (!title.trim()) errors.title = 'El título es obligatorio.';
  else if (title.trim().length > 100) errors.title = 'Máximo 100 caracteres.';
  if (description.trim().length > 500) errors.description = 'Máximo 500 caracteres.';
  return errors;
}

function setFieldError(input, errorEl, message) {
  errorEl.textContent = message || '';
  input.classList.toggle('invalid', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

// ---------- Utilidades ----------
function setBusy(button, busy, busyText) {
  button.disabled = busy;
  const label = button.querySelector('.btn-label') || button;
  if (busy) {
    button.dataset.text = label.textContent;
    label.textContent = busyText;
    button.classList.add('is-loading');
  } else {
    label.textContent = button.dataset.text || label.textContent;
    button.classList.remove('is-loading');
  }
}

const dateFormat = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : dateFormat.format(d);
}

// ---------- Renderizado ----------
function visibleTasks() {
  if (state.filter === 'pending') return state.tasks.filter((t) => !t.completed);
  if (state.filter === 'completed') return state.tasks.filter((t) => t.completed);
  return state.tasks;
}

function render() {
  loadingEl.hidden = !state.loading;

  const pending = state.tasks.filter((t) => !t.completed).length;
  counterEl.textContent = state.tasks.length
    ? `${pending} pendiente${pending === 1 ? '' : 's'} de ${state.tasks.length}`
    : '';

  const tasks = visibleTasks();
  list.replaceChildren(...tasks.map(renderTask));

  if (!state.loading && tasks.length === 0) {
    emptyEl.textContent = state.tasks.length === 0
      ? 'No hay tareas todavía. ¡Agrega la primera!'
      : 'No hay tareas en este filtro.';
    emptyEl.hidden = false;
  } else {
    emptyEl.hidden = true;
  }
}

function renderTask(task) {
  const li = taskTemplate.content.firstElementChild.cloneNode(true);
  li.dataset.id = task.id;
  li.classList.toggle('completed', task.completed);

  if (state.editingId === task.id) {
    li.classList.add('editing');
    li.replaceChildren(renderEditForm(task));
    return li;
  }

  const toggle = li.querySelector('.task-toggle');
  toggle.checked = task.completed;
  toggle.addEventListener('change', () => toggleTask(task, toggle, li));

  li.querySelector('.task-title').textContent = task.title;
  const desc = li.querySelector('.task-desc');
  desc.textContent = task.description;
  desc.hidden = !task.description;
  const time = li.querySelector('.task-date');
  time.dateTime = task.created_at;
  time.textContent = `Creada: ${formatDate(task.created_at)}`;

  li.querySelector('.task-edit').addEventListener('click', () => {
    state.editingId = task.id;
    render();
    list.querySelector(`[data-id="${task.id}"] input[name="title"]`)?.focus();
  });
  li.querySelector('.task-delete').addEventListener('click', (e) => deleteTask(task, e.currentTarget, li));

  return li;
}

function renderEditForm(task) {
  const editForm = editTemplate.content.firstElementChild.cloneNode(true);
  const titleEl = editForm.elements.title;
  const descEl = editForm.elements.description;
  const errorEl = editForm.querySelector('.field-error');
  titleEl.value = task.title;
  descEl.value = task.description;

  editForm.querySelector('.edit-cancel').addEventListener('click', () => {
    state.editingId = null;
    render();
  });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errors = validate(titleEl.value, descEl.value);
    setFieldError(titleEl, errorEl, errors.title || errors.description);
    if (errors.title || errors.description) return;

    const saveBtn = editForm.querySelector('[type="submit"]');
    setBusy(saveBtn, true, 'Guardando…');
    try {
      const updated = await api.updateTask(task.id, {
        title: titleEl.value.trim(),
        description: descEl.value.trim(),
      });
      replaceTask(updated);
      state.editingId = null;
      render();
      showAlert('Tarea actualizada.', 'success');
    } catch (err) {
      setBusy(saveBtn, false);
      showAlert(err.message);
    }
  });

  return editForm;
}

function replaceTask(updated) {
  state.tasks = state.tasks.map((t) => (t.id === updated.id ? updated : t));
}

// ---------- Acciones (CRUD) ----------
async function loadTasks() {
  state.loading = true;
  render();
  try {
    state.tasks = await api.getTasks();
  } catch (err) {
    showAlert(err.message);
  } finally {
    state.loading = false;
    render();
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value;
  const description = descInput.value;

  const errors = validate(title, description);
  setFieldError(titleInput, $('#title-error'), errors.title);
  setFieldError(descInput, $('#description-error'), errors.description);
  if (errors.title || errors.description) {
    (errors.title ? titleInput : descInput).focus();
    return;
  }

  setBusy(submitBtn, true, 'Guardando…');
  try {
    const created = await api.createTask({ title: title.trim(), description: description.trim() });
    state.tasks = [created, ...state.tasks];
    form.reset();
    render();
    showAlert('Tarea creada.', 'success');
  } catch (err) {
    showAlert(err.message);
  } finally {
    setBusy(submitBtn, false);
    titleInput.focus();
  }
});

// Quitar el error del campo mientras el usuario escribe
titleInput.addEventListener('input', () => {
  if (titleInput.value.trim()) setFieldError(titleInput, $('#title-error'), '');
});

async function toggleTask(task, checkbox, li) {
  checkbox.disabled = true;
  li.classList.add('busy');
  try {
    const updated = await api.updateTask(task.id, { completed: checkbox.checked });
    replaceTask(updated);
    render();
  } catch (err) {
    checkbox.checked = task.completed; // revertir
    checkbox.disabled = false;
    li.classList.remove('busy');
    showAlert(err.message);
  }
}

async function deleteTask(task, button, li) {
  if (!confirm(`¿Eliminar la tarea "${task.title}"?`)) return;
  setBusy(button, true, 'Eliminando…');
  li.classList.add('busy');
  try {
    await api.deleteTask(task.id);
    state.tasks = state.tasks.filter((t) => t.id !== task.id);
    render();
    showAlert('Tarea eliminada.', 'success');
  } catch (err) {
    setBusy(button, false);
    li.classList.remove('busy');
    showAlert(err.message);
  }
}

// ---------- Filtros ----------
document.querySelectorAll('.filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.filter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
});

loadTasks();
