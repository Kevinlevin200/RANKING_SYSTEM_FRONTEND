const API_BASE = "http://localhost:4000/api/v1";
const token = localStorage.getItem("token");
let usuarioId = null;

// 🔐 Verificar sesión
async function verificarSesion() {
  try {
    const res = await fetch(`${API_BASE}/usuarios/verificar-sesion`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!res.ok) {
      throw new Error('Sesión inválida');
    }

    const data = await res.json();
    document.getElementById("userEmail").textContent = data.usuario.email || data.email;
    document.getElementById("userNombre").textContent = data.usuario.usuario || data.usuario.nombre || 'Usuario';
    
    return data.usuario;
  } catch (error) {
    console.error('Error en verificación de sesión:', error);
    alert("Sesión inválida. Redirigiendo al inicio...");
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  }
}

// 📊 Cargar restaurantes por ranking
async function cargarRestaurantes() {
  try {
    mostrarCargando('restaurantesContainer');
    
    const res = await fetch(`${API_BASE}/ranking/ranking`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Error al cargar restaurantes');
    }

    const data = await res.json();
    const contenedor = document.getElementById("restaurantesContainer");
    contenedor.innerHTML = "";

    if (!data || data.length === 0) {
      contenedor.innerHTML = '<p style="color: #64748b;">No hay restaurantes disponibles.</p>';
      return;
    }

    // Añadir filtros de categoría
    const categorias = [...new Set(data.map(item => item.restaurante?.categoria).filter(Boolean))];
    if (categorias.length > 0) {
      const filterSection = document.createElement('div');
      filterSection.className = 'filter-section';
      filterSection.innerHTML = `
        <button class="filter-btn active" onclick="cargarRestaurantes()">Todos</button>
        ${categorias.map(cat => `
          <button class="filter-btn" onclick="filtrarPorCategoria('${cat}')">${cat}</button>
        `).join('')}
      `;
      contenedor.appendChild(filterSection);
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
        <p><strong>Ubicación:</strong> ${restaurante.ubicacion || 'No especificada'}</p>
        <button class="btn" onclick="verDetalle('${restaurante._id}')">Ver detalle</button>
      `;
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error('Error al cargar restaurantes:', error);
    const contenedor = document.getElementById("restaurantesContainer");
    contenedor.innerHTML = '<p style="color: #ef4444;">Error al cargar restaurantes. Por favor intenta de nuevo.</p>';
  }
}

// 🔂 Filtrar por categoría
async function filtrarPorCategoria(categoria) {
  try {
    mostrarCargando('restaurantesContainer');
    
    const res = await fetch(`${API_BASE}/ranking/categoria/${categoria}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Error al filtrar restaurantes');
    }

    const data = await res.json();
    const contenedor = document.getElementById("restaurantesContainer");
    contenedor.innerHTML = `<h3 style="margin-bottom: 20px; color: #667eea;">📂 Filtrado por: ${categoria}</h3>`;

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
        <button class="filter-btn ${cat === categoria ? 'active' : ''}" onclick="filtrarPorCategoria('${cat}')">${cat}</button>
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
        <button class="btn" onclick="verDetalle('${restaurante._id}')">Ver detalle</button>
      `;
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error('Error al filtrar:', error);
    const contenedor = document.getElementById("restaurantesContainer");
    contenedor.innerHTML = '<p style="color: #ef4444;">Error al filtrar restaurantes.</p>';
  }
}

// 🔍 Vista detallada
async function verDetalle(id) {
  try {
    mostrarCargando('reseñasContainer');
    
    const res = await fetch(`${API_BASE}/ranking/detalle/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Error al cargar detalles');
    }

    const data = await res.json();
    const contenedor = document.getElementById("reseñasContainer");
    contenedor.innerHTML = `<h3 style="margin-bottom: 20px; color: #667eea;">🏪 ${data.restaurante.nombre}</h3>`;

    // Mostrar platos si existen
    if (data.platos && data.platos.length > 0) {
      contenedor.innerHTML += '<h4 style="margin: 15px 0; color: #1e293b;">🍽️ Menú:</h4>';
      data.platos.forEach(plato => {
        contenedor.innerHTML += `
          <div style="background: #f1f5f9; padding: 10px; margin: 8px 0; border-radius: 8px;">
            <strong>${plato.nombre}</strong> - $${plato.precio}
          </div>
        `;
      });
    }

    // Formulario para crear nueva reseña
    contenedor.innerHTML += `
      <div style="margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border: 2px solid #e2e8f0;">
        <h4 style="margin-bottom: 15px; color: #1e293b;">✍️ Escribe tu reseña</h4>
        <textarea id="nuevoComentario" placeholder="Comparte tu experiencia..." 
          style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; min-height: 100px; font-family: inherit;"></textarea>
        <input type="number" id="nuevaCalificacion" min="1" max="5" placeholder="Calificación (1-5)" 
          style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px;">
        <button class="btn" onclick="crearReseña('${id}')">Publicar reseña</button>
      </div>
    `;

    // Mostrar reseñas existentes
    if (data.reseñas && data.reseñas.length > 0) {
      contenedor.innerHTML += '<h4 style="margin: 20px 0; color: #1e293b;">💬 Reseñas de usuarios:</h4>';
      
      data.reseñas.forEach(reseña => {
        const esPropia = reseña.usuarioId === usuarioId || reseña.usuarioId?._id === usuarioId;
        const card = document.createElement('div');
        card.className = 'reseña-card';
        
        card.innerHTML = `
          <p style="font-size: 1.05rem; margin-bottom: 10px;"><strong>${reseña.comentario}</strong></p>
          <p>⭐ Calificación: ${reseña.calificacion}/5</p>
          <p style="font-size: 0.9rem; color: #78350f;">
            👤 Por: ${reseña.usuarioId?.usuario || reseña.usuarioId?.nombre || 'Usuario'}
          </p>
          <div style="margin-top: 12px;">
            ${!esPropia ? `
              <button class="btn" style="background: #10b981; padding: 8px 16px; font-size: 0.9rem;" 
                onclick="darLike('${reseña._id}')">👍 ${reseña.likes?.length || 0}</button>
              <button class="btn secondary" style="padding: 8px 16px; font-size: 0.9rem;" 
                onclick="darDislike('${reseña._id}')">👎 ${reseña.dislikes?.length || 0}</button>
            ` : `
              <button class="btn" style="background: #f59e0b; padding: 8px 16px; font-size: 0.9rem;" 
                onclick="editarReseña('${reseña._id}', '${id}')">✏️ Editar</button>
              <button class="btn secondary" style="background: #ef4444; padding: 8px 16px; font-size: 0.9rem;" 
                onclick="eliminarReseña('${reseña._id}', '${id}')">🗑️ Eliminar</button>
            `}
          </div>
        `;
        contenedor.appendChild(card);
      });
    } else {
      contenedor.innerHTML += '<p style="color: #64748b; margin-top: 15px;">No hay reseñas aún. ¡Sé el primero en opinar!</p>';
    }
  } catch (error) {
    console.error('Error al cargar detalles:', error);
    const contenedor = document.getElementById("reseñasContainer");
    contenedor.innerHTML = '<p style="color: #ef4444;">Error al cargar detalles del restaurante.</p>';
  }
}

