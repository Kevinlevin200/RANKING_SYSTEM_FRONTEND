<!-- RANKING SYSTEM FRONTEND README -->
<p align="center">
  <img src="https://img.shields.io/badge/Proyecto%20Final-Ranking%20System-3b82f6?style=for-the-badge&logo=starship&logoColor=white" alt="Ranking System Badge">
</p>

<h1 align="center">🍽️ RANKING SYSTEM — Frontend</h1>

<p align="center">
  <b>Aplicación web para la clasificación y valoración de restaurantes.</b><br>
  Proyecto académico desarrollado con HTML, CSS y JavaScript puro.<br><br>
  <a href="https://github.com/Kevinlevin200/RANKING_SYSTEM_FRONTEND">
    <img src="https://img.shields.io/badge/GitHub-Kevinlevin200%2FRANKING__SYSTEM__FRONTEND-black?style=flat&logo=github">
  </a>
  <a href="https://github.com/Kevinlevin200/RANKING_SYSTEM_BACKEND">
    <img src="https://img.shields.io/badge/Backend-RANKING__SYSTEM__BACKEND-16a34a?style=flat&logo=node.js">
  </a>
  <a href="http://localhost:4000/api/v1/docs">
    <img src="https://img.shields.io/badge/API%20Docs-Swagger%20UI-ffb703?style=flat&logo=swagger">
  </a>
</p>

---

## 🧭 Descripción General

El **Ranking System Frontend** es la capa de presentación del proyecto **Ranking System**, una plataforma que permite a los usuarios **explorar, calificar y reseñar restaurantes y platos** de forma dinámica e interactiva.

La aplicación se comunica directamente con la API REST del backend, mostrando en tiempo real la información de restaurantes, rankings, categorías y valoraciones.


---

## 🧰 Tecnologías Utilizadas

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-e34f26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/CSS3-264de4?style=for-the-badge&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-f7df1e?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/Fetch%20API-0a9396?style=for-the-badge&logo=api&logoColor=white">
</p>

| Tecnología | Propósito |
|-------------|------------|
| **HTML5 / CSS3 / JS (Vanilla)** | Construcción de una interfaz limpia y ligera sin frameworks. |
| **Fetch API** | Comunicación con el backend mediante peticiones HTTP. |
| **JWT Tokens** | Manejo de sesiones seguras y autenticación. |
| **Live Server (VS Code)** | Servidor local para desarrollo rápido. |

---

## ⚙️ Estructura del Proyecto

📂 RANKING_SYSTEM_FRONTEND
├── 📁 assets/ → Recursos gráficos (imágenes, íconos)
├── 📁 css/ → Hojas de estilo personalizadas
├── 📁 js/ → Lógica del cliente (fetch, JWT, manejo del DOM)
├── index.html → Página principal
└── README.md

yaml
Copiar código

---

## 🚀 Ejecución Local

### 1️⃣ Requisitos Previos
- Tener el **RANKING_SYSTEM_BACKEND** ejecutándose en:  
  `http://localhost:4000/api/v1`

### 2️⃣ Clonar el Repositorio

```bash
git clone https://github.com/Kevinlevin200/RANKING_SYSTEM_FRONTEND.git
cd RANKING_SYSTEM_FRONTEND
3️⃣ Iniciar Servidor Local
Recomendado: Extensión Live Server (VS Code).

Alternativo: python3 -m http.server 5500.

Directo: abrir index.html (⚠️ puede causar errores CORS).

💡 Verifica que las URLs base en los archivos js/ apunten correctamente al backend.

🌐 Integración con la API (Backend)
El frontend se comunica con la API REST del backend:

bash
Copiar código
BASE_URL = http://localhost:4000/api/v1
🔒 Usuarios y Autenticación
Acción	Método	Endpoint	Autenticación
Registro	POST	/usuarios/registrar	Pública
Login	POST	/usuarios/login	Pública
Verificar Sesión	GET	/usuarios/verificar-sesion	JWT
Cambiar Contraseña	PATCH	/usuarios/cambiar-contraseña	JWT

🍽️ Restaurantes y Platos
Acción	Método	Endpoint	Parámetros
Listar Restaurantes	GET	/restaurantes	—
Restaurante por ID	GET	/restaurantes/{id}	:id
Listar Platos	GET	/platos	—
Platos por Restaurante	GET	/platos/restaurante/{restauranteId}	:restauranteId

⭐ Reseñas e Interacciones
Acción	Método	Endpoint	Autenticación
Crear Reseña	POST	/resena/registrar	JWT
Reseñas del Usuario	GET	/resena/usuario/{usuarioId}	JWT
Like	POST	/resena/{id}/like	JWT
Dislike	POST	/resena/{id}/dislike	JWT

📊 Ranking y Consultas
Acción	Método	Endpoint	Parámetros
Ranking General	GET	/ranking/ranking	—
Ranking por Categoría	GET	/ranking/categoria/{categoria}	:categoria
Detalle de Restaurante	GET	/ranking/detalle/{id}	:id

🧑‍💼 Funciones Administrativas
Acción	Método	Endpoint	Rol
Registrar Categoría	POST	/categoria/registrar	Admin
Registrar Plato	POST	/platos/registrar	Admin
Modificar Restaurante	PATCH	/restaurantes/{id}	Admin
Eliminar Restaurante	DELETE	/restaurantes/{id}	Admin

📘 Documentación y Recursos
📄 Swagger UI: API Docs Local

🖥️ Repositorio Backend: RANKING_SYSTEM_BACKEND

💾 Base de Datos: MongoDB Atlas

⚙️ Lenguaje Backend: Node.js con Express y MongoDB Driver





> Autores: 
- juan camilo rojas arenas
- kevin santiago rivero rueda
- connie tatiana carrillo bohorquez
