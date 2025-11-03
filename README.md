# RANKING\_SYSTEM\_FRONTEND

[](https://github.com/Kevinlevin200/RANKING_SYSTEM_FRONTEND)
[](https://github.com/Kevinlevin200/RANKING_SYSTEM_FRONTEND)
[](https://www.google.com/search?q=https://github.com/Kevinlevin200/RANKING_SYSTEM_FRONTEND/commits/main)

## 📝 Descripción del Proyecto

Este es el cliente web (*frontend*) del **Sistema de Clasificación (Ranking System)**, una aplicación diseñada para gestionar, calificar y clasificar restaurantes y sus platos. La interfaz se encarga de la presentación de datos, la gestión de sesiones de usuario y la interacción directa con la API REST del *backend*.

## 🚀 Tecnologías Utilizadas

  * **HTML5, CSS3, JavaScript (Vanilla JS):** Utilizado para construir una interfaz ligera y funcional.
  * **Consumo de API:** Uso de `fetch` API para interactuar con los servicios del *backend*.

## ⚙️ Configuración y Ejecución Local

### 1\. Requisitos

  * Tener operativo el **RANKING\_SYSTEM\_BACKEND** (Servidor Node.js) en un puerto accesible (ej. `http://localhost:4000/api/v1`).

### 2\. Clonar el Repositorio

```bash
git clone https://github.com/Kevinlevin200/RANKING_SYSTEM_FRONTEND.git
cd RANKING_SYSTEM_FRONTEND
```

### 3\. Ejecutar el Frontend

Dado que es una aplicación de *Vanilla JS*, solo necesitas un servidor web simple para evitar problemas de CORS y cargar el contenido localmente.

  * **Opción Recomendada:** Usar una extensión como **Live Server** en VS Code.
  * **Opción Alternativa:** Abre `index.html` directamente en tu navegador.

> **Importante:** Asegúrate de que todas las llamadas `fetch` en los archivos `js/` apunten a la URL base correcta del *backend* (`http://localhost:4000/api/v1` para desarrollo).

## 🌐 Consumo de API (Endpoints del Backend)

El *frontend* se comunica con la API REST del *backend*, cuya documentación completa es la **Ranking System API**. La URL base para todas las peticiones es `http://localhost:4000/api/v1`.

### 🔒 Servicios de Usuarios y Autenticación

| Funcionalidad | Método | Ruta Completa | Seguridad |
| :--- | :--- | :--- | :--- |
| **Registro** | `POST` | `/api/v1/usuarios/registrar` | Pública |
| **Login** | `POST` | `/api/v1/usuarios/login` | Pública |
| **Verificar Sesión** | `GET` | `/api/v1/usuarios/verificar-sesion` | **Requiere JWT** |
| **Cambiar Contraseña** | `PATCH` | `/api/v1/usuarios/cambiar-contraseña` | **Requiere JWT** |

### 📊 Servicios de Ranking y Consulta

El Ranking es la funcionalidad principal, permitiendo mostrar los resultados ordenados.

| Funcionalidad | Método | Ruta Completa | Parámetros |
| :--- | :--- | :--- | :--- |
| **Ranking General** | `GET` | `/api/v1/ranking/ranking` | Ninguno |
| **Ranking por Categoría** | `GET` | `/api/v1/ranking/categoria/{categoria}` | `:categoria` (en ruta) |
| **Detalle de Restaurante** | `GET` | `/api/v1/ranking/detalle/{id}` | `:id` (ID del restaurante en ruta) |

### 🍽️ Servicios de Restaurantes y Platos (Consulta Pública)

| Funcionalidad | Método | Ruta Completa | Parámetros |
| :--- | :--- | :--- | :--- |
| **Listar Restaurantes** | `GET` | `/api/v1/restaurantes` | Ninguno |
| **Obtener Restaurante por ID** | `GET` | `/api/v1/restaurantes/{id}` | `:id` (en ruta) |
| **Listar Platos** | `GET` | `/api/v1/platos` | Ninguno |
| **Listar Platos por Restaurante** | `GET` | `/api/v1/platos/restaurante/{restauranteId}` | `:restauranteId` (en ruta) |

### ⭐ Servicios de Reseñas e Interacción

| Funcionalidad | Método | Ruta Completa | Seguridad |
| :--- | :--- | :--- | :--- |
| **Crear Reseña** | `POST` | `/api/v1/resena/registrar` | **Requiere JWT** |
| **Listar Reseñas de Usuario** | `GET` | `/api/v1/resena/usuario/{usuarioId}` | **Requiere JWT** |
| **Dar Like a Reseña** | `POST` | `/api/v1/resena/{id}/like` | **Requiere JWT** |
| **Dar Dislike a Reseña** | `POST` | `/api/v1/resena/{id}/dislike` | **Requiere JWT** |

### ➕ Servicios Administrativos y de Gestión (Requieren JWT)

El *frontend* también puede interactuar con endpoints de gestión, típicamente para usuarios con rol `admin`.

| Funcionalidad | Método | Ruta Completa |
| :--- | :--- | :--- |
| **Registrar Categoría** | `POST` | `/api/v1/categoria/registrar` |
| **Registrar Plato** | `POST` | `/api/v1/platos/registrar` |
| **Modificar Restaurante** | `PATCH` | `/api/v1/restaurantes/{id}` |
| **Eliminar Restaurante** | `DELETE` | `/api/v1/restaurantes/{id}` |