const API_BASE = "https://ranking-system-backend.onrender.com";
const token = localStorage.getItem("token");
let adminId = null;
let editandoCategoria = false;
let editandoRestaurante = false;
let editandoPlato = false;

// Variables para el modal de confirmación
let elementoAEliminar = null;
let tipoElementoAEliminar = null;
let accionPendiente = null; // 'eliminar' o 'desactivar'
let callbackConfirmacion = null;

console.log("admin.js cargado, token:", token ? "✅ Presente" : "❌ Ausente");

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async () => {
  console.log("DOM Cargado en admin.js");
  
  if (!token) {
    console.error("No hay token, redirigiendo al login");
    alert('No has iniciado sesión');
    window.location.href = "../index.html";
    return;
  }

  try {
    console.log("Verificando sesión de admin...");
    const usuario = await verificarSesionAdmin();
    
    if (!usuario) {
      console.error("No es admin, redirigiendo");
      alert('Acceso denegado. Solo administradores.');
      localStorage.clear();
      window.location.href = "../index.html";
      return;
    }

    console.log("Usuario admin verificado:", usuario);
    
    // Cargar datos
    await Promise.all([
      cargarCategorias(),
      cargarRestaurantes(),
      cargarPlatos(),
      cargarPendientes()
    ]);
    
    configurarTabs();
    configurarFormularios();
    
    console.log("✅ Admin panel completamente cargado");
  } catch (error) {
    console.error('Error en inicialización:', error);
    alert('Error al cargar el panel de administración');
  }
});

// ===== VERIFICACIÓN DE SESIÓN =====
async function verificarSesionAdmin() {
  try {
    console.log("🔍 Verificando sesión con token:", token ? "✅" : "❌");
    
    const res = await fetch(`${API_BASE}/usuarios/verificar-sesion`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("📥 Respuesta verificación:", res.status);

    if (!res.ok) {
      console.error("❌ Sesión inválida, status:", res.status);
      return null;
    }

    const data = await res.json();
    const usuario = data.usuario || data;
    const tipo = usuario.tipo;
    
    console.log("🎯 Tipo detectado:", tipo);
    
    if (tipo !== 'admin') {
      console.error("❌ Acceso denegado - Tipo de usuario:", tipo);
      return null;
    }

    console.log("✅ Acceso permitido - Tipo:", tipo);

    // Actualizar UI
    const nombreElemento = document.getElementById("adminNombre");
    if (nombreElemento) {
      nombreElemento.textContent = usuario.usuario || usuario.nombre || 'Admin';
    }
    
    adminId = usuario._id || usuario.id;
    localStorage.setItem("userId", adminId);
    localStorage.setItem("userTipo", tipo);

    return usuario;
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    return null;
  }
}

// ===== SISTEMA DE TABS =====
function configurarTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`)?.classList.add('active');
    });
  });
}

// ===== CATEGORÍAS =====
async function cargarCategorias() {
  try {
    console.log("📂 Cargando categorías...");
    
    const res = await fetch(`${API_BASE}/categoria/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar categorías');

    const categorias = await res.json();
    console.log("✅ Categorías cargadas:", categorias.length);
    
    const tbody = document.getElementById('categoriasTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!categorias || categorias.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #64748b;">No hay categorías registradas</td></tr>';
      return;
    }

    categorias.forEach(cat => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td><strong>${cat.nombre}</strong></td>
        <td>
          <div class="action-buttons">
            <button class="btn-small btn-edit" onclick="editarCategoria('${cat._id}', '${cat.nombre.replace(/'/g, "\\'")}')">✏️ Editar</button>
            <button class="btn-small btn-delete" onclick="eliminarCategoriaDirecto('${cat._id}', '${cat.nombre.replace(/'/g, "\\'")}')">🗑️ Eliminar</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    actualizarSelectCategorias(categorias);
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    mostrarNotificacion('Error al cargar categorías', 'error');
  }
}

function actualizarSelectCategorias(categorias) {
  const select = document.getElementById('restauranteCategoria');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecciona una categoría</option>';
  categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.nombre;
    option.textContent = cat.nombre;
    select.appendChild(option);
  });
}

