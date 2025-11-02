const API_BASE = "http://localhost:4000/api/v1";
const token = localStorage.getItem("token");
let usuarioId = null;

// Variables globales para el modal de edición
let currentEditId = null;
let currentEditRestauranteId = null;

// Variables para búsqueda
let todosLosRestaurantes = [];
let todosLosPlatos = [];

console.log("usuario.js cargado, token:", token ? "✅" : "❌");

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async () => {
  console.log("DOM cargado en usuario.js");

  if (!token) {
    console.error("No hay token, redirigiendo");
    mostrarToast('❌ No has iniciado sesión', 'error');
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1500);
    return;
  }

  try {
    const user = await verificarSesion();
    if (user) {
      usuarioId = user._id || user.id;
      console.log("Usuario ID:", usuarioId);
      await cargarRestaurantes();
      await cargarReseñasUsuario();
      inicializarBusqueda();
    }
  } catch (error) {
    console.error('Error en inicialización:', error);
  }
});

// ===== INICIALIZAR BÚSQUEDA =====
function inicializarBusqueda() {
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      realizarBusqueda(query);
    });
  }

  // Los botones de filtro ahora controlan qué se muestra
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      aplicarFiltro(filter);
    });
  });
}

// ===== REALIZAR BÚSQUEDA =====
function realizarBusqueda(query) {
  if (!query) {
    const filterActivo = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
    aplicarFiltro(filterActivo);
    return;
  }

  const restaurantesContainer = document.getElementById('restaurantesContainer');

  // 1. Buscar restaurantes directamente
  const restaurantesPorNombre = todosLosRestaurantes.filter(({ restaurante }) => {
    if (!restaurante) return false;
    const nombre = (restaurante.nombre || '').toLowerCase();
    const categoria = (restaurante.categoria || '').toLowerCase();
    const descripcion = (restaurante.descripcion || '').toLowerCase();
    const ubicacion = (restaurante.ubicacion || '').toLowerCase();

    return nombre.includes(query) || categoria.includes(query) ||
      descripcion.includes(query) || ubicacion.includes(query);
  });

  // 2. Buscar platos y obtener sus restaurantes
  const platosEncontrados = todosLosPlatos.filter(plato => {
    const nombre = (plato.nombre || '').toLowerCase();
    const descripcion = (plato.descripcion || '').toLowerCase();
    const categoria = (plato.categoria || '').toLowerCase();

    return nombre.includes(query) || descripcion.includes(query) || categoria.includes(query);
  });

  // 3. Obtener IDs únicos de restaurantes que tienen los platos encontrados
  const idsRestaurantesDePlatos = [...new Set(
    platosEncontrados
      .map(plato => plato.restauranteId?.toString())
      .filter(id => id)
  )];

  console.log("IDs de restaurantes con platos encontrados:", idsRestaurantesDePlatos);

  // 4. Obtener restaurantes completos basados en los platos encontrados
  const restaurantesPorPlatos = todosLosRestaurantes.filter(({ restaurante }) => {
    if (!restaurante) return false;
    const restauranteId = (restaurante._id || restaurante.id)?.toString();
    
    // Comparar IDs como strings
    const tieneElPlato = idsRestaurantesDePlatos.includes(restauranteId);
    
    if (tieneElPlato) {
      console.log(`Restaurante encontrado por plato: ${restaurante.nombre} (ID: ${restauranteId})`);
    }
    
    return tieneElPlato;
  });

  // 5. Combinar sin duplicados
  const todosRestaurantesEncontrados = [...restaurantesPorNombre];
  restaurantesPorPlatos.forEach(rest => {
    const yaExiste = todosRestaurantesEncontrados.some(
      r => {
        const id1 = (r.restaurante._id || r.restaurante.id)?.toString();
        const id2 = (rest.restaurante._id || rest.restaurante.id)?.toString();
        return id1 === id2;
      }
    );
    if (!yaExiste) {
      todosRestaurantesEncontrados.push(rest);
    }
  });

  console.log(`Total restaurantes encontrados: ${todosRestaurantesEncontrados.length}`);
  mostrarResultadosBusqueda(todosRestaurantesEncontrados, platosEncontrados, query);
}

