// Cliente HTTP para la API de tareas (usa fetch)
const BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || 'http://localhost:3000/api';
const TIMEOUT_MS = 8000;

async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder. Intente de nuevo.');
    }
    throw new Error('No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Error del servidor (${res.status})`);
  }
  return data;
}

export const api = {
  getTasks: () => request('/tasks'),
  createTask: (task) => request('/tasks', { method: 'POST', body: task }),
  updateTask: (id, changes) => request(`/tasks/${id}`, { method: 'PUT', body: changes }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
