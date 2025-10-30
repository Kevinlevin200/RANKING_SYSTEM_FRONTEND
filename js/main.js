document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const volverBtn = document.getElementById("volverBtn");
  const inicio = document.getElementById("inicio");
  const formulario = document.getElementById("formulario");
  const formTitle = document.getElementById("formTitle");
  const authForm = document.getElementById("authForm");
  const submitBtn = authForm?.querySelector('button[type="submit"]');

  // Verificar si ya hay sesión activa
  const token = localStorage.getItem("token");
  if (token) {
    verificarSesionActiva();
  }

  // Botón de login
  loginBtn?.addEventListener("click", () => {
    formTitle.textContent = "Iniciar sesión";
    if (submitBtn) submitBtn.textContent = "Iniciar sesión";
    
    // Limpiar campos
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("contraseña");
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
    
    formulario?.classList.remove("hidden");
    inicio?.classList.add("hidden");
    
    // Animación suave
    formulario.style.animation = 'slideUp 0.5s ease forwards';
  });

  // Botón de registro
  registerBtn?.addEventListener("click", () => {
    formTitle.textContent = "Registrarse";
    if (submitBtn) submitBtn.textContent = "Crear cuenta";
    
    // Limpiar campos
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("contraseña");
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
    
    formulario?.classList.remove("hidden");
    inicio?.classList.add("hidden");
    
    // Animación suave
    formulario.style.animation = 'slideUp 0.5s ease forwards';
  });

  // Botón de volver
  volverBtn?.addEventListener("click", () => {
    formulario?.classList.add("hidden");
    inicio?.classList.remove("hidden");
    
    // Limpiar alertas
    const alertas = document.querySelectorAll('.alerta');
    alertas.forEach(alerta => alerta.remove());
    
    // Animación suave
    inicio.style.animation = 'slideUp 0.5s ease forwards';
  });

  // Validación en tiempo real
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("contraseña");

  emailInput?.addEventListener("blur", () => {
    if (emailInput.value && !validarEmail(emailInput.value)) {
      emailInput.style.borderColor = "#ef4444";
      mostrarErrorCampo(emailInput, "Email inválido");
    } else {
      emailInput.style.borderColor = "#e2e8f0";
      ocultarErrorCampo(emailInput);
    }
  });

  passwordInput?.addEventListener("input", () => {
    if (passwordInput.value.length > 0 && passwordInput.value.length < 6) {
      passwordInput.style.borderColor = "#f59e0b";
      mostrarErrorCampo(passwordInput, "Mínimo 6 caracteres");
    } else {
      passwordInput.style.borderColor = "#e2e8f0";
      ocultarErrorCampo(passwordInput);
    }
  });

  // Enter para enviar formulario
  authForm?.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !submitBtn?.disabled) {
      authForm.dispatchEvent(new Event('submit'));
    }
  });
});

// Verificar sesión activa
async function verificarSesionActiva() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:4000/api/v1/usuarios/verificar-sesion", {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const tipo = data.usuario?.tipo || data.tipo;
      
      // Mostrar mensaje
      mostrarMensaje(`Ya tienes una sesión activa. Redirigiendo...`);
      
      // Redirigir después de 1 segundo
      setTimeout(() => {
        if (tipo === "admin") {
          window.location.href = "html/admin.html";
        } else if (tipo === "usuario") {
          window.location.href = "html/usuario.html";
        }
      }, 1000);
    } else {
      localStorage.removeItem("token");
    }
  } catch (error) {
    console.error('Error verificando sesión:', error);
    localStorage.removeItem("token");
  }
}

// Validar email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Mostrar error en campo específico
function mostrarErrorCampo(input, mensaje) {
  ocultarErrorCampo(input);
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-campo';
  errorDiv.style.cssText = `
    color: #ef4444;
    font-size: 0.85rem;
    margin-top: -10px;
    margin-bottom: 10px;
    animation: slideDown 0.2s ease;
  `;
  errorDiv.textContent = mensaje;
  
  input.parentNode.insertBefore(errorDiv, input.nextSibling);
}

// Ocultar error de campo
function ocultarErrorCampo(input) {
  const errorDiv = input.parentNode.querySelector('.error-campo');
  if (errorDiv) {
    errorDiv.remove();
  }
}

// Mostrar mensaje general
function mostrarMensaje(mensaje) {
  const inicio = document.getElementById("inicio");
  if (!inicio) return;
  
  const mensajeDiv = document.createElement('div');
  mensajeDiv.style.cssText = `
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-left: 5px solid #3b82f6;
    color: #1e40af;
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-weight: 600;
    animation: slideDown 0.3s ease;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
  `;
  mensajeDiv.textContent = `ℹ️ ${mensaje}`;
  
  inicio.insertBefore(mensajeDiv, inicio.firstChild);
}

// Agregar estilos adicionales
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  input:focus {
    outline: none;
    border-color: #667eea !important;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);