// ===== MOSTRAR RESULTADOS DE BÚSQUEDA =====
function mostrarResultadosBusqueda(restaurantes, platos, query) {
  const restaurantesContainer = document.getElementById('restaurantesContainer');
  restaurantesContainer.innerHTML = '';

  // Header de resultados
  const header = document.createElement('div');
  header.style.cssText = 'margin-bottom: 24px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; color: white;';
  header.innerHTML = `
    <h3 style="margin: 0 0 8px 0; font-size: 1.4rem;">🔍 Resultados para: "${query}"</h3>
    <p style="margin: 0; opacity: 0.9; font-size: 1rem;">${restaurantes.length} restaurantes y ${platos.length} platos encontrados</p>
  `;
  restaurantesContainer.appendChild(header);

  // Mostrar restaurantes encontrados
  if (restaurantes.length > 0) {
    const restaurantesSection = document.createElement('div');
    restaurantesSection.innerHTML = '<h4 style="margin: 20px 0 16px 0; color: #1e293b; font-size: 1.3rem; font-weight: 700;">🍽️ Restaurantes</h4>';
    restaurantesContainer.appendChild(restaurantesSection);

    // Dentro del forEach de restaurantes encontrados:
    restaurantes.forEach(({ restaurante, score }, index) => {
      if (!restaurante) return;

      const restauranteId = (restaurante._id || restaurante.id).toString(); // Asegurar que sea string
      const platosDeEsteRestaurante = platos.filter(plato =>
        plato.restauranteId === restauranteId || plato.restauranteId === restauranteId.toString()
      );

      const card = crearTarjetaRestaurante(restaurante, score, index, platosDeEsteRestaurante, query);
      restaurantesContainer.appendChild(card);
    });
  }

  // Mostrar platos encontrados
  if (platos.length > 0) {
    const platosSection = document.createElement('div');
    platosSection.innerHTML = '<h4 style="margin: 30px 0 16px 0; color: #1e293b; font-size: 1.3rem; font-weight: 700;">🍕 Platos</h4>';
    restaurantesContainer.appendChild(platosSection);

    platos.forEach((plato, index) => {
      const card = crearTarjetaPlato(plato, index);
      restaurantesContainer.appendChild(card);
    });
  }

  // Si no hay resultados
  if (restaurantes.length === 0 && platos.length === 0) {
    restaurantesContainer.innerHTML += `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 4rem; margin-bottom: 16px;">🔍</div>
        <h3 style="color: #64748b; font-size: 1.3rem; margin-bottom: 8px;">No se encontraron resultados</h3>
        <p style="color: #94a3b8; font-size: 1rem;">Intenta con otros términos de búsqueda</p>
      </div>
    `;
  }
}

// ===== APLICAR FILTRO =====
function aplicarFiltro(filter) {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = ''; // Limpiar búsqueda

  if (filter === 'all') {
    cargarRestaurantes();
  } else if (filter === 'restaurantes') {
    mostrarSoloRestaurantes();
  } else if (filter === 'reseñas') {
    // Este filtro ahora muestra platos en lugar de reseñas
    mostrarSoloPlatos();
  }
}

// ===== MOSTRAR SOLO RESTAURANTES =====
function mostrarSoloRestaurantes() {
  const restaurantesContainer = document.getElementById('restaurantesContainer');
  restaurantesContainer.innerHTML = '<h3 style="margin-bottom: 20px; color: #667eea; font-size: 1.5rem; font-weight: 700;">🍽️ Todos los Restaurantes</h3>';

  if (todosLosRestaurantes.length === 0) {
    restaurantesContainer.innerHTML += '<p style="color: #64748b; text-align: center; padding: 40px;">No hay restaurantes disponibles.</p>';
    return;
  }

  todosLosRestaurantes.forEach(({ restaurante, score }, index) => {
    if (!restaurante) return;
    const card = crearTarjetaRestaurante(restaurante, score, index);
    restaurantesContainer.appendChild(card);
  });
}

// ===== MOSTRAR SOLO PLATOS =====
function mostrarSoloPlatos() {
  const restaurantesContainer = document.getElementById('restaurantesContainer');
  restaurantesContainer.innerHTML = '<h3 style="margin-bottom: 20px; color: #667eea; font-size: 1.5rem; font-weight: 700;">🍕 Todos los Platos</h3>';

  if (todosLosPlatos.length === 0) {
    restaurantesContainer.innerHTML += '<p style="color: #64748b; text-align: center; padding: 40px;">No hay platos disponibles.</p>';
    return;
  }

  todosLosPlatos.forEach((plato, index) => {
    const card = crearTarjetaPlato(plato, index);
    restaurantesContainer.appendChild(card);
  });
}

