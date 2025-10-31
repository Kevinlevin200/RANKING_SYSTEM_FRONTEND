const API_BASE = "http://localhost:4000/api/v1";

console.log("🚀 login.js cargado");

document.addEventListener("DOMContentLoaded", () => {
  console.log("📱 DOMContentLoaded - Inicializando login.js");

  // Verificar si ya hay sesión activa
  const token = localStorage.getItem("token");
  console.log("Token en localStorage:", token ? "✅ Existe" : "❌ No existe");
  
  if (token) {
    console.log("🔄 Verificando sesión existente...");
    verificarYRedirigir(token);
    return;
  }

  // Configurar evento submit del formulario
  const authForm = document.getElementById("authForm");
  
  if (!authForm) {
    console.error("❌ ERROR: No se encontró el formulario authForm");
    return;
  }

  console.log("✅ Formulario encontrado, configurando listener");
  authForm.addEventListener("submit", manejarSubmit);
  console.log("✅ Listener configurado correctamente");
});

// ===== MANEJAR ENVÍO DEL FORMULARIO =====
async function manejarSubmit(e) {
  e.preventDefault();
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 SUBMIT - Formulario enviado");
  
  const emailInput = document.getElementById("email");
  const contraseñaInput = document.getElementById("contraseña");
  const usuarioInput = document.getElementById("usuario");
  const authForm = document.getElementById("authForm");
  
  if (!emailInput || !contraseñaInput) {
    console.error("❌ ERROR: No se encontraron los campos del formulario");
    alert("Error: Campos del formulario no encontrados");
    return;
  }
  
  const email = emailInput.value.trim();
  const contraseña = contraseñaInput.value.trim();
  const mode = authForm.dataset.mode || "login";
  
  console.log("📋 Datos del formulario:");
  console.log("  - Email:", email);
  console.log("  - Contraseña:", contraseña ? "✅ (oculta)" : "❌ vacía");
  console.log("  - Modo:", mode);

  // Validaciones
  if (!email || !contraseña) {
    console.error("❌ Validación fallida: campos vacíos");
    mostrarError("Por favor completa todos los campos");
    return;
  }

  if (!validarEmail(email)) {
    console.error("❌ Validación fallida: email inválido");
    mostrarError("Email inválido");
    return;
  }

  if (contraseña.length < 6) {
    console.error("❌ Validación fallida: contraseña muy corta");
    mostrarError("La contraseña debe tener al menos 6 caracteres");
    return;
  }

  // ⭐ Validación adicional para registro
  if (mode === "register") {
    const usuario = usuarioInput?.value.trim();
    
    if (!usuario) {
      console.error("❌ Validación fallida: usuario vacío");
      mostrarError("El nombre de usuario es obligatorio");
      return;
    }
    
    if (usuario.length < 3) {
      console.error("❌ Validación fallida: usuario muy corto");
      mostrarError("El usuario debe tener al menos 3 caracteres");
      return;
    }
    
    if (!/^[a-z0-9]+$/i.test(usuario)) {
      console.error("❌ Validación fallida: usuario con caracteres inválidos");
      mostrarError("El usuario solo puede contener letras y números");
      return;
    }
  }

  console.log("✅ Validaciones pasadas");

  // Deshabilitar botón
  const submitBtn = authForm.querySelector('button[type="submit"]');
  const btnOriginal = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Procesando...';

  try {
    let endpoint, body;

    if (mode === "login") {
      endpoint = "/usuarios/login";
      body = { email, contraseña };
      console.log("📝 Modo: LOGIN");
    } else {
      endpoint = "/usuarios/registrar";
      // ⭐ Usar el usuario ingresado por el usuario
      const usuario = usuarioInput.value.trim().toLowerCase();
      
      body = { 
        email, 
        usuario, 
        contraseña, 
        tipo: "usuario" 
      };
      console.log("📝 Modo: REGISTRO");
      console.log("📝 Usuario:", usuario);
    }

    const url = `${API_BASE}${endpoint}`;
    console.log("🌐 URL:", url);
    console.log("📤 Enviando datos:", { ...body, contraseña: "***" });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    console.log("📥 Respuesta recibida - Status:", response.status);

    const data = await response.json();
    console.log("📦 Datos de respuesta:", data);

    if (!response.ok) {
      console.error("❌ Respuesta no OK:", data);
      
      // ⭐ MANEJO MEJORADO DE ERRORES DE VALIDACIÓN
      if (data.errors && Array.isArray(data.errors)) {
        const errores = data.errors.map(err => err.msg).join('\n• ');
        throw new Error(`Errores de validación:\n• ${errores}`);
      }
      
      throw new Error(data.error || data.message || "Error en la autenticación");
    }

    console.log("✅ Autenticación exitosa");

    // ===== GUARDAR DATOS EN LOCALSTORAGE =====
    if (data.token) {
      localStorage.setItem("token", data.token);
      console.log("💾 Token guardado:", data.token.substring(0, 20) + "...");
    } else {
      console.warn("⚠️ No se recibió token en la respuesta");
    }

    let tipo = null;

    if (data.usuario) {
      const userId = data.usuario._id || data.usuario.id;
      tipo = data.usuario.tipo;
      
      localStorage.setItem("userId", userId);
      localStorage.setItem("userTipo", tipo);
      
      console.log("💾 Usuario guardado:");
      console.log("  - ID:", userId);
      console.log("  - Tipo:", tipo);
    } else {
      console.warn("⚠️ No se recibió objeto usuario en la respuesta");
      
      // ⭐ Si es REGISTRO y no viene usuario, asumir tipo "usuario" (cliente)
      if (mode === "register") {
        tipo = "usuario";
        localStorage.setItem("userTipo", tipo);
        console.log("💾 Tipo asumido en registro: usuario (cliente)");
        
        // Intentar obtener datos del usuario con el token
        if (data.token) {
          console.log("🔄 Intentando obtener datos del usuario...");
          // Continuar con la redirección, la verificación de sesión obtendrá los datos
        }
      }
    }

    mostrarExito(mode === "login" ? "¡Inicio de sesión exitoso!" : "¡Registro exitoso!");

    // ===== REDIRIGIR SEGÚN EL TIPO DE USUARIO =====
    console.log("🎯 Tipo de usuario detectado:", tipo);
    
    setTimeout(() => {
      console.log("🔄 INICIANDO REDIRECCIÓN...");
      
      if (tipo === "admin" || tipo === "empleado") {
        console.log("➡️ Redirigiendo a: html/admin.html");
        window.location.href = "html/admin.html";
      } else if (tipo === "usuario" || mode === "register") {
        // ⭐ Si es registro O tipo usuario, ir a usuario.html
        console.log("➡️ Redirigiendo a: html/usuario.html");
        window.location.href = "html/usuario.html";
      } else {
        console.error("❌ Tipo de usuario desconocido:", tipo);
        console.error("Estructura de data.usuario:", data.usuario);
        mostrarError("Error: Tipo de usuario no reconocido");
      }
      
      console.log("✅ Redirección ejecutada");
    }, 1500);

  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ ERROR EN AUTENTICACIÓN");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    mostrarError(error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = btnOriginal;
  }
}

