const API_BASE = "http://localhost:4000/api/v1";
const token = localStorage.getItem("token");
let adminId = null;
let editandoRestaurante = false;
let editandoPlato = false;

console.log("admin.js cargado, token:", token);

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
    
    console.log("Admin panel completamente cargado");
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
    console.log("📦 Datos completos recibidos:", data);
    console.log("📦 Estructura data.usuario:", data.usuario);
    
    // ⭐ OBTENER EL TIPO DE USUARIO DE FORMA MÁS FLEXIBLE
    const usuario = data.usuario || data;
    const tipo = usuario.tipo;
    
    console.log("🎯 Usuario extraído:", usuario);
    console.log("🎯 Tipo detectado:", tipo);
    console.log("🎯 Email:", usuario.email);
    console.log("🎯 Usuario nombre:", usuario.usuario);
    
    // ⭐ VALIDAR TIPO (admin o empleado)
    if (tipo !== 'admin') {
      console.error("❌ Acceso denegado - Tipo de usuario:", tipo);
      console.error("❌ Se requiere tipo: 'admin'");
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
    console.error('❌ Stack:', error.stack);
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
    console.log("Cargando categorías...");
    
    const res = await fetch(`${API_BASE}/categoria/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar categorías');

    const categorias = await res.json();
    console.log("Categorías cargadas:", categorias);
    
    const tbody = document.getElementById('categoriasTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!categorias || categorias.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #64748b;">No hay categorías registradas</td></tr>';
      return;
    }

    categorias.forEach(cat => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${cat.nombre}</strong></td>
        <td>${cat.descripcion || 'Sin descripción'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-small btn-edit" onclick="editarCategoria('${cat._id}', '${cat.nombre.replace(/'/g, "\\'")}')">✏️ Editar</button>
            <button class="btn-small btn-delete" onclick="eliminarCategoria('${cat._id}')">🗑️ Eliminar</button>
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

async function crearCategoria(e) {
  e.preventDefault();
  
  const nombre = document.getElementById('categoriaNombre')?.value.trim();

  if (!nombre) {
    mostrarNotificacion('El nombre es obligatorio', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/categoria/registrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al crear categoría');

    mostrarNotificacion('✅ Categoría creada exitosamente', 'success');
    document.getElementById('categoriaForm')?.reset();
    await cargarCategorias();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message, 'error');
  }
}

async function editarCategoria(id, nombreActual) {
  const nuevoNombre = prompt('Nuevo nombre:', nombreActual);
  if (!nuevoNombre || nuevoNombre === nombreActual) return;

  try {
    const res = await fetch(`${API_BASE}/categoria/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre: nuevoNombre })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al editar');

    mostrarNotificacion('✅ Categoría actualizada', 'success');
    await cargarCategorias();
  } catch (error) {
    mostrarNotificacion(error.message, 'error');
  }
}