// ===== MODAL CATEGORÍA =====
function abrirModalCategoria() {
  editandoCategoria = false;
  document.getElementById('modalCategoriaTitulo').textContent = 'Nueva Categoría';
  document.getElementById('categoriaForm')?.reset();
  document.getElementById('categoriaId').value = '';
  document.getElementById('modalCategoria')?.classList.add('active');
}

function cerrarModalCategoria() {
  document.getElementById('modalCategoria')?.classList.remove('active');
}

function editarCategoria(id, nombre) {
  editandoCategoria = true;
  document.getElementById('modalCategoriaTitulo').textContent = 'Editar Categoría';
  document.getElementById('categoriaId').value = id;
  document.getElementById('categoriaNombre').value = nombre;
  document.getElementById('modalCategoria')?.classList.add('active');
}

async function guardarCategoria(e) {
  e.preventDefault();
  
  const id = document.getElementById('categoriaId')?.value;
  const datos = {
    nombre: document.getElementById('categoriaNombre')?.value.trim()
  };

  if (!datos.nombre) {
    mostrarNotificacion('El nombre es obligatorio', 'error');
    return;
  }

  try {
    const url = editandoCategoria 
      ? `${API_BASE}/categoria/${id}` 
      : `${API_BASE}/categoria/registrar`;
    
    const method = editandoCategoria ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datos)
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al guardar categoría');

    mostrarNotificacion(`✅ Categoría ${editandoCategoria ? 'actualizada' : 'creada'} exitosamente`, 'success');
    cerrarModalCategoria();
    await cargarCategorias();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message, 'error');
  }
}

function eliminarCategoriaDirecto(id, nombre) {
  mostrarModalConfirmacion(
    'eliminar',
    'categoría',
    nombre,
    `Los restaurantes asociados perderán esta categoría.`,
    () => eliminarCategoria(id)
  );
}

async function eliminarCategoria(id) {
  try {
    const res = await fetch(`${API_BASE}/categoria/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al eliminar');

    mostrarNotificacion('✅ Categoría eliminada exitosamente', 'success');
    await cargarCategorias();
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    mostrarNotificacion('❌ ' + error.message, 'error');
  }
}

// ===== RESTAURANTES =====
async function cargarRestaurantes() {
  try {
    console.log("🍽️ Cargando restaurantes como ADMIN...");
    console.log("🔑 Token presente:", token ? "SÍ" : "NO");
    
    const res = await fetch(`${API_BASE}/restaurantes/`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("📥 Status de respuesta:", res.status);

    if (!res.ok) {
      const errorData = await res.json();
      console.error("❌ Error del servidor:", errorData);
      throw new Error('Error al cargar restaurantes');
    }

    const restaurantes = await res.json();
    console.log("✅ Restaurantes recibidos:", restaurantes.length);
    console.log("📊 Detalle:", restaurantes.map(r => ({ 
      nombre: r.nombre, 
      aprobado: r.aprobado 
    })));
    
    const tbody = document.getElementById('restaurantesTableBody');
    if (!tbody) {
      console.error("❌ No se encontró el tbody de restaurantes");
      return;
    }
    
    tbody.innerHTML = '';

    if (!restaurantes || restaurantes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay restaurantes</td></tr>';
      return;
    }

    restaurantes.forEach(rest => {
      const tr = document.createElement('tr');
      
      // Determinar el estado del restaurante
      let estadoBadge = '';
      if (rest.aprobado === true) {
        estadoBadge = '<span class="badge badge-approved">✓ Activo</span>';
      } else {
        estadoBadge = '<span class="badge badge-pending">⏳ Inactivo</span>';
      }
      
      tr.innerHTML = `
        <td><strong>${rest.nombre}</strong></td>
        <td>${rest.categoria || 'Sin categoría'}</td>
        <td>${rest.ubicacion || 'N/A'}</td>
        <td>${estadoBadge}</td>
        <td>
          <div class="action-buttons">
            ${rest.aprobado !== true ? `<button class="btn-small btn-approve" onclick="aprobarRestaurante('${rest._id}')">✓ Activar</button>` : ''}
            ${rest.aprobado === true ? `<button class="btn-small" style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); color: white;" onclick="desactivarRestaurante('${rest._id}')">⏸️ Desactivar</button>` : ''}
            <button class="btn-small btn-edit" onclick="editarRestaurante('${rest._id}')">✏️</button>
            <button class="btn-small btn-delete" onclick="eliminarRestauranteDirecto('${rest._id}', '${rest.nombre.replace(/'/g, "\\'")}')">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    actualizarSelectRestaurantes(restaurantes);
    
    console.log("✅ Tabla de restaurantes actualizada");
  } catch (error) {
    console.error('❌ Error al cargar restaurantes:', error);
    mostrarNotificacion('Error al cargar restaurantes', 'error');
  }
}

