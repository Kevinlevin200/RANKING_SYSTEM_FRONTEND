const API_BASE = "http://localhost:4000/api/v1";
const token = localStorage.getItem("token");
let adminId = null;
let editandoRestaurante = false;
let editandoPlato = false;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async () => {
  if (!token) {
    alert('No has iniciado sesión');
    window.location.href = "../index.html";
    return;
  }

  try {
    await verificarSesionAdmin();
    await cargarCategorias();
    await cargarRestaurantes();
    await cargarPlatos();
    await cargarPendientes();
    configurarTabs();
    configurarFormularios();
  } catch (error) {
    console.error('Error en inicialización:', error);
  }
});

// ===== VERIFICACIÓN DE SESIÓN =====
async function verificarSesionAdmin() {
  try {
    const res = await fetch(`${API_BASE}/usuarios/verificar-sesion`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!res.ok) throw new Error('Sesión inválida');

    const data = await res.json();
    
    // Verificar que sea admin
    if (data.usuario.tipo !== 'admin') {
      alert('Acceso denegado. Solo administradores.');
      window.location.href = "../index.html";
      return;
    }

    document.getElementById("adminNombre").textContent = data.usuario.usuario || data.usuario.nombre || 'Admin';
    adminId = data.usuario._id || data.usuario.id;
  } catch (error) {
    console.error('Error en verificación:', error);
    alert("Sesión inválida. Redirigiendo...");
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  }
}

// ===== SISTEMA DE TABS =====
function configurarTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remover active de todos
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      // Activar el seleccionado
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

// ===== CATEGORÍAS =====
async function cargarCategorias() {
  try {
    const res = await fetch(`${API_BASE}/categoria/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar categorías');

    const categorias = await res.json();
    const tbody = document.getElementById('categoriasTableBody');
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
            <button class="btn-small btn-edit" onclick="editarCategoria('${cat._id}', '${cat.nombre}', '${cat.descripcion || ''}')">✏️ Editar</button>
            <button class="btn-small btn-delete" onclick="eliminarCategoria('${cat._id}')">🗑️ Eliminar</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Actualizar select de categorías en modal de restaurantes
    actualizarSelectCategorias(categorias);
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    mostrarNotificacion('Error al cargar categorías', 'error');
  }
}

function actualizarSelectCategorias(categorias) {
  const select = document.getElementById('restauranteCategoria');
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
  
  const nombre = document.getElementById('categoriaNombre').value.trim();
  const descripcion = document.getElementById('categoriaDescripcion').value.trim();

  try {
    const res = await fetch(`${API_BASE}/categoria/registrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre, descripcion })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al crear categoría');

    mostrarNotificacion('✅ Categoría creada exitosamente', 'success');
    document.getElementById('categoriaForm').reset();
    await cargarCategorias();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message, 'error');
  }
}

async function editarCategoria(id, nombreActual, descripcionActual) {
  const nuevoNombre = prompt('Nuevo nombre:', nombreActual);
  if (!nuevoNombre) return;

  const nuevaDescripcion = prompt('Nueva descripción:', descripcionActual);

  try {
    const res = await fetch(`${API_BASE}/categoria/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        nombre: nuevoNombre, 
        descripcion: nuevaDescripcion 
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al editar categoría');

    mostrarNotificacion('✅ Categoría actualizada', 'success');
    await cargarCategorias();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message, 'error');
  }
}

async function eliminarCategoria(id) {
  if (!confirm('¿Eliminar esta categoría? Esto puede afectar restaurantes asociados.')) return;

  try {
    const res = await fetch(`${API_BASE}/categoria/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al eliminar');

    mostrarNotificacion('✅ Categoría eliminada', 'success');
    await cargarCategorias();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message, 'error');
  }
}

