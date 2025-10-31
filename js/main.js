document.addEventListener("DOMContentLoaded", () => {
  console.log("main.js cargado - Configurando interfaz");

  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const volverBtn = document.getElementById("volverBtn");
  const inicio = document.getElementById("inicio");
  const formulario = document.getElementById("formulario");
  const formTitle = document.getElementById("formTitle");
  const authForm = document.getElementById("authForm");
  const submitBtn = authForm?.querySelector('button[type="submit"]');
  const usuarioInput = document.getElementById("usuario");

  // ===== BOTÓN LOGIN =====
  loginBtn?.addEventListener("click", () => {
    console.log("Abriendo formulario de login");
    
    formTitle.textContent = "Iniciar sesión";
    if (submitBtn) submitBtn.textContent = "Iniciar sesión";
    
    // Marcar como modo login
    authForm.dataset.mode = "login";
    
    // Ocultar campo usuario en login
    if (usuarioInput) {
      usuarioInput.style.display = "none";
      usuarioInput.removeAttribute("required");
    }
    
    // Limpiar campos
    document.getElementById("email").value = "";
    document.getElementById("contraseña").value = "";
    if (usuarioInput) usuarioInput.value = "";
    
    // Mostrar formulario con animación
    formulario?.classList.remove("hidden");
    inicio?.classList.add("hidden");
    formulario.style.animation = 'slideUp 0.5s ease forwards';
  });

  // ===== BOTÓN REGISTRO =====
  registerBtn?.addEventListener("click", () => {
    console.log("Abriendo formulario de registro");
    
    formTitle.textContent = "Registrarse";
    if (submitBtn) submitBtn.textContent = "Crear cuenta";
    
    // Marcar como modo registro
    authForm.dataset.mode = "register";
    
    // ⭐ Mostrar campo usuario en registro
    if (usuarioInput) {
      usuarioInput.style.display = "block";
      usuarioInput.setAttribute("required", "true");
    }
    
    // Limpiar campos
    document.getElementById("email").value = "";
    document.getElementById("contraseña").value = "";
    if (usuarioInput) usuarioInput.value = "";
    
    // Mostrar formulario con animación
    formulario?.classList.remove("hidden");
    inicio?.classList.add("hidden");
    formulario.style.animation = 'slideUp 0.5s ease forwards';
  });

  // ===== BOTÓN VOLVER =====
  volverBtn?.addEventListener("click", () => {
    console.log("Volviendo al inicio");
    
    formulario?.classList.add("hidden");
    inicio?.classList.remove("hidden");
    
    // Limpiar alertas
    const alertas = document.querySelectorAll('.alerta');
    alertas.forEach(alerta => alerta.remove());
    
    // Limpiar errores de campo
    const erroresCampo = document.querySelectorAll('.error-campo');
    erroresCampo.forEach(error => error.remove());
    
    // Resetear estilos de inputs
    const inputs = authForm?.querySelectorAll('input');
    inputs?.forEach(input => {
      input.style.borderColor = '#e2e8f0';
    });
    
    // Animación suave
    inicio.style.animation = 'slideUp 0.5s ease forwards';
  });

  // ===== VALIDACIÓN EN TIEMPO REAL =====
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("contraseña");

  // Validación de usuario
  usuarioInput?.addEventListener("blur", () => {
    if (usuarioInput.value) {
      const usuario = usuarioInput.value.trim();
      
      if (usuario.length < 3) {
        usuarioInput.style.borderColor = "#ef4444";
        mostrarErrorCampo(usuarioInput, "Mínimo 3 caracteres");
      } else if (!/^[a-z0-9]+$/i.test(usuario)) {
        usuarioInput.style.borderColor = "#ef4444";
        mostrarErrorCampo(usuarioInput, "Solo letras y números");
      } else {
        usuarioInput.style.borderColor = "#10b981";
        ocultarErrorCampo(usuarioInput);
      }
    }
  });

  usuarioInput?.addEventListener("focus", () => {
    ocultarErrorCampo(usuarioInput);
  });

  // Validación de email
  emailInput?.addEventListener("blur", () => {
    if (emailInput.value && !validarEmail(emailInput.value)) {
      emailInput.style.borderColor = "#ef4444";
      mostrarErrorCampo(emailInput, "Email inválido");
    } else {
      emailInput.style.borderColor = "#e2e8f0";
      ocultarErrorCampo(emailInput);
    }
  });

  emailInput?.addEventListener("focus", () => {
    ocultarErrorCampo(emailInput);
  });

  // Validación de contraseña
  passwordInput?.addEventListener("input", () => {
    const valor = passwordInput.value;
    
    if (valor.length > 0 && valor.length < 6) {
      passwordInput.style.borderColor = "#f59e0b";
      mostrarErrorCampo(passwordInput, "Mínimo 6 caracteres");
    } else if (valor.length >= 6) {
      passwordInput.style.borderColor = "#10b981";
      ocultarErrorCampo(passwordInput);
    } else {
      passwordInput.style.borderColor = "#e2e8f0";
      ocultarErrorCampo(passwordInput);
    }
  });

  passwordInput?.addEventListener("focus", () => {
    if (passwordInput.value.length >= 6) {
      ocultarErrorCampo(passwordInput);
    }
  });

  // ===== ENTER PARA ENVIAR FORMULARIO =====
  authForm?.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !submitBtn?.disabled) {
      e.preventDefault();
      authForm.dispatchEvent(new Event('submit'));
    }
  });
});

// ===== FUNCIONES AUXILIARES =====

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function mostrarErrorCampo(input, mensaje) {
  ocultarErrorCampo(input);
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-campo';
  errorDiv.style.cssText = `
    color: #ef4444;
    font-size: 0.85rem;
    margin-top: -10px;
    margin-bottom: 10px;
    animation: slideDownError 0.2s ease;
    font-weight: 500;
  `;
  errorDiv.textContent = `⚠️ ${mensaje}`;
  
  input.parentNode.insertBefore(errorDiv, input.nextSibling);
}

function ocultarErrorCampo(input) {
  const errorDiv = input.parentNode.querySelector('.error-campo');
  if (errorDiv) {
    errorDiv.remove();
  }
}

// ===== ESTILOS ADICIONALES (usando IIFE para evitar conflictos) =====
(function() {
  const mainStyles = document.createElement('style');
  mainStyles.id = 'main-styles';
  mainStyles.textContent = `
    @keyframes slideDownError {
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
      outline: none !important;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
    }

    input.valid {
      border-color: #10b981 !important;
    }

    input.invalid {
      border-color: #ef4444 !important;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    .hidden {
      display: none !important;
    }
  `;
  document.head.appendChild(mainStyles);
})();

console.log("✅ main.js: Interfaz configurada correctamente");