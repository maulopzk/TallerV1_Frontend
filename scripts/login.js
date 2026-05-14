function switchAuthTab(tab) {
  document.querySelectorAll('.login-card .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
}


//funcion de inicio de sesion
async function doLogin() {
  console.log('Intentando iniciar sesión...');

  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  console.log("Usuario:", username);
  console.log("Contraseña:", password);

  if (!username || !password) { 
    alert('⚠️ Ingresa usuario y contraseña');
    showToast('⚠️ Ingresa usuario y contraseña'); 
    return; 
  }

  const apiUrl = 'http://localhost:3000/api/login'; // Cambia a tu URL de backend
  // const apiUrl = 'https://backend-db-9fc8.onrender.com/api/login'; // Cambia a tu URL de backend
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!data.ok) { showToast('❌ ' + data.error); return; }
    sessionStorage.setItem('currentUser', JSON.stringify(data.usuario));

    // Redirigir según el rol del usuario
    if (data.usuario.IdRol === 1) 
    {
      window.location.href = '../pages/admin.html';
    } else if (data.usuario.IdRol === 2){
      window.location.href = '../pages/empleado.html';
    } else if (data.usuario.IdRol === 3){
      window.location.href = '../pages/cliente.html';
    }

  } catch (err) {
    showToast('❌ Error al conectar con el servidor');
  }
}

function limpiarFormulario() {
    // Lista de todos tus campos
    document.getElementById('cNombre').value = "";
    document.getElementById('cTelefono').value = "";
    document.getElementById('cCorreo').value = "";
    document.getElementById('cUsername').value = "";
    document.getElementById('cPass').value = "";
    document.getElementById('cPass2').value = "";
    
    console.log("Formulario limpio ✨");
}


//funcion de registro de un cliente nuevo dese el login
async function guardarClienteLogin() {

  console.log('Guardando cliente desde app...');

  const nombre = document.getElementById('cNombre').value.trim();
  const telefono = document.getElementById('cTelefono').value.trim();
  const correo = document.getElementById('cCorreo').value.trim();
  const username = document.getElementById('cUsername').value.trim();
  const password = document.getElementById('cPass').value.trim();
  const passconfirm = document.getElementById('cPass2').value.trim();

  if (!nombre || !correo || !telefono || !username || !password || !passconfirm) {
    alert('⚠️ Completa todos los campos');
    return;
  }

  if (password !== passconfirm) {
    alert('⚠️ Las contraseñas no coinciden');
    return;
  }

  const datosRegistro = {
    Nombre: nombre,
    Telefono: telefono,
    Correo: correo,
    Direccion: "",
    Username: username,
    Password: password,
    IdRol: 3
  };

  console.log('Paquete listo para enviar:', datosRegistro);
  
  const respuesta = await doRegister(datosRegistro);


    // 3. MANEJO DE LA RESPUESTA
    if (respuesta && respuesta.success) {
        // Si el servidor dijo que todo OK
        alert("✅ Registro exitoso");
        closeModal('clienteNuevoModal'); // Cerramos el modal
        limpiarFormulario();           // Opcional: borrar los campos
    } else {
        alert("❌ Error al registrar el cliente");
    }
}

//obtener catalogo

