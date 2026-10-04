# Lista de Tareas — Frontend

Interfaz web de la Lista de Tareas (HTML, CSS y JavaScript con `fetch`, sin frameworks).
Consume la API REST del backend en `http://localhost:3000/api`.

## Cómo ejecutar

Requisito: Node.js 18 o superior.

```bash
cd frontend
npm start
```

Abrir <http://localhost:5500> en el navegador.

> No hace falta `npm install` (no tiene dependencias).
> El backend debe estar corriendo en el puerto **3000** y tener CORS habilitado para `http://localhost:5500`.
> Abrir la página desde `http://localhost:5500`, no con doble clic en `index.html`.

La URL de la API se configura en [`js/config.js`](js/config.js).

## Endpoints que consume

| Acción                     | Petición                    | Body                                   |
|----------------------------|-----------------------------|----------------------------------------|
| Cargar tareas              | `GET /api/tasks`            | —                                      |
| Crear tarea                | `POST /api/tasks`           | `{ "title": "...", "description": "..." }` |
| Marcar completada/pendiente| `PUT /api/tasks/:id`        | `{ "completed": true }`                |
| Editar tarea               | `PUT /api/tasks/:id`        | `{ "title": "...", "description": "..." }` |
| Eliminar tarea             | `DELETE /api/tasks/:id`     | —                                      |

Errores esperados del backend: `{ "error": "mensaje" }` con código 400/404/500; el mensaje se muestra al usuario.

## Estructura

```
frontend/
├── index.html        # Estructura de la interfaz
├── server.js         # Servidor estático (puerto 5500)
├── package.json
├── css/styles.css    # Estilos (responsivo, modo oscuro)
└── js/
    ├── config.js     # URL de la API
    ├── api.js        # Peticiones fetch a la API
    └── app.js        # Estado, renderizado y eventos
```

## Funcionalidades

- Formulario para agregar tareas, con validación de campos vacíos y longitud antes de enviar.
- Lista de tareas con filtros (todas / pendientes / completadas) y contador de pendientes.
- Casilla para marcar como completada (texto **tachado**), edición en línea y eliminación con confirmación.
- Indicador de carga, botones con estado “Guardando…” y mensajes de error/éxito (por ejemplo, si el servidor está apagado o tarda demasiado).
- Diseño responsivo (celular y escritorio) y modo oscuro automático.