// ===== RESTAURANTES =====
async function cargarRestaurantes() {
  try {
    const res = await fetch(`${API_BASE}/restaurantes/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar restaurantes');

    const restaurantes = await res.json();
    const tbody = document.getElementById('restaurantesTableBody');
    tbody.innerHTML = '';

    if (!restaurantes || restaurantes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No hay restaurantes registrados</td></tr>';
      return;
    }

    restaurantes.forEach(rest => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${rest.nombre}</strong></td>
        <td>${rest.categoria || 'Sin categoría'}</td>
        <td>${rest.ubicacion || 'No especificada'}</td>
        <td>
          <span class="badge ${rest.aprobado ? 'badge-approved' : 'badge-pending'}">
            ${rest.aprobado ? '✓ Aprobado' : '⏳ Pendiente'}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            ${!rest.aprobado ? `<button class="btn-small btn-approve" onclick="aprobarRestaurante('${rest._id}')">✓ Aprobar</button>` : ''}
            <button class="btn-small btn-edit" onclick="editarRestaurante('${rest._id}')">✏️ Editar</button>
            <button class="btn-small btn-delete" onclick="eliminarRestaurante('${rest._id}')">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Actualizar select de restaurantes en modal de platos
    actualizarSelectRestaurantes(restaurantes);
  } catch (error) {
    console.error('Error al cargar restaurantes:', error);
    mostrarNotificacion('Error al cargar restaurantes', 'error');
  }
}

function actualizarSelectRestaurantes(restaurantes) {
  const select = document.getElementById('platoRestaurante');
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
  document.getElementById('restauranteForm').reset();
  document.getElementById('restauranteId').value = '';
  document.getElementById('modalRestaurante').classList.add('active');
}

function cerrarModalRestaurante() {
  document.getElementById('modalRestaurante').classList.remove('active');
  document.getElementById('restauranteForm').reset();
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
    
    document.getElementById('modalRestaurante').classList.add('active');
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al cargar datos del restaurante', 'error');
  }
}

async function guardarRestaurante(e) {
  e.preventDefault();

  const id = document.getElementById('restauranteId').value;
  const datos = {
    nombre: document.getElementById('restauranteNombre').value.trim(),
    descripcion: document.getElementById('restauranteDescripcion').value.trim(),
    categoria: document.getElementById('restauranteCategoria').value,
    ubicacion: document.getElementById('restauranteUbicacion').value.trim(),
    imagen: document.getElementById('restauranteImagen').value.trim(),
    aprobado: true // Admin crea aprobado automáticamente
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

    if (!res.ok) throw new Error(data.error || 'Error al guardar restaurante');

    mostrarNotificacion(`✅ Restaurante ${editandoRestaurante ? 'actualizado' : 'creado'} exitosamente`, 'success');
    cerrarModalRestaurante();
    await cargarRestaurantes();
  } catch (error) {
    console.error('Error:', error);
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

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al aprobar');

    mostrarNotificacion('✅ Restaurante aprobado', 'success');
    await cargarRestaurantes();
    await cargarPendientes();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message, 'error');
  }
}

async function eliminarRestaurante(id) {
  if (!confirm('¿Eliminar este restaurante? Se eliminarán todos sus platos.')) return;

  try {
    const res = await fetch(`${API_BASE}/restaurantes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al eliminar');

    mostrarNotificacion('✅ Restaurante eliminado', 'success');
    await cargarRestaurantes();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message, 'error');
  }
}

