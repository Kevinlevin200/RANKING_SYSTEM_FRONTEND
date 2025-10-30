const API_BASE = "http://localhost:4000/api/v1";

document.addEventListener("DOMContentLoaded", () => {
  // Verificar si ya hay una sesión activa
  const token = localStorage.getItem("token");
  if (token) {
    verificarSesionExistente(token);
  }

  const form = document.getElementById("authForm");
  const formTitle = document.getElementById("formTitle");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const contraseña = document.getElementById("contraseña")?.value.trim();
    const isLogin = formTitle?.textContent === "Iniciar sesión";

    // Validación de campos
    if (!email || !contraseña) {
      mostrarError("Por favor completa todos los campos.");
      return;
    }

    if (!validarEmail(email)) {
      mostrarError("Por favor ingresa un email válido.");
      return;
    }

    if (contraseña.length < 6) {
      mostrarError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    // Deshabilitar botón y mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnTextOriginal = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading"></span> Procesando...';
    }

    try {
      const endpoint = isLogin ? "/usuarios/login" : "/usuarios/registrar";
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, contraseña }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Error en la operación.");
      }

      // Guardar token en localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Mostrar mensaje de éxito
      mostrarExito(isLogin ? "¡Inicio de sesión exitoso!" : "¡Registro exitoso!");

      // Redirigir según tipo de usuario
      setTimeout(() => {
        const tipo = data.usuario?.tipo || data.tipo;
        if (tipo === "admin") {
          window.location.href = "html/admin.html";
        } else if (tipo === "usuario") {
          window.location.href = "html/usuario.html";
        } else {
          mostrarError("Tipo de usuario desconocido.");
        }
      }, 1000);

    } catch (error) {
      console.error("❌ Error:", error.message);
      mostrarError(error.message);
      
      // Restaurar botón
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = btnTextOriginal;
      }
    }
  });
});

// Verificar si hay una sesión activa
async function verificarSesionExistente(token) {
  try {
    const response = await fetch(`${API_BASE}/usuarios/verificar-sesion`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const tipo = data.usuario?.tipo || data.tipo;
      
      // Redirigir al dashboard correspondiente
      if (tipo === "admin") {
        window.location.href = "html/admin.html";
      } else if (tipo === "usuario") {
        window.location.href = "html/usuario.html";
      }
    } else {
      // Token inválido, eliminarlo
      localStorage.removeItem("token");
    }
  } catch (error) {
    console.error('Error verificando sesión:', error);
    localStorage.removeItem("token");
  }
}

// Validar formato de email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
  // Eliminar alertas anteriores
  const alertaAnterior = document.querySelector('.alerta');
  if (alertaAnterior) {
    alertaAnterior.remove();
  }

  const alerta = document.createElement('div');
  alerta.className = 'alerta alerta-error';
  alerta.style.cssText = `
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border-left: 5px solid #ef4444;
    color: #991b1b;
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-weight: 600;
    animation: slideDown 0.3s ease;
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
  `;
  alerta.textContent = `❌ ${mensaje}`;

  const form = document.getElementById("authForm");
  form?.insertBefore(alerta, form.firstChild);

  // Remover después de 5 segundos
  setTimeout(() => {
    alerta.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => alerta.remove(), 300);
  }, 5000);
}

// Mostrar mensaje de éxito
function mostrarExito(mensaje) {
  const alertaAnterior = document.querySelector('.alerta');
  if (alertaAnterior) {
    alertaAnterior.remove();
  }

  const alerta = document.createElement('div');
  alerta.className = 'alerta alerta-exito';
  alerta.style.cssText = `
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    border-left: 5px solid #10b981;
    color: #065f46;
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-weight: 600;
    animation: slideDown 0.3s ease;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
  `;
  alerta.textContent = `✅ ${mensaje}`;

  const form = document.getElementById("authForm");
  form?.insertBefore(alerta, form.firstChild);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }

  .loading {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    vertical-align: middle;
    margin-right: 8px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);