// 📝 Crear reseña
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

  try {
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
    
    if (!res.ok) {
      throw new Error(data.error || 'Error al crear reseña');
    }

    alert(data.message || '✅ Reseña creada exitosamente');
    verDetalle(restauranteId);
  } catch (error) {
    console.error('Error al crear reseña:', error);
    alert('Error: ' + error.message);
  }
}

// ✏️ Editar reseña
async function editarReseña(id, restauranteId) {
  const nuevoComentario = prompt("Nuevo comentario:");
  if (!nuevoComentario) return;
  
  const nuevaCalificacion = parseInt(prompt("Nueva calificación (1-5):"));
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
    
    if (!res.ok) {
      throw new Error(data.error || 'Error al editar reseña');
    }

    alert(data.message || '✅ Reseña actualizada exitosamente');
    verDetalle(restauranteId);
  } catch (error) {
    console.error('Error al editar reseña:', error);
    alert('Error: ' + error.message);
  }
}

// 🗑️ Eliminar reseña
async function eliminarReseña(id, restauranteId) {
  const confirmacion = confirm("¿Estás seguro de que quieres eliminar esta reseña?");
  if (!confirmacion) return;

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
    
    if (!res.ok) {
      throw new Error(data.error || 'Error al eliminar reseña');
    }

    alert(data.message || '✅ Reseña eliminada exitosamente');
    verDetalle(restauranteId);
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    alert('Error: ' + error.message);
  }
}

// 👍 Like
async function darLike(id) {
  try {
    const res = await fetch(`${API_BASE}/reseña/${id}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ usuarioId }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Error al dar like');
    }

    alert(data.message || '👍 Like añadido');
    location.reload();
  } catch (error) {
    console.error('Error al dar like:', error);
    alert('Función de like: ' + error.message);
  }
}

// 👎 Dislike
async function darDislike(id) {
  try {
    const res = await fetch(`${API_BASE}/reseña/${id}/dislike`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ usuarioId }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Error al dar dislike');
    }

    alert(data.message || '👎 Dislike añadido');
    location.reload();
  } catch (error) {
    console.error('Error al dar dislike:', error);
    alert('Función de dislike: ' + error.message);
  }
}

// 🔄 Mostrar indicador de carga
function mostrarCargando(containerId) {
  const contenedor = document.getElementById(containerId);
  if (contenedor) {
    contenedor.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="loading"></div></div>';
  }
}

// 🚪 Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  if (confirm('¿Seguro que quieres cerrar sesión?')) {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  }
});

// 🧠 Inicializar
document.addEventListener('DOMContentLoaded', async () => {
  if (!token) {
    alert('No has iniciado sesión');
    window.location.href = "../index.html";
    return;
  }

  try {
    const user = await verificarSesion();
    usuarioId = user._id || user.id;
    await cargarRestaurantes();
  } catch (error) {
    console.error('Error en inicialización:', error);
  }
});