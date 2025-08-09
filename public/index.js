document.addEventListener('DOMContentLoaded', () => {
  // === LOGIN ===
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const correo = document.getElementById('email').value;
      const contraseña = document.getElementById('password').value;

      try {
        const res = await fetch('/reto3/seguridad/umg2025/login/local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, contraseña })
        });

        const data = await res.json();

        if (res.ok) {
          if (data.requiere2FA) {
            // Pedir código TOTP al usuario
            const code = prompt('Introduce tu código 2FA');
            if (!code) {
              alert('Se requiere un código 2FA');
              return;
            }

            // Verificar el código contra el backend
            const res2 = await fetch('/reto3/seguridad/umg2025/login/local/2fa', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: data.userId, code })
            });

            const data2 = await res2.json();

            if (res2.ok) {
              localStorage.setItem('token', data2.token || '');
              window.location.href = '/reto3/seguridad/umg2025/protegido/protegido.html';
            } else {
              alert(data2.mensaje || 'Código 2FA inválido.');
            }
          } else {
            // Login normal (sin 2FA)
            localStorage.setItem('token', data.token || '');
            window.location.href = '/reto3/seguridad/umg2025/protegido/protegido.html';
          }
        } else {
          alert(data.mensaje || 'Error al iniciar sesión.');
        }
      } catch (err) {
        console.error(err);
        alert('Error al conectar con el servidor.');
      }
    });
  }

  // === REGISTRO ===
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nombre = document.getElementById('username').value;
      const correo = document.getElementById('email').value;
      const contraseña = document.getElementById('password').value;

      try {
        const res = await fetch('/reto3/seguridad/umg2025/registrar/local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, correo, contraseña })
        });

        const data = await res.json();

        if (res.ok) {
          alert('Usuario creado exitosamente.');
          window.location.href = 'index.html';
        } else {
          alert(data.mensaje || 'Error al crear el usuario.');
        }
      } catch (err) {
        console.error(err);
        alert('Error al conectar con el servidor.');
      }
    });
  }

  // === Integración con Microsoft ===
  const microsoftBtn = document.getElementById('microsoftLoginBtn');
  if (microsoftBtn) {
    microsoftBtn.addEventListener('click', () => {
      window.location.href = '/auth/azure/login';
    });
  }
});
