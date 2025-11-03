# RANKING\_SYSTEM\_FRONTEND

## Descripción del Proyecto

Este proyecto es la interfaz de usuario (*frontend*) para un **Sistema de Clasificación (Ranking System)**. Su propósito es visualizar y permitir la interacción con los datos de clasificación proporcionados por un *backend* a través de una API REST.

La aplicación está construida utilizando tecnologías web estándar (HTML, CSS y JavaScript), lo que garantiza un funcionamiento ligero y una fácil implementación.

## Tecnologías Utilizadas

  * **HTML5:** Estructura de la aplicación.
  * **CSS3:** Estilos y presentación.
  * **JavaScript (Vanilla JS):** Lógica del cliente, manejo de eventos y consumo de *endpoints* de la API.

## Estructura del Proyecto

El repositorio sigue una estructura simple y modular:

```
RANKING_SYSTEM_FRONTEND/
├── css/              # Hojas de estilo
├── html/             # Componentes o vistas HTML secundarias
├── js/               # Archivos JavaScript con la lógica de la aplicación
├── index.html        # Página principal de la aplicación
└── README.md         # Documentación del proyecto
```

## Endpoints de la API Consumidos

El *frontend* interactúa con la lógica de clasificación del *backend* consumiendo los siguientes *endpoints*. Es crucial que el servidor *backend* esté corriendo y accesible en la base URL configurada (ej. `http://localhost:8080` o la dirección de despliegue).

| Funcionalidad | Método HTTP | Endpoint (asumiendo la base URL del backend) | Descripción |
| :--- | :--- | :--- | :--- |
| **Obtener Ranking** | `GET` | `/ranking` | Recupera la lista completa de clasificaciones o datos. |
| **Actualizar Puntuación**| `PUT` | `/ranking/{id}` | Actualiza la puntuación de un usuario o elemento específico en el ranking. |
| **Añadir Usuario/Elemento**| `POST` | `/ranking` | Agrega un nuevo elemento/jugador a la tabla de clasificación. |
| **Eliminar Usuario/Elemento**| `DELETE` | `/ranking/{id}` | Elimina un elemento/jugador del ranking. |

> **Nota:** La implementación de los *endpoints* está detallada dentro de los archivos JavaScript del directorio `js/`.

## Instalación y Ejecución Local

Sigue estos pasos para levantar la aplicación en tu entorno local:

### 1\. Requisitos

Asegúrate de tener un navegador web moderno (Chrome, Firefox, Edge) instalado.

### 2\. Clonar el Repositorio

Abre tu terminal y clona el proyecto:

```bash
git clone https://github.com/Kevinlevin200/RANKING_SYSTEM_FRONTEND.git
cd RANKING_SYSTEM_FRONTEND
```

### 3\. Configuración del Backend

Esta aplicación requiere que el servicio de *backend* asociado esté operativo para poder funcionar correctamente y mostrar los datos.

  * **Asegúrate de que el *backend* se esté ejecutando.**
  * **Verifica la URL:** El código JavaScript del *frontend* debe apuntar a la base URL correcta del *backend* (p. ej., si el *backend* corre en `http://localhost:8080`, esa debe ser la URL configurada para las llamadas `fetch`).

### 4\. Ejecutar el Frontend

Dado que es una aplicación de HTML, CSS y JavaScript puro, no requiere un proceso de *build* complejo.

Simplemente abre el archivo `index.html` en tu navegador:

1.  Navega a la carpeta principal del proyecto.
2.  Haz doble clic en `index.html`.

Alternativamente, puedes usar una extensión de servidor local simple (como **Live Server** en VS Code) para evitar problemas de CORS al consumir la API.