// ===== CREAR TARJETA DE RESTAURANTE =====
// Agrega estos parámetros: platosCoincidentes = [], query = ''
function crearTarjetaRestaurante(restaurante, score, index, platosCoincidentes = [], query = '') {
  const card = document.createElement("div");
  card.className = "restaurante-card";
  card.style.animationDelay = `${index * 0.1}s`;

  const imagen = restaurante.imagen || restaurante.imagenUrl || '';

  // AGREGAR ESTE BLOQUE NUEVO:
  let platosHTML = '';
  if (platosCoincidentes && platosCoincidentes.length > 0) {
    platosHTML = `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #e2e8f0;">
        <p style="margin: 0 0 8px 0; color: #667eea; font-weight: 600; font-size: 0.9rem;">🍕 Platos que coinciden:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${platosCoincidentes.slice(0, 3).map(plato => `
            <span style="background: #fbbf24; color: #78350f; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
              ${plato.nombre}
            </span>
          `).join('')}
          ${platosCoincidentes.length > 3 ? `
            <span style="background: #e2e8f0; color: #64748b; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
              +${platosCoincidentes.length - 3} más
            </span>
          ` : ''}
        </div>
      </div>
    `;
  }

  card.innerHTML = `
    ${imagen ? `` : ''}
    <h3 style="font-size: 1.3rem; margin-bottom: 12px;">🍽️ ${restaurante.nombre}</h3>
    <p><strong>Rating:</strong> ⭐ ${score ? score.toFixed(1) : 'N/A'}</p>
    <p><strong>Categoría:</strong> ${restaurante.categoria || 'Sin categoría'}</p>
    <p><strong>Ubicación:</strong> ${restaurante.ubicacion || 'No especificada'}</p>
    ${restaurante.descripcion ? `<p style="color: #64748b; margin-top: 8px; font-size: 0.95rem;">${restaurante.descripcion}</p>` : ''}
    ${platosHTML}
    <button class="btn" onclick="verDetalle('${restaurante._id}')" style="margin-top: 16px;">Ver detalle completo</button>
  `;
  return card;
}

// ===== CREAR TARJETA DE PLATO =====
function crearTarjetaPlato(plato, index) {
  const card = document.createElement("div");
  card.className = "restaurante-card";
  card.style.animationDelay = `${index * 0.1}s`;
  card.style.background = 'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)';
  card.style.borderLeft = '5px solid #fbbf24';

  const imagen = plato.imagen || plato.imagenUrl || '';

  card.innerHTML = `
    ${imagen ? `
      <div style="width: 100%; height: 160px; border-radius: 12px; overflow: hidden; margin-bottom: 16px;">
        <img src="${imagen}" 
             alt="${plato.nombre}" 
             style="width: 100%; height: 100%; object-fit: cover;"
             onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);display:flex;align-items:center;justify-content:center;font-size:3rem;\\'>🍕</div>'">
      </div>
    ` : ''}
    <h3 style="font-size: 1.2rem; margin-bottom: 10px; color: #78350f;">🍕 ${plato.nombre}</h3>
    <p style="color: #78350f; margin-bottom: 8px;">${plato.descripcion || 'Sin descripción'}</p>
    <p style="color: #78350f;"><strong>Categoría:</strong> ${plato.categoria || 'Sin categoría'}</p>
    ${plato.restauranteId ? `
      <button class="btn" onclick="verDetalle('${plato.restauranteId}')" style="margin-top: 12px; font-size: 0.9rem; padding: 10px 16px;">
        Ver restaurante
      </button>
    ` : ''}
  `;
  return card;
}