async function eliminarCategoria(id) {
  if (!confirm('¿Eliminar esta categoría?')) return;

  try {
    const res = await fetch(`${API_BASE}/categoria/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al eliminar');

    mostrarNotificacion('✅ Categoría eliminada', 'success');
    await cargarCategorias();
  } catch (error) {
    mostrarNotificacion(error.message, 'error');
  }
}

// ===== RESTAURANTES =====
async function cargarRestaurantes() {
  try {
    console.log("Cargando restaurantes...");
    
    const res = await fetch(`${API_BASE}/restaurantes/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar restaurantes');

    const restaurantes = await res.json();
    console.log("Restaurantes cargados:", restaurantes);
    
    const tbody = document.getElementById('restaurantesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!restaurantes || restaurantes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay restaurantes</td></tr>';
      return;
    }

    restaurantes.forEach(rest => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${rest.nombre}</strong></td>
        <td>${rest.categoria || 'Sin categoría'}</td>
        <td>${rest.ubicacion || 'N/A'}</td>
        <td>
          <span class="badge ${rest.aprobado ? 'badge-approved' : 'badge-pending'}">
            ${rest.aprobado ? '✓ Aprobado' : '⏳ Pendiente'}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            ${!rest.aprobado ? `<button class="btn-small btn-approve" onclick="aprobarRestaurante('${rest._id}')">✓ Aprobar</button>` : ''}
            <button class="btn-small btn-edit" onclick="editarRestaurante('${rest._id}')">✏️</button>
            <button class="btn-small btn-delete" onclick="eliminarRestaurante('${rest._id}')">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    actualizarSelectRestaurantes(restaurantes);
  } catch (error) {
    console.error('Error al cargar restaurantes:', error);
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

    if (!res.ok) throw new Error('Error al aprobar');

    mostrarNotificacion('✅ Restaurante aprobado', 'success');
    await cargarRestaurantes();
    await cargarPendientes();
  } catch (error) {
    mostrarNotificacion(error.message, 'error');
  }
}

async function eliminarRestaurante(id) {
  if (!confirm('¿Eliminar este restaurante?')) return;

  try {
    const res = await fetch(`${API_BASE}/restaurantes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al eliminar');

    mostrarNotificacion('✅ Restaurante eliminado', 'success');
    await cargarRestaurantes();
  } catch (error) {
    mostrarNotificacion(error.message, 'error');
  }
}

// ===== PLATOS =====
async function cargarPlatos() {
  try {
    console.log("Cargando platos...");
    
    const res = await fetch(`${API_BASE}/restaurantes/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar datos');

    const restaurantes = await res.json();
    const tbody = document.getElementById('platosTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    let totalPlatos = 0;

    for (const rest of restaurantes) {
      try {
        const platosRes = await fetch(`${API_BASE}/platos/restaurante/${rest._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (platosRes.ok) {
          const platos = await platosRes.json();
          
          platos.forEach(plato => {
            totalPlatos++;
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>${plato.nombre}</strong></td>
              <td>${rest.nombre}</td>
              <td>${plato.categoria || 'N/A'}</td>
              <td><span class="badge badge-approved">✓ Activo</span></td>
              <td>
                <div class="action-buttons">
                  <button class="btn-small btn-edit" onclick="editarPlato('${plato._id}')">✏️</button>
                  <button class="btn-small btn-delete" onclick="eliminarPlato('${plato._id}')">🗑️</button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      } catch (err) {
        console.error(`Error cargando platos de ${rest.nombre}:`, err);
      }
    }

    if (totalPlatos === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay platos registrados</td></tr>';
    }
  } catch (error) {
    console.error('Error al cargar platos:', error);
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
  const datos = {
    restauranteId: document.getElementById('platoRestaurante')?.value,
    nombre: document.getElementById('platoNombre')?.value.trim(),
    descripcion: document.getElementById('platoDescripcion')?.value.trim(),
    categoria: document.getElementById('platoCategoria')?.value.trim(),
    ubicacion: "Ubicación del restaurante",
    imagen: document.getElementById('platoImagen')?.value.trim() || null
  };

  if (!datos.restauranteId || !datos.nombre || !datos.descripcion || !datos.categoria) {
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

    if (!res.ok) throw new Error(data.error || 'Error al guardar');

    mostrarNotificacion(`✅ Plato ${editandoPlato ? 'actualizado' : 'creado'}`, 'success');
    cerrarModalPlato();
    await cargarPlatos();
  } catch (error) {
    mostrarNotificacion(error.message, 'error');
  }
}

async function eliminarPlato(id) {
  if (!confirm('¿Eliminar este plato?')) return;

  try {
    const res = await fetch(`${API_BASE}/platos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al eliminar');

    mostrarNotificacion('✅ Plato eliminado', 'success');
    await cargarPlatos();
  } catch (error) {
    mostrarNotificacion(error.message, 'error');
  }
}

// ===== PENDIENTES =====
async function cargarPendientes() {
  try {
    const res = await fetch(`${API_BASE}/restaurantes/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const restaurantes = await res.json();
      const pendientes = restaurantes.filter(r => !r.aprobado);
      
      const tbody = document.getElementById('restaurantesPendientesBody');
      if (tbody) {
        tbody.innerHTML = '';

        if (pendientes.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay pendientes</td></tr>';
        } else {
          pendientes.forEach(rest => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>${rest.nombre}</strong></td>
              <td>${rest.categoria || 'N/A'}</td>
              <td>${rest.ubicacion || 'N/A'}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-small btn-approve" onclick="aprobarRestaurante('${rest._id}')">✓ Aprobar</button>
                  <button class="btn-small btn-delete" onclick="eliminarRestaurante('${rest._id}')">✗ Rechazar</button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      }
    }

    const tbody2 = document.getElementById('platosPendientesBody');
    if (tbody2) {
      tbody2.innerHTML = '<tr><td colspan="4" style="text-align: center;">Los platos no requieren aprobación</td></tr>';
    }
  } catch (error) {
    console.error('Error al cargar pendientes:', error);
  }
}

// ===== CONFIGURAR FORMULARIOS =====
function configurarFormularios() {
  document.getElementById('categoriaForm')?.addEventListener('submit', crearCategoria);
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
  if (confirm('¿Cerrar sesión?')) {
    localStorage.clear();
    window.location.href = "../index.html";
  }
});

// Estilos
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);