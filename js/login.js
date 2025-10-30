document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("authForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const contraseña = document.getElementById("contraseña").value.trim();

    if (!email || !contraseña) {
      alert("Por favor completa todos los campos.");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/v1/usuarios/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, contraseña }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión.");
      }

      // Guardar token en localStorage
      localStorage.setItem("token", data.token);

      // Redirigir según tipo de usuario
      const tipo = data.usuario?.tipo;
      if (tipo === "admin") {
        window.location.href = "html/admin.html";
      } else if (tipo === "usuario") {
        window.location.href = "html/usuario.html";
      } else {
        alert("Tipo de usuario desconocido.");
      }
    } catch (error) {
      console.error("❌ Error en login:", error.message);
      alert("Error: " + error.message);
    }
  });
});
