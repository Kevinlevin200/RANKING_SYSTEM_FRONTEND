document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const volverBtn = document.getElementById("volverBtn");
  const inicio = document.getElementById("inicio");
  const formulario = document.getElementById("formulario");
  const formTitle = document.getElementById("formTitle");

  loginBtn.addEventListener("click", () => {
    formTitle.textContent = "Iniciar sesión";
    formulario.classList.remove("hidden");
    inicio.classList.add("hidden");
  });

  registerBtn.addEventListener("click", () => {
    formTitle.textContent = "Registrarse";
    formulario.classList.remove("hidden");
    inicio.classList.add("hidden");
  });

  volverBtn.addEventListener("click", () => {
    formulario.classList.add("hidden");
    inicio.classList.remove("hidden");
  });
});