// ===== FUNCIÓN PARA MOSTRAR TOAST (Notificaciones) =====
function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = mensaje;
  toast.className = `toast ${tipo} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ===== VERIFICAR SESIÓN =====
async function verificarSesion() {
  try {
    console.log("Verificando sesión...");

    const res = await fetch(`${API_BASE}/usuarios/verificar-sesion`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error('Sesión inválida');
    }

    const data = await res.json();
    console.log("Datos de usuario:", data);

    // Actualizar UI
    const emailElem = document.getElementById("userEmail");
    const nombreElem = document.getElementById("userNombre");
    const initialElem = document.getElementById("userInitial");

    if (emailElem) emailElem.textContent = data.usuario.email || 'usuario@email.com';
    if (nombreElem) nombreElem.textContent = data.usuario.usuario || data.usuario.nombre || 'Usuario';
    if (initialElem) {
      const nombre = data.usuario.usuario || data.usuario.nombre || 'U';
      initialElem.textContent = nombre.charAt(0).toUpperCase();
    }

    // Guardar ID
    usuarioId = data.usuario._id || data.usuario.id;
    localStorage.setItem("userId", usuarioId);

    return data.usuario;
  } catch (error) {
    console.error('Error en verificación:', error);
    mostrarToast('❌ Sesión inválida. Redirigiendo...', 'error');
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "../index.html";
    }, 1500);
  }
}

// ===== CARGAR RESEÑAS DEL USUARIO =====
async function cargarReseñasUsuario() {
  try {
    console.log("Cargando reseñas del usuario...");
    mostrarCargando('reseñasContainer');

    const res = await fetch(`${API_BASE}/resena/usuario/${usuarioId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const contenedor = document.getElementById("reseñasContainer");

    if (!res.ok) {
      contenedor.innerHTML = '<p style="color: #64748b; text-align: center; padding: 40px;">No tienes reseñas aún. ¡Empieza a compartir tus opiniones!</p>';
      return;
    }

    const data = await res.json();
    console.log("Reseñas del usuario:", data);

    contenedor.innerHTML = "";

    if (!data || data.length === 0) {
      contenedor.innerHTML = '<p style="color: #64748b; text-align: center; padding: 40px;">No tienes reseñas aún. ¡Empieza a compartir tus opiniones!</p>';
      document.getElementById("totalReseñas").textContent = "0";
      return;
    }

    document.getElementById("totalReseñas").textContent = data.length;

    data.forEach((reseña, index) => {
      const card = document.createElement('div');
      card.className = 'reseña-card';
      card.style.animationDelay = `${index * 0.1}s`;

      const restauranteNombre = reseña.restauranteId?.nombre || 'Restaurante desconocido';

      card.innerHTML = `
        <div style="margin-bottom: 12px;">
          <h4 style="color: #1e293b; font-size: 1.1rem; margin-bottom: 8px;">🍽️ ${restauranteNombre}</h4>
          <p style="font-size: 1rem; color: #475569; line-height: 1.6; margin: 10px 0;">"${reseña.comentario}"</p>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 14px; flex-wrap: wrap;">
          <span style="background: #fbbf24; color: #78350f; padding: 6px 12px; border-radius: 16px; font-size: 0.9rem; font-weight: 700;">
            ⭐ ${reseña.calificacion}/5
          </span>
          <span style="color: #64748b; font-size: 0.9rem;">
            📅 ${new Date(reseña.createdAt || Date.now()).toLocaleDateString('es-ES')}
          </span>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap;">
          ${reseña.restauranteId ? `
            <button class="btn" style="padding: 8px 16px; font-size: 0.9rem;" 
              onclick="verDetalle('${reseña.restauranteId._id || reseña.restauranteId}')">
              👁️ Ver restaurante
            </button>
          ` : ''}
          <button class="btn" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 8px 16px; font-size: 0.9rem;" 
            onclick="editarReseña('${reseña._id}', '${reseña.restauranteId?._id || reseña.restauranteId}', \`${reseña.comentario.replace(/`/g, '\\`')}\`, ${reseña.calificacion})">
            ✏️ Editar
          </button>
          <button class="btn secondary" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 8px 16px; font-size: 0.9rem;" 
            onclick="eliminarReseña('${reseña._id}', '${reseña.restauranteId?._id || reseña.restauranteId}')">
            🗑️ Eliminar
          </button>
        </div>
      `;
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error('Error al cargar reseñas:', error);
    const contenedor = document.getElementById("reseñasContainer");
    contenedor.innerHTML = '<p style="color: #64748b; text-align: center; padding: 40px;">No tienes reseñas aún. ¡Empieza a compartir tus opiniones!</p>';
  }
}