function actualizarSelectRestaurantes(restaurantes) {
  const select = document.getElementById('platoRestaurante');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecciona un restaurante</option>';
  restaurantes.forEach(rest => {
    const option = document.createElement('option');
    option.value = rest._id;
    option.textContent = rest.nombre;
    select.appendChild(option);
  });
}

function abrirModalRestaurante() {
  editandoRestaurante = false;
  document.getElementById('modalRestauranteTitulo').textContent = 'Nuevo Restaurante';
  document.getElementById('restauranteForm')?.reset();
  document.getElementById('restauranteId').value = '';
  document.getElementById('modalRestaurante')?.classList.add('active');
}

function cerrarModalRestaurante() {
  document.getElementById('modalRestaurante')?.classList.remove('active');
}

async function editarRestaurante(id) {
  try {
    const res = await fetch(`${API_BASE}/restaurantes/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar restaurante');

    const rest = await res.json();
    
    editandoRestaurante = true;
    document.getElementById('modalRestauranteTitulo').textContent = 'Editar Restaurante';
    document.getElementById('restauranteId').value = rest._id;
    document.getElementById('restauranteNombre').value = rest.nombre;
    document.getElementById('restauranteDescripcion').value = rest.descripcion || '';
    document.getElementById('restauranteCategoria').value = rest.categoria || '';
    document.getElementById('restauranteUbicacion').value = rest.ubicacion || '';
    document.getElementById('restauranteImagen').value = rest.imagen || '';
    
    document.getElementById('modalRestaurante')?.classList.add('active');
  } catch (error) {
    mostrarNotificacion('Error al cargar restaurante', 'error');
  }
}

async function guardarRestaurante(e) {
  e.preventDefault();

  const id = document.getElementById('restauranteId')?.value;
  const datos = {
    nombre: document.getElementById('restauranteNombre')?.value.trim(),
    descripcion: document.getElementById('restauranteDescripcion')?.value.trim(),
    categoria: document.getElementById('restauranteCategoria')?.value,
    ubicacion: document.getElementById('restauranteUbicacion')?.value.trim(),
    imagen: document.getElementById('restauranteImagen')?.value.trim(),
    aprobado: true
  };

  try {
    const url = editandoRestaurante 
      ? `${API_BASE}/restaurantes/${id}` 
      : `${API_BASE}/restaurantes/registrar`;
    
    const method = editandoRestaurante ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datos)
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al guardar');

    mostrarNotificacion(`✅ Restaurante ${editandoRestaurante ? 'actualizado' : 'creado'}`, 'success');
    cerrarModalRestaurante();
    await cargarRestaurantes();
    await cargarPendientes();
  } catch (error) {
    mostrarNotificacion(error.message, 'error');
  }
}

async function aprobarRestaurante(id) {
  try {
    const res = await fetch(`${API_BASE}/restaurantes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ aprobado: true })
    });

    if (!res.ok) throw new Error('Error al activar');

    mostrarNotificacion('✅ Restaurante activado', 'success');
    await cargarRestaurantes();
    await cargarPendientes();
  } catch (error) {
    mostrarNotificacion(error.message, 'error');
  }
}