// ===== VERIFICAR SESIÓN EXISTENTE Y REDIRIGIR =====
async function verificarYRedirigir(token) {
  try {
    console.log("🔍 Verificando sesión existente con token...");
    
    const response = await fetch(`${API_BASE}/usuarios/verificar-sesion`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("📥 Respuesta verificación - Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Sesión válida:", data);
      
      const tipo = data.usuario?.tipo;
      console.log("🎯 Tipo de usuario:", tipo);
      
      // Actualizar localStorage
      localStorage.setItem("userId", data.usuario._id || data.usuario.id);
      localStorage.setItem("userTipo", tipo);
      
      // Redirigir según tipo
      console.log("🔄 Redirigiendo (sesión existente)...");
      
      if (tipo === "admin" || tipo === "empleado") {
        console.log("➡️ A admin.html");
        window.location.href = "html/admin.html";
      } else if (tipo === "usuario") {
        console.log("➡️ A usuario.html");
        window.location.href = "html/usuario.html";
      }
    } else {
      console.log("❌ Sesión inválida, limpiando localStorage");
      localStorage.clear();
    }
  } catch (error) {
    console.error('❌ Error verificando sesión:', error);
    localStorage.clear();
  }
}

// ===== UTILIDADES =====
function validarEmail(email) {
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  console.log("📧 Validación email:", email, "->", valido ? "✅" : "❌");
  return valido;
}

function mostrarError(mensaje) {
  console.log("🔴 Mostrando error:", mensaje);
  
  const alerta = document.querySelector('.alerta');
  if (alerta) alerta.remove();

  const div = document.createElement('div');
  div.className = 'alerta alerta-error';
  div.style.cssText = `
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border-left: 5px solid #ef4444;
    color: #991b1b;
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-weight: 600;
    animation: slideDownAlert 0.3s ease;
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
    white-space: pre-line;
  `;
  div.textContent = `❌ ${mensaje}`;

  const form = document.getElementById("authForm");
  form?.insertBefore(div, form.firstChild);

  setTimeout(() => div.remove(), 5000);
}

function mostrarExito(mensaje) {
  console.log("🟢 Mostrando éxito:", mensaje);
  
  const alerta = document.querySelector('.alerta');
  if (alerta) alerta.remove();

  const div = document.createElement('div');
  div.className = 'alerta alerta-exito';
  div.style.cssText = `
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    border-left: 5px solid #10b981;
    color: #065f46;
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-weight: 600;
    animation: slideDownAlert 0.3s ease;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
  `;
  div.textContent = `✅ ${mensaje}`;

  const form = document.getElementById("authForm");
  form?.insertBefore(div, form.firstChild);
}

// ===== ESTILOS (usando IIFE para evitar conflictos) =====
(function() {
  const loginStyles = document.createElement('style');
  loginStyles.id = 'login-styles';
  loginStyles.textContent = `
    @keyframes slideDownAlert {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 3px solid rgba(255,255,255,0.3);
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
  document.head.appendChild(loginStyles);
})();

console.log("✅ login.js: Configuración completa");