// ===== CARGAR RESTAURANTES =====
async function cargarRestaurantes() {
  try {
    console.log("Cargando restaurantes...");
    mostrarCargando('restaurantesContainer');

    const res = await fetch(`${API_BASE}/ranking/ranking`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Error al cargar restaurantes');

    const data = await res.json();
    console.log("Restaurantes cargados:", data.length);

    // Guardar en variable global para búsqueda
    todosLosRestaurantes = data;

    // Cargar también todos los platos
    await cargarTodosLosPlatos();

    const contenedor = document.getElementById("restaurantesContainer");
    contenedor.innerHTML = "";

    if (!data || data.length === 0) {
      contenedor.innerHTML = '<p style="color: #64748b;">No hay restaurantes disponibles.</p>';
      return;
    }

    document.getElementById("totalRestaurantes").textContent = data.length;

    // Añadir filtros de categoría
    const categorias = [...new Set(data.map(item => item.restaurante?.categoria).filter(Boolean))];

    if (categorias.length > 0) {
      const filterSection = document.createElement('div');
      filterSection.className = 'filter-section';
      filterSection.style.marginBottom = '24px';
      filterSection.innerHTML = `
        <button class="filter-btn active" onclick="cargarRestaurantes()">Todos</button>
        ${categorias.map(cat => `
          <button class="filter-btn" onclick="filtrarPorCategoria('${cat.replace(/'/g, "\\'")}')">${cat}</button>
        `).join('')}
      `;
      contenedor.appendChild(filterSection);
    }

    // Mostrar restaurantes
    data.forEach(({ restaurante, score }, index) => {
      if (!restaurante) return;
      const card = crearTarjetaRestaurante(restaurante, score, index);
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error('Error al cargar restaurantes:', error);
    const contenedor = document.getElementById("restaurantesContainer");
    contenedor.innerHTML = '<p style="color: #ef4444;">Error al cargar restaurantes. Intenta de nuevo.</p>';
  }
}

// ===== CARGAR TODOS LOS PLATOS =====
async function cargarTodosLosPlatos() {
  try {
    const res = await fetch(`${API_BASE}/platos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      todosLosPlatos = data;
      console.log("Platos cargados:", todosLosPlatos.length);
    }
  } catch (error) {
    console.error('Error al cargar platos:', error);
    todosLosPlatos = [];
  }
}

// ===== FILTRAR POR CATEGORÍA =====
async function filtrarPorCategoria(categoria) {
  try {
    console.log("Filtrando por categoría:", categoria);
    mostrarCargando('restaurantesContainer');

    const res = await fetch(`${API_BASE}/ranking/categoria/${encodeURIComponent(categoria)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Error al filtrar');

    const data = await res.json();
    const contenedor = document.getElementById("restaurantesContainer");
    contenedor.innerHTML = `<h3 style="margin-bottom: 20px; color: #667eea;">📂 ${categoria}</h3>`;

    // Re-añadir filtros
    const allRes = await fetch(`${API_BASE}/ranking/ranking`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const allData = await allRes.json();
    const categorias = [...new Set(allData.map(item => item.restaurante?.categoria).filter(Boolean))];

    const filterSection = document.createElement('div');
    filterSection.className = 'filter-section';
    filterSection.style.marginBottom = '24px';
    filterSection.innerHTML = `
      <button class="filter-btn" onclick="cargarRestaurantes()">Todos</button>
      ${categorias.map(cat => `
        <button class="filter-btn ${cat === categoria ? 'active' : ''}" 
          onclick="filtrarPorCategoria('${cat.replace(/'/g, "\\'")}')">${cat}</button>
      `).join('')}
    `;
    contenedor.appendChild(filterSection);

    if (!data || data.length === 0) {
      contenedor.innerHTML += '<p style="color: #64748b;">No hay restaurantes en esta categoría.</p>';
      return;
    }

    data.forEach(({ restaurante, score }, index) => {
      if (!restaurante) return;
      const card = crearTarjetaRestaurante(restaurante, score, index);
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error('Error al filtrar:', error);
    document.getElementById("restaurantesContainer").innerHTML =
      '<p style="color: #ef4444;">Error al filtrar restaurantes.</p>';
  }
}

// ===== VER DETALLE (MODAL) =====
async function verDetalle(id) {
  try {
    console.log("Cargando detalle del restaurante:", id);

    const modal = document.getElementById('restaurantDetailModal');
    const modalBody = document.getElementById('modalBody');

    // Guardar ID del restaurante en el modal
    modal.setAttribute('data-restaurante-id', id);

    // Mostrar modal con loading
    modal.style.display = 'flex';
    modalBody.innerHTML = `
      <div style="text-align: center; padding: 60px;">
        <div class="loading"></div>
        <p style="color: #64748b; margin-top: 18px; font-size: 1.05rem;">Cargando detalles...</p>
      </div>
    `;

    const res = await fetch(`${API_BASE}/ranking/detalle/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Error al cargar detalles');

    const data = await res.json();
    console.log("Detalles cargados:", data);

    const imagen = data.restaurante.imagen || data.restaurante.imagenUrl || '';

    // Header del restaurante
    modalBody.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
        ${imagen ? `
          <div style="width: 100%; height: 250px; border-radius: 16px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);">
            <img src="${imagen}" 
                 alt="${data.restaurante.nombre}" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.parentElement.style.display='none'">
          </div>
        ` : ''}
        <h2 style="margin: 0 0 16px 0; font-size: 2rem; font-weight: 700;">🪴 ${data.restaurante.nombre}</h2>
        <p style="margin: 8px 0; opacity: 0.95; font-size: 1.1rem; line-height: 1.6;">${data.restaurante.descripcion || 'Sin descripción'}</p>
        <div style="display: flex; gap: 24px; margin-top: 16px; flex-wrap: wrap;">
          <p style="margin: 0; font-size: 1rem;"><strong>📍</strong> ${data.restaurante.ubicacion || 'Sin ubicación'}</p>
          <p style="margin: 0; font-size: 1rem;"><strong>📂</strong> ${data.restaurante.categoria || 'Sin categoría'}</p>
        </div>
      </div>
    `;

    // Mostrar platos con imágenes
    if (data.platos && data.platos.length > 0) {
      modalBody.innerHTML += '<h3 style="margin: 30px 0 20px 0; color: #1e293b; font-size: 1.6rem; font-weight: 700;">🍽️ Menú:</h3>';

      const platosContainer = document.createElement('div');
      platosContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 35px;';

      data.platos.forEach(plato => {
        const imagenPlato = plato.imagen || plato.imagenUrl || '';

        const platoCard = document.createElement('div');
        platoCard.style.cssText = `
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          cursor: pointer;
        `;
        platoCard.innerHTML = `
          ${imagenPlato ? `
            <div style="width: 100%; height: 150px; border-radius: 12px; overflow: hidden; margin-bottom: 14px;">
              <img src="${imagenPlato}" 
                   alt="${plato.nombre}" 
                   style="width: 100%; height: 100%; object-fit: cover;"
                   onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);display:flex;align-items:center;justify-content:center;font-size:2.5rem;\\'>🍕</div>'">
            </div>
          ` : ''}
          <h4 style="margin: 0 0 12px 0; color: #1e293b; font-size: 1.2rem; font-weight: 700;">${plato.nombre}</h4>
          <p style="margin: 8px 0; color: #64748b; font-size: 0.95rem; line-height: 1.6;">${plato.descripcion || 'Sin descripción'}</p>
          <p style="margin: 12px 0 0 0; color: #667eea; font-weight: 600; font-size: 0.95rem;">📂 ${plato.categoria || 'Sin categoría'}</p>
        `;
        platoCard.onmouseover = () => {
          platoCard.style.transform = 'translateY(-4px)';
          platoCard.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)';
          platoCard.style.borderColor = '#667eea';
        };
        platoCard.onmouseout = () => {
          platoCard.style.transform = 'translateY(0)';
          platoCard.style.boxShadow = 'none';
          platoCard.style.borderColor = '#e2e8f0';
        };
        platosContainer.appendChild(platoCard);
      });
      modalBody.appendChild(platosContainer);
    }

    // Formulario para crear reseña
    modalBody.innerHTML += `
      <div style="margin: 35px 0; padding: 32px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 20px; border: 2px solid #e2e8f0; box-shadow: 0 6px 20px rgba(0,0,0,0.06);">
        <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 1.5rem; font-weight: 700;">✏️ Escribe tu reseña</h3>
        <textarea id="nuevoComentario" placeholder="Comparte tu experiencia con este restaurante..." 
          style="width: 100%; padding: 18px; border: 2px solid #e2e8f0; border-radius: 14px; margin-bottom: 16px; min-height: 140px; font-family: inherit; font-size: 1rem; resize: vertical; transition: all 0.3s ease;"></textarea>
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
          <label style="font-weight: 600; color: #475569; font-size: 1.05rem;">Calificación:</label>
          <input type="number" id="nuevaCalificacion" min="1" max="5" placeholder="1-5" 
            style="width: 100px; padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1.1rem; font-weight: 600; text-align: center;">
          <span style="color: #64748b; font-size: 1rem;">⭐ (1 a 5 estrellas)</span>
        </div>
        <button class="btn" onclick="crearReseña('${id}')" style="width: 100%; padding: 16px; font-size: 1.1rem;">Publicar reseña</button>
      </div>
    `;

    // Mostrar reseñas existentes
    if (data.reseñas && data.reseñas.length > 0) {
      modalBody.innerHTML += '<h3 style="margin: 35px 0 20px 0; color: #1e293b; font-size: 1.5rem; font-weight: 700;">💬 Reseñas de usuarios:</h3>';

      data.reseñas.forEach(reseña => {
        const esPropia = reseña.usuarioId === usuarioId ||
          reseña.usuarioId?._id === usuarioId ||
          reseña.usuarioId?.toString() === usuarioId?.toString();

        const nombreUsuario = reseña.usuarioId?.usuario ||
          reseña.usuarioId?.nombre ||
          'Usuario Anónimo';

        const card = document.createElement('div');
        card.className = 'reseña-card';

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
            <div style="flex: 1;">
              <p style="font-size: 1.1rem; margin: 0 0 12px 0; font-weight: 600; color: #1e293b; line-height: 1.6;">"${reseña.comentario}"</p>
              <div style="display: flex; align-items: center; gap: 18px; margin-top: 14px; flex-wrap: wrap;">
                <span style="background: #fbbf24; color: #78350f; padding: 8px 16px; border-radius: 20px; font-size: 1rem; font-weight: 700;">
                  ⭐ ${reseña.calificacion}/5
                </span>
                <span style="color: #64748b; font-size: 1rem; font-weight: 500;">
                  👤 ${nombreUsuario}
                </span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 12px; margin-top: 18px; flex-wrap: wrap; align-items: center;">
            ${esPropia ? `
              <button class="btn" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 10px 20px; font-size: 0.95rem;" 
                onclick="editarReseña('${reseña._id}', '${id}', \`${reseña.comentario.replace(/`/g, '\\`')}\`, ${reseña.calificacion})">
                ✏️ Editar
              </button>
              <button class="btn secondary" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 10px 20px; font-size: 0.95rem;" 
                onclick="eliminarReseña('${reseña._id}', '${id}')">
                🗑️ Eliminar
              </button>
            ` : `
              <div style="display: flex; gap: 10px;">
                <button class="btn-like" onclick="darLike('${reseña._id}')" style="
                  padding: 8px 16px;
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  color: white;
                  border: none;
                  border-radius: 10px;
                  font-size: 0.95rem;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">
                  👍 Like <span style="background: rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 8px;">${reseña.likes?.length || 0}</span>
                </button>
                <button class="btn-dislike" onclick="darDislike('${reseña._id}')" style="
                  padding: 8px 16px;
                  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                  color: white;
                  border: none;
                  border-radius: 10px;
                  font-size: 0.95rem;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">
                  👎 Dislike <span style="background: rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 8px;">${reseña.dislikes?.length || 0}</span>
                </button>
              </div>
            `}
          </div>
        `;
        modalBody.appendChild(card);
      });
    } else {
      modalBody.innerHTML += '<p style="color: #64748b; margin-top: 20px; text-align: center; padding: 40px; background: #f8fafc; border-radius: 16px; font-size: 1.1rem;">No hay reseñas aún. ¡Sé el primero en opinar!</p>';
    }
  } catch (error) {
    console.error('Error al cargar detalles:', error);
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 40px;">Error al cargar detalles del restaurante.</p>';
  }
}

// ===== CERRAR MODAL DE RESTAURANTE =====
function cerrarDetalleRestaurante() {
  const modal = document.getElementById('restaurantDetailModal');
  modal.style.display = 'none';
}

// Cerrar modal al hacer clic fuera del contenido
document.getElementById('restaurantDetailModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'restaurantDetailModal') {
    cerrarDetalleRestaurante();
  }
});

// ===== EDITAR RESEÑA - ABRIR MODAL =====
async function editarReseña(id, restauranteId, comentarioActual, calificacionActual) {
  currentEditId = id;
  currentEditRestauranteId = restauranteId;

  document.getElementById('editComentario').value = comentarioActual;
  document.getElementById('editCalificacion').value = calificacionActual;
  document.getElementById('editReviewModal').style.display = 'flex';
}

// ===== CERRAR MODAL DE EDICIÓN =====
function cerrarEditarModal() {
  document.getElementById('editReviewModal').style.display = 'none';
  currentEditId = null;
  currentEditRestauranteId = null;
}

// ===== GUARDAR EDICIÓN DE RESEÑA =====
async function guardarEdicionReseña() {
  const nuevoComentario = document.getElementById('editComentario').value.trim();
  const nuevaCalificacion = parseInt(document.getElementById('editCalificacion').value);

  if (!nuevoComentario) {
    mostrarToast('❌ El comentario no puede estar vacío', 'error');
    return;
  }

  if (!nuevaCalificacion || nuevaCalificacion < 1 || nuevaCalificacion > 5) {
    mostrarToast('❌ La calificación debe estar entre 1 y 5', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/resena/${currentEditId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        comentario: nuevoComentario,
        calificacion: nuevaCalificacion,
        usuarioId
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al editar');

    mostrarToast('✅ Reseña actualizada exitosamente', 'success');
    cerrarEditarModal();

    if (currentEditRestauranteId) {
      await verDetalle(currentEditRestauranteId);
    }
    await cargarReseñasUsuario();
  } catch (error) {
    console.error('Error al editar:', error);
    mostrarToast('❌ Error: ' + error.message, 'error');
  }
}

// Cerrar modal de edición al hacer clic fuera
document.getElementById('editReviewModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'editReviewModal') {
    cerrarEditarModal();
  }
});

// ===== CREAR RESEÑA =====
async function crearReseña(restauranteId) {
  const comentario = document.getElementById('nuevoComentario')?.value.trim();
  const calificacion = parseInt(document.getElementById('nuevaCalificacion')?.value);

  if (!comentario || !calificacion) {
    mostrarToast('❌ Por favor completa todos los campos', 'error');
    return;
  }

  if (calificacion < 1 || calificacion > 5) {
    mostrarToast('❌ La calificación debe estar entre 1 y 5', 'error');
    return;
  }

  if (!usuarioId) {
    mostrarToast('❌ Error: No se pudo identificar el usuario', 'error');
    return;
  }

  try {
    console.log("Creando reseña:", { restauranteId, comentario, calificacion, usuarioId });

    const res = await fetch(`${API_BASE}/resena/registrar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        restauranteId,
        comentario,
        calificacion,
        usuarioId
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al crear reseña');

    mostrarToast('✅ Reseña creada exitosamente', 'success');

    document.getElementById('nuevoComentario').value = '';
    document.getElementById('nuevaCalificacion').value = '';

    await verDetalle(restauranteId);
    await cargarReseñasUsuario();
  } catch (error) {
    console.error('Error al crear reseña:', error);
    mostrarToast('❌ Error: ' + error.message, 'error');
  }
}

// ===== ELIMINAR RESEÑA =====
async function eliminarReseña(id, restauranteId) {
  // Crear modal de confirmación dinámico
  const confirmDiv = document.createElement('div');
  confirmDiv.className = 'confirm-modal';
  confirmDiv.style.display = 'flex';
  confirmDiv.innerHTML = `
    <div class="confirm-modal-content">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 80px; height: 80px; margin: 0 auto 16px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);">
          🗑️
        </div>
        <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 1.6rem; font-weight: 700;">¿Eliminar Reseña?</h2>
        <p style="color: #64748b; font-size: 1.05rem;">Esta acción no se puede deshacer.</p>
      </div>
      
      <div style="display: flex; gap: 12px;">
        <button class="btn" onclick="ejecutarEliminacion('${id}', '${restauranteId}')" 
          style="flex: 1; padding: 14px; font-size: 1rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
          ✅ Sí, Eliminar
        </button>
        <button class="btn secondary" onclick="this.closest('.confirm-modal').remove()" 
          style="flex: 1; padding: 14px; font-size: 1rem; background: linear-gradient(135deg, #6c757d 0%, #495057 100%);">
          ❌ Cancelar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(confirmDiv);

  // Cerrar al hacer clic fuera
  confirmDiv.addEventListener('click', (e) => {
    if (e.target === confirmDiv) {
      confirmDiv.remove();
    }
  });
}

// ===== EJECUTAR ELIMINACIÓN =====
async function ejecutarEliminacion(id, restauranteId) {
  try {
    const res = await fetch(`${API_BASE}/resena/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ usuarioId }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al eliminar');

    mostrarToast('✅ Reseña eliminada exitosamente', 'success');

    // Cerrar modal de confirmación
    document.querySelector('.confirm-modal')?.remove();

    if (restauranteId) {
      await verDetalle(restauranteId);
    }
    await cargarReseñasUsuario();
  } catch (error) {
    console.error('Error al eliminar:', error);
    mostrarToast('❌ Error: ' + error.message, 'error');
  }
}

// ===== DAR LIKE =====
async function darLike(reseñaId) {
  if (!usuarioId) {
    mostrarToast('❌ Debes iniciar sesión para dar like', 'error');
    return;
  }

  try {
    console.log("Dando like a reseña:", reseñaId);

    const res = await fetch(`${API_BASE}/resena/${reseñaId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ usuarioId }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al dar like');

    // Recargar el modal para ver los cambios
    const modal = document.getElementById('restaurantDetailModal');
    if (modal.style.display === 'flex') {
      const restauranteId = modal.getAttribute('data-restaurante-id');
      if (restauranteId) {
        await verDetalle(restauranteId);
      }
    }
  } catch (error) {
    console.error('Error al dar like:', error);
    mostrarToast('❌ Error: ' + error.message, 'error');
  }
}

// ===== DAR DISLIKE =====
async function darDislike(reseñaId) {
  if (!usuarioId) {
    mostrarToast('❌ Debes iniciar sesión para dar dislike', 'error');
    return;
  }

  try {
    console.log("Dando dislike a reseña:", reseñaId);

    const res = await fetch(`${API_BASE}/resena/${reseñaId}/dislike`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ usuarioId }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al dar dislike');

    // Recargar el modal para ver los cambios
    const modal = document.getElementById('restaurantDetailModal');
    if (modal.style.display === 'flex') {
      const restauranteId = modal.getAttribute('data-restaurante-id');
      if (restauranteId) {
        await verDetalle(restauranteId);
      }
    }
  } catch (error) {
    console.error('Error al dar dislike:', error);
    mostrarToast('❌ Error: ' + error.message, 'error');
  }
}

// ===== MOSTRAR CARGANDO =====
function mostrarCargando(containerId) {
  const contenedor = document.getElementById(containerId);
  if (contenedor) {
    contenedor.innerHTML = `
      <div style="text-align: center; padding: 50px;">
        <div class="loading"></div>
        <p style="color: #64748b; margin-top: 18px; font-size: 1.05rem;">Cargando...</p>
      </div>
    `;
  }
}

// ===== LOGOUT - MOSTRAR CONFIRMACIÓN =====
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  document.getElementById('logoutConfirmModal').style.display = 'flex';
});

function cerrarLogoutModal() {
  document.getElementById('logoutConfirmModal').style.display = 'none';
}

function confirmarLogout() {
  localStorage.clear();
  mostrarToast('👋 Sesión cerrada exitosamente', 'info');
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 1000);
}

// Cerrar modal de logout al hacer clic fuera
document.getElementById('logoutConfirmModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'logoutConfirmModal') {
    cerrarLogoutModal();
  }
});

console.log("✅ usuario.js: Configurado correctamente");