async function desactivarRestaurante(id) {
  // Obtener el nombre del restaurante
  const res = await fetch(`${API_BASE}/restaurantes/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (res.ok) {
    const rest = await res.json();
    mostrarModalConfirmacion(
      'desactivar',
      'restaurante',
      rest.nombre,
      `Dejará de aparecer en búsquedas y listados públicos.`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/restaurantes/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ aprobado: false })
          });

          if (!res.ok) throw new Error('Error al desactivar');

          mostrarNotificacion('✅ Restaurante desactivado', 'success');
          await cargarRestaurantes();
          await cargarPendientes();
        } catch (error) {
          mostrarNotificacion(error.message, 'error');
        }
      }
    );
  }
}

function eliminarRestauranteDirecto(id, nombre) {
  mostrarModalConfirmacion(
    'eliminar',
    'restaurante',
    nombre,
    `También se eliminarán todos sus platos y reseñas asociados.`,
    () => eliminarRestaurante(id)
  );
}

async function eliminarRestaurante(id) {
  try {
    const res = await fetch(`${API_BASE}/restaurantes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al eliminar');

    mostrarNotificacion('✅ Restaurante eliminado exitosamente', 'success');
    await cargarRestaurantes();
    await cargarPendientes();
  } catch (error) {
    console.error('Error al eliminar restaurante:', error);
    mostrarNotificacion('❌ ' + error.message, 'error');
  }
}

