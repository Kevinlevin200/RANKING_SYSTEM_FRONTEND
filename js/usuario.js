const API_BASE = "http://localhost:4000/api/v1";
const token = localStorage.getItem("token");
let usuarioId = null;

console.log("usuario.js cargado, token:", token ? "✅" : "❌");

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async () => {
  console.log("DOM cargado en usuario.js");
  
  if (!token) {
    console.error("No hay token, redirigiendo");
    alert('No has iniciado sesión');
    window.location.href = "../index.html";
    return;
  }

  try {
    const user = await verificarSesion();
    if (user) {
      usuarioId = user._id || user.id;
      console.log("Usuario ID:", usuarioId);
      await cargarRestaurantes();
      await cargarReseñasUsuario();
    }
  } catch (error) {
    console.error('Error en inicialización:', error);
  }
});

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
    alert("Sesión inválida. Redirigiendo...");
    localStorage.clear();
    window.location.href = "../index.html";
  }
}

// ===== CARGAR RESEÑAS DEL USUARIO =====
async function cargarReseñasUsuario() {
  try {
    console.log("Cargando reseñas del usuario...");
    mostrarCargando('reseñasContainer');
    
    // Intentar obtener reseñas del usuario
    const res = await fetch(`${API_BASE}/reseña/usuario/${usuarioId}`, {
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
      
      const card = document.createElement("div");
      card.className = "restaurante-card";
      card.style.animationDelay = `${index * 0.1}s`;
      card.innerHTML = `
        <h3>🍽️ ${restaurante.nombre}</h3>
        <p><strong>Rating:</strong> ⭐ ${score ? score.toFixed(1) : 'N/A'}</p>
        <p><strong>Categoría:</strong> ${restaurante.categoria || 'Sin categoría'}</p>
        <p><strong>Ubicación:</strong> ${restaurante.ubicacion || 'No especificada'}</p>
        ${restaurante.descripcion ? `<p style="color: #64748b; margin-top: 8px; font-size: 0.95rem;">${restaurante.descripcion}</p>` : ''}
        <button class="btn" onclick="verDetalle('${restaurante._id}')">Ver detalle</button>
      `;
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error('Error al cargar restaurantes:', error);
    const contenedor = document.getElementById("restaurantesContainer");
    contenedor.innerHTML = '<p style="color: #ef4444;">Error al cargar restaurantes. Intenta de nuevo.</p>';
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
      
      const card = document.createElement("div");
      card.className = "restaurante-card";
      card.style.animationDelay = `${index * 0.1}s`;
      card.innerHTML = `
        <h3>🍽️ ${restaurante.nombre}</h3>
        <p><strong>Rating:</strong> ⭐ ${score ? score.toFixed(1) : 'N/A'}</p>
        <p><strong>Categoría:</strong> ${restaurante.categoria || 'Sin categoría'}</p>
        ${restaurante.descripcion ? `<p style="color: #64748b;">${restaurante.descripcion}</p>` : ''}
        <button class="btn" onclick="verDetalle('${restaurante._id}')">Ver detalle</button>
      `;
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
    
    // Header del restaurante
    modalBody.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
        <h2 style="margin: 0 0 16px 0; font-size: 2rem; font-weight: 700;">🏪 ${data.restaurante.nombre}</h2>
        <p style="margin: 8px 0; opacity: 0.95; font-size: 1.1rem; line-height: 1.6;">${data.restaurante.descripcion || 'Sin descripción'}</p>
        <div style="display: flex; gap: 24px; margin-top: 16px; flex-wrap: wrap;">
          <p style="margin: 0; font-size: 1rem;"><strong>📍</strong> ${data.restaurante.ubicacion || 'Sin ubicación'}</p>
          <p style="margin: 0; font-size: 1rem;"><strong>📂</strong> ${data.restaurante.categoria || 'Sin categoría'}</p>
        </div>
      </div>
    `;

    // Mostrar platos
    if (data.platos && data.platos.length > 0) {
      modalBody.innerHTML += '<h3 style="margin: 30px 0 20px 0; color: #1e293b; font-size: 1.6rem; font-weight: 700;">🍽️ Menú:</h3>';
      
      const platosContainer = document.createElement('div');
      platosContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 35px;';
      
      data.platos.forEach(plato => {
        const platoCard = document.createElement('div');
        platoCard.style.cssText = `
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 24px;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          cursor: pointer;
        `;
        platoCard.innerHTML = `
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

// ===== CERRAR MODAL =====
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

// ===== DAR LIKE (Placeholder - sin funcionalidad por ahora) =====
function darLike(reseñaId) {
  console.log("Like a reseña:", reseñaId);
  // TODO: Implementar funcionalidad de like
  alert('Funcionalidad de Like - Próximamente');
}

// ===== DAR DISLIKE (Placeholder - sin funcionalidad por ahora) =====
function darDislike(reseñaId) {
  console.log("Dislike a reseña:", reseñaId);
  // TODO: Implementar funcionalidad de dislike
  alert('Funcionalidad de Dislike - Próximamente');
}

// ===== CREAR RESEÑA =====
async function crearReseña(restauranteId) {
  const comentario = document.getElementById('nuevoComentario')?.value.trim();
  const calificacion = parseInt(document.getElementById('nuevaCalificacion')?.value);

  if (!comentario || !calificacion) {
    alert('Por favor completa todos los campos de la reseña.');
    return;
  }

  if (calificacion < 1 || calificacion > 5) {
    alert('La calificación debe estar entre 1 y 5.');
    return;
  }

  if (!usuarioId) {
    alert('Error: No se pudo identificar el usuario. Inicia sesión nuevamente.');
    return;
  }

  try {
    console.log("Creando reseña:", { restauranteId, comentario, calificacion, usuarioId });
    
    const res = await fetch(`${API_BASE}/reseña/registrar`, {
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

    alert('✅ ' + (data.message || 'Reseña creada exitosamente'));
    
    document.getElementById('nuevoComentario').value = '';
    document.getElementById('nuevaCalificacion').value = '';
    
    await verDetalle(restauranteId);
    await cargarReseñasUsuario();
  } catch (error) {
    console.error('Error al crear reseña:', error);
    alert('❌ Error: ' + error.message);
  }
}

// ===== EDITAR RESEÑA =====
async function editarReseña(id, restauranteId, comentarioActual, calificacionActual) {
  const nuevoComentario = prompt("Nuevo comentario:", comentarioActual);
  if (!nuevoComentario) return;
  
  const nuevaCalificacion = parseInt(prompt("Nueva calificación (1-5):", calificacionActual));
  if (!nuevaCalificacion || nuevaCalificacion < 1 || nuevaCalificacion > 5) {
    alert('Calificación inválida');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reseña/${id}`, {
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

    alert('✅ ' + (data.message || 'Reseña actualizada'));
    
    if (restauranteId) {
      await verDetalle(restauranteId);
    }
    await cargarReseñasUsuario();
  } catch (error) {
    console.error('Error al editar:', error);
    alert('❌ Error: ' + error.message);
  }
}

// ===== ELIMINAR RESEÑA =====
async function eliminarReseña(id, restauranteId) {
  if (!confirm("¿Eliminar esta reseña?")) return;

  try {
    const res = await fetch(`${API_BASE}/reseña/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ usuarioId }),
    });

    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Error al eliminar');

    alert('✅ ' + (data.message || 'Reseña eliminada'));
    
    if (restauranteId) {
      await verDetalle(restauranteId);
    }
    await cargarReseñasUsuario();
  } catch (error) {
    console.error('Error al eliminar:', error);
    alert('❌ Error: ' + error.message);
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

// ===== LOGOUT =====
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  if (confirm('¿Cerrar sesión?')) {
    localStorage.clear();
    window.location.href = "../index.html";
  }
});

console.log("✅ usuario.js: Configurado correctamente");