// ===== PLATOS =====
async function cargarPlatos() {
  try {
    const res = await fetch(`${API_BASE}/restaurantes/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar datos');

    const restaurantes = await res.json();
    const tbody = document.getElementById('platosTableBody');
    tbody.innerHTML = '';

    let totalPlatos = 0;

    // Cargar platos de cada restaurante
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
              <td>$${plato.precio?.toFixed(2) || '0.00'}</td>
              <td>
                <span class="badge ${plato.aprobado ? 'badge-approved' : 'badge-pending'}">
                  ${plato.aprobado ? '✓ Aprobado' : '⏳ Pendiente'}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  ${!plato.aprobado ? `<button class="btn-small btn-approve" onclick="aprobarPlato('${plato._id}')">✓ Aprobar</button>` : ''}
                  <button class="btn-small btn-edit" onclick="editarPlato('${plato._id}')">✏️ Editar</button>
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
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No hay platos registrados</td></tr>';
    }
  } catch (error) {
    console.error('Error al cargar platos:', error);
    mostrarNotificacion('Error al cargar platos', 'error');
  }
}

function abrirModalPlato() {
  editandoPlato = false;
  document.getElementById('modalPlatoTitulo').textContent = 'Nuevo Plato';
  document.getElementById('platoForm').reset();
  document.getElementById('platoId').value = '';
  document.getElementById('modalPlato').classList.add('active');
}

function cerrarModalPlato() {
  document.getElementById('modalPlato').classList.remove('active');
  document.getElementById('platoForm').reset();
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
    document.getElementById('platoPrecio').value = plato.precio || 0;
    document.getElementById('platoCategoria').value = plato.categoria || '';
    document.getElementById('platoImagen').value = plato.imagen || '';
    
    document.getElementById('modalPlato').classList.add('active');
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al cargar datos del plato', 'error');
  }
}

async function guardarPlato(e) {
  e.preventDefault();

  const id = document.getElementById('platoId').value;
  const datos = {
    restauranteId: document.getElementById('platoRestaurante').value,
    nombre: document.getElementById('platoNombre').value.trim(),
    descripcion: document.getElementById('platoDescripcion').value.trim(),
    precio: parseFloat(document.getElementById('platoPrecio').value),
    categoria: document.getElementById('platoCategoria').value.trim(),
    imagen: document.getElementById('platoImagen').value.trim(),
    aprobado: true // Admin crea aprobado automáticamente
  };

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

    if (!res.ok) throw new Error(data.error || 'Error al guardar plato');

    mostrarNotificacion(`✅ Plato ${editandoPlato ? 'actualizado' : 'creado'} exitosamente`, 'success');
    cerrarModalPlato();
    await cargarPlatos();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message, 'error');
  }
}

async function aprobarPlato(id) {
  try {
    const res = await fetch(`${API_BASE}/platos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ aprobado: true })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al aprobar');

    mostrarNotificacion('✅ Plato aprobado', 'success');
    await cargarPlatos();
    await cargarPendientes();
  } catch (error) {
    console.error('Error:', error);
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

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al eliminar');

    mostrarNotificacion('✅ Plato eliminado', 'success');
    await cargarPlatos();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message, 'error');
  }
}

// ===== PENDIENTES =====
async function cargarPendientes() {
  try {
    // Restaurantes pendientes
    const resRestaurantes = await fetch(`${API_BASE}/restaurantes/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (resRestaurantes.ok) {
      const restaurantes = await resRestaurantes.json();
      const pendientes = restaurantes.filter(r => !r.aprobado);
      
      const tbody = document.getElementById('restaurantesPendientesBody');
      tbody.innerHTML = '';

      if (pendientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b;">No hay restaurantes pendientes</td></tr>';
      } else {
        pendientes.forEach(rest => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${rest.nombre}</strong></td>
            <td>${rest.categoria || 'Sin categoría'}</td>
            <td>${rest.ubicacion || 'No especificada'}</td>
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

    // Platos pendientes
    const resPlatos = await fetch(`${API_BASE}/restaurantes/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (resPlatos.ok) {
      const restaurantes = await resPlatos.json();
      const tbody = document.getElementById('platosPendientesBody');
      tbody.innerHTML = '';
      
      let hayPendientes = false;

      for (const rest of restaurantes) {
        const platosRes = await fetch(`${API_BASE}/platos/restaurante/${rest._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (platosRes.ok) {
          const platos = await platosRes.json();
          const pendientes = platos.filter(p => !p.aprobado);
          
          pendientes.forEach(plato => {
            hayPendientes = true;
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>${plato.nombre}</strong></td>
              <td>${rest.nombre}</td>
              <td>$${plato.precio?.toFixed(2) || '0.00'}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-small btn-approve" onclick="aprobarPlato('${plato._id}')">✓ Aprobar</button>
                  <button class="btn-small btn-delete" onclick="eliminarPlato('${plato._id}')">✗ Rechazar</button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      }

      if (!hayPendientes) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b;">No hay platos pendientes</td></tr>';
      }
    }
  } catch (error) {
    console.error('Error al cargar pendientes:', error);
  }
}

// ===== CONFIGURAR FORMULARIOS =====
function configurarFormularios() {
  document.getElementById('categoriaForm').addEventListener('submit', crearCategoria);
  document.getElementById('restauranteForm').addEventListener('submit', guardarRestaurante);
  document.getElementById('platoForm').addEventListener('submit', guardarPlato);
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
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
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

  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// ===== LOGOUT =====
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  if (confirm('¿Cerrar sesión?')) {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  }
});

// ===== ESTILOS DE ANIMACIÓN =====
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
`;
document.head.appendChild(style);