// ===== PLATOS =====
async function cargarPlatos() {
  try {
    console.log("🍕 Cargando platos...");
    
    const res = await fetch(`${API_BASE}/platos/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar platos');

    const platos = await res.json();
    console.log("✅ Platos cargados:", platos.length);
    
    const tbody = document.getElementById('platosTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!platos || platos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay platos registrados</td></tr>';
      return;
    }

    // Cargar restaurantes para mostrar nombres
    const restaurantesRes = await fetch(`${API_BASE}/restaurantes/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const restaurantes = restaurantesRes.ok ? await restaurantesRes.json() : [];
    
    // Crear mapa de restaurantes por ID
    const restaurantesMap = {};
    restaurantes.forEach(r => {
      restaurantesMap[r._id] = r.nombre;
    });

    platos.forEach(plato => {
      const nombreRestaurante = restaurantesMap[plato.restauranteId] || 'Restaurante desconocido';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${plato.nombre}</strong></td>
        <td>${nombreRestaurante}</td>
        <td>${plato.categoria || 'N/A'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-small btn-edit" onclick="editarPlato('${plato._id}')">✏️</button>
            <button class="btn-small btn-delete" onclick="eliminarPlatoDirecto('${plato._id}', '${plato.nombre.replace(/'/g, "\\'")}')">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error('Error al cargar platos:', error);
    mostrarNotificacion('Error al cargar platos', 'error');
  }
}

function abrirModalPlato() {
  editandoPlato = false;
  document.getElementById('modalPlatoTitulo').textContent = 'Nuevo Plato';
  document.getElementById('platoForm')?.reset();
  document.getElementById('platoId').value = '';
  document.getElementById('modalPlato')?.classList.add('active');
}

function cerrarModalPlato() {
  document.getElementById('modalPlato')?.classList.remove('active');
}

async function editarPlato(id) {
  try {
    const res = await fetch(`${API_BASE}/platos/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar plato');

    const plato = await res.json();
    
    editandoPlato = true;
    document.getElementById('modalPlatoTitulo').textContent = 'Editar Plato';
    document.getElementById('platoId').value = plato._id;
    document.getElementById('platoRestaurante').value = plato.restauranteId;
    document.getElementById('platoNombre').value = plato.nombre;
    document.getElementById('platoDescripcion').value = plato.descripcion || '';
    document.getElementById('platoCategoria').value = plato.categoria || '';
    document.getElementById('platoImagen').value = plato.imagen || '';
    
    document.getElementById('modalPlato')?.classList.add('active');
  } catch (error) {
    mostrarNotificacion('Error al cargar plato', 'error');
  }
}

async function guardarPlato(e) {
  e.preventDefault();

  const id = document.getElementById('platoId')?.value;
  const restauranteId = document.getElementById('platoRestaurante')?.value;
  
  if (!restauranteId) {
    mostrarNotificacion('Selecciona un restaurante', 'error');
    return;
  }

  const imagenInput = document.getElementById('platoImagen')?.value.trim();
  
  const datos = {
    restauranteId: restauranteId,
    nombre: document.getElementById('platoNombre')?.value.trim(),
    descripcion: document.getElementById('platoDescripcion')?.value.trim(),
    categoria: document.getElementById('platoCategoria')?.value.trim(),
    imagen: imagenInput || null
  };

  if (!datos.nombre || !datos.descripcion || !datos.categoria) {
    mostrarNotificacion('Completa todos los campos obligatorios', 'error');
    return;
  }

  try {
    const url = editandoPlato 
      ? `${API_BASE}/platos/${id}` 
      : `${API_BASE}/platos/registrar`;
    
    const method = editandoPlato ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datos)
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.errors 
        ? data.errors.map(e => e.msg || e.message).join(', ')
        : data.error || 'Error al guardar';
      throw new Error(errorMsg);
    }

    mostrarNotificacion(`✅ Plato ${editandoPlato ? 'actualizado' : 'creado'}`, 'success');
    cerrarModalPlato();
    await cargarPlatos();
  } catch (error) {
    mostrarNotificacion(error.message, 'error');
  }
}

function eliminarPlatoDirecto(id, nombre) {
  mostrarModalConfirmacion(
    'eliminar',
    'plato',
    nombre,
    `Esta acción no se puede deshacer.`,
    () => eliminarPlato(id)
  );
}

async function eliminarPlato(id) {
  try {
    const res = await fetch(`${API_BASE}/platos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al eliminar');

    mostrarNotificacion('✅ Plato eliminado exitosamente', 'success');
    await cargarPlatos();
  } catch (error) {
    console.error('Error al eliminar plato:', error);
    mostrarNotificacion('❌ ' + error.message, 'error');
  }
}

// ===== PENDIENTES =====
async function cargarPendientes() {
  try {
    console.log("⏳ Cargando restaurantes pendientes...");
    
    // Obtener TODOS los restaurantes
    const res = await fetch(`${API_BASE}/restaurantes/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const restaurantes = await res.json();
      console.log("📊 Total restaurantes:", restaurantes.length);
      
      // Filtrar solo los no aprobados
      const inactivos = restaurantes.filter(r => r.aprobado === false);
      console.log("⏳ Inactivos (aprobado: false):", inactivos.length);
      
      const tbody = document.getElementById('restaurantesPendientesBody');
      if (tbody) {
        tbody.innerHTML = '';

        if (inactivos.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b;">✅ No hay restaurantes pendientes de activación</td></tr>';
        } else {
          inactivos.forEach(rest => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>${rest.nombre}</strong></td>
              <td>${rest.categoria || 'N/A'}</td>
              <td>${rest.ubicacion || 'N/A'}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-small btn-approve" onclick="aprobarRestaurante('${rest._id}')">✓ Activar</button>
                  <button class="btn-small btn-edit" onclick="editarRestaurante('${rest._id}')">✏️ Editar</button>
                  <button class="btn-small btn-delete" onclick="eliminarRestauranteDirecto('${rest._id}', '${rest.nombre.replace(/'/g, "\\'")}')">🗑️ Eliminar</button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      }
    }
  } catch (error) {
    console.error('Error al cargar pendientes:', error);
    mostrarNotificacion('Error al cargar pendientes', 'error');
  }
}

// ===== MODAL DE CONFIRMACIÓN =====
function mostrarModalConfirmacion(accion, tipo, nombre, advertencia, callback) {
  accionPendiente = accion;
  tipoElementoAEliminar = tipo;
  elementoAEliminar = nombre;
  callbackConfirmacion = callback;
  
  const modal = document.getElementById('modalConfirmarEliminar');
  const mensaje = document.getElementById('mensajeConfirmacion');
  const detalle = document.getElementById('detalleElemento');
  const btnConfirmar = document.querySelector('#modalConfirmarEliminar .btn');
  const mensajeContainer = mensaje.parentElement;
  const tituloModal = document.querySelector('#modalConfirmarEliminar .modal-header h3');
  
  // Resetear estilos
  tituloModal.style.color = '#ef4444';
  mensajeContainer.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
  mensajeContainer.style.borderLeft = '5px solid #ef4444';
  mensaje.style.color = '#991b1b';
  
  // Configurar según la acción
  if (accion === 'eliminar') {
    tituloModal.innerHTML = '⚠️ Confirmar Eliminación';
    tituloModal.style.color = '#ef4444';
    mensaje.innerHTML = `¿Estás seguro de que deseas <strong>eliminar</strong> este ${tipo}?`;
    btnConfirmar.innerHTML = '🗑️ Sí, Eliminar';
    btnConfirmar.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    mensajeContainer.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
    mensajeContainer.style.borderLeft = '5px solid #ef4444';
    mensaje.style.color = '#991b1b';
  } else if (accion === 'desactivar') {
    tituloModal.innerHTML = '⏸️ Confirmar Desactivación';
    tituloModal.style.color = '#f59e0b';
    mensaje.innerHTML = `¿Estás seguro de que deseas <strong>desactivar</strong> este ${tipo}?`;
    mensajeContainer.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
    mensajeContainer.style.borderLeft = '5px solid #f59e0b';
    mensaje.style.color = '#92400e';
    btnConfirmar.innerHTML = '⏸️ Sí, Desactivar';
    btnConfirmar.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  } else if (accion === 'cerrar-sesion') {
    tituloModal.innerHTML = '🚪 Cerrar Sesión';
    tituloModal.style.color = '#6366f1';
    mensaje.innerHTML = `¿Estás seguro de que deseas <strong>cerrar sesión</strong>?`;
    mensajeContainer.style.background = 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)';
    mensajeContainer.style.borderLeft = '5px solid #6366f1';
    mensaje.style.color = '#3730a3';
    btnConfirmar.innerHTML = '🚪 Sí, Cerrar Sesión';
    btnConfirmar.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
  }
  
  // Mostrar detalles
  let icono = '📂';
  if (tipo === 'restaurante') icono = '🍽️';
  else if (tipo === 'plato') icono = '🍕';
  else if (tipo === 'sesión') icono = '👤';
  
  detalle.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
        ${icono}
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 700; color: #1e293b; font-size: 1.1rem; margin-bottom: 4px;">${nombre}</div>
        <div style="color: #64748b; font-size: 0.9rem;">Tipo: ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</div>
      </div>
    </div>
    <div style="background: #fff; padding: 12px; border-radius: 8px; border-left: 3px solid ${accion === 'eliminar' ? '#ef4444' : accion === 'desactivar' ? '#f59e0b' : '#6366f1'};">
      <p style="margin: 0; color: #475569; font-size: 0.95rem;">⚠️ ${advertencia}</p>
    </div>
  `;
  
  modal.classList.add('active');
}

function cerrarModalConfirmar() {
  const modal = document.getElementById('modalConfirmarEliminar');
  modal.classList.remove('active');
  
  // Resetear estilos
  document.querySelector('#modalConfirmarEliminar .modal-header h3').style.color = '#ef4444';
  document.getElementById('mensajeConfirmacion').parentElement.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
  document.getElementById('mensajeConfirmacion').parentElement.style.borderLeft = '5px solid #ef4444';
  document.getElementById('mensajeConfirmacion').style.color = '#991b1b';
  
  // Limpiar variables
  accionPendiente = null;
  tipoElementoAEliminar = null;
  elementoAEliminar = null;
  callbackConfirmacion = null;
}

function confirmarEliminacion() {
  if (callbackConfirmacion) {
    callbackConfirmacion();
  }
  cerrarModalConfirmar();
}

// ===== CONFIGURAR FORMULARIOS =====
function configurarFormularios() {
  document.getElementById('categoriaForm')?.addEventListener('submit', guardarCategoria);
  document.getElementById('restauranteForm')?.addEventListener('submit', guardarRestaurante);
  document.getElementById('platoForm')?.addEventListener('submit', guardarPlato);
}

// ===== NOTIFICACIONES =====
function mostrarNotificacion(mensaje, tipo = 'success') {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
  `;

  if (tipo === 'success') {
    notif.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
    notif.style.color = '#065f46';
    notif.style.borderLeft = '5px solid #10b981';
  } else {
    notif.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
    notif.style.color = '#991b1b';
    notif.style.borderLeft = '5px solid #ef4444';
  }

  notif.textContent = mensaje;
  document.body.appendChild(notif);

  setTimeout(() => notif.remove(), 3000);
}

// ===== LOGOUT =====
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  mostrarModalConfirmacion(
    'cerrar-sesion',
    'sesión',
    'Administrador',
    'Tendrás que volver a iniciar sesión para acceder al panel.',
    () => {
      localStorage.clear();
      window.location.href = "../index.html";
    }
  );
});

// Estilos para animaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);