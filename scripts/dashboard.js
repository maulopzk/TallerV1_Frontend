// user sesion
const stored = sessionStorage.getItem('currentUser');
if (!stored) window.location.href = 'index.html';
let currentUser = JSON.parse(stored);

// ---------------------------------
// const API = 'http://localhost:3000/api';
const API = 'https://backend-db-9fc8.onrender.com/api'; 
let DB = { roles: [], clientes: [], empleados: [], catalogo: [], ordenes: [], detalleOrden: [], vehiculos: [], pagos: [] };

let cart = JSON.parse(localStorage.getItem('cart')) || []; 
let selectedOrderType = 'Compra';



async function init() {
  try {

    const [roles, clientes, empleados, catalogo, ordenes, detalle, vehiculos, pagos] = await Promise.all([
      fetch(`${API}/roles`).then(r => r.json()),
      fetch(`${API}/clientes`).then(r => r.json()),
      fetch(`${API}/empleados`).then(r => r.json()),
      fetch(`${API}/catalogo`).then(r => r.json()),
      fetch(`${API}/ordenes`).then(r => r.json()),
      fetch(`${API}/detalle-ordenes`).then(r => r.json()),
      fetch(`${API}/vehiculos`).then(r => r.json()),
      fetch(`${API}/pagos`).then(r => r.json()),
    ]);
    DB.roles = roles;
    DB.clientes = clientes;
    DB.empleados = empleados;
    DB.catalogo = catalogo;
    DB.ordenes = ordenes;
    DB.detalleOrden = detalle;
    DB.vehiculos = vehiculos;
    DB.pagos = pagos;

    loginAs(currentUser);
  } catch (err) {
    console.error('Error:', err);
    showToast('❌ Error al cargar datos');

  }
}

//----------------------------------



function loginAs(user) {
  currentUser = user;
  document.getElementById('appPage').classList.add('active');
  const rol = DB.roles.find(r => r.IdRol === user.IdRol);
  document.getElementById('topAvatar').textContent = user._nombre ? user._nombre[0].toUpperCase() : user.Username[0].toUpperCase();
  document.getElementById('topName').textContent = user._nombre || user.Username;
  document.getElementById('topRole').textContent = rol ? rol.Nombre : '—';
  buildSidebar();

}

// cerrar sesion
function doLogout() {
  sessionStorage.removeItem('currentUser');
  window.location.href = '../pages/index.html';
}


// ══ NAVEGACIÓN ══
const NAV_ADMIN = [
  {id:'dashPage', icon:'📊', label:'Dashboard'},
  {id:'adminCatalogPage', icon:'📦', label:'Catálogo'},
  {id:'adminUsersPage', icon:'👥', label:'Usuarios'},
  {id:'adminClientPage', icon:'👥', label:'Clientes'},
  {id:'adminOrdersPage', icon:'📋', label:'Órdenes'}
];
const NAV_EMP = [
  {id:'dashPage', icon:'📊', label:'Dashboard'},
  {id:'adminCatalogPage', icon:'📦', label:'Catálogo'},
  {id:'adminClientPage', icon:'👥', label:'Clientes'},
  {id:'adminOrdersPage', icon:'📋', label:'Órdenes'}
];
const NAV_CLIENT = [
  {id:'dashPage', icon:'📊', label:'Mi Panel'},
  {id:'clientCatalogPage', icon:'🔧', label:'Servicios'},
  {id:'clientOrdersPage', icon:'📋', label:'Mis Pedidos'},
  {id:'clientVehiclesPage', icon:'🚗', label:'Mis Vehículos'},

];

// construcción del menú lateral según rol
function buildSidebar() {
  const sb = document.getElementById('sidebar');
  let items = currentUser.IdRol === 1 ? NAV_ADMIN : currentUser.IdRol === 2 ? NAV_EMP : NAV_CLIENT;
  sb.innerHTML = '<div class="nav-section">Menú</div>' +
    items.map(n => `<div class="nav-item" data-page="${n.id}" onclick="navigateTo('${n.id}')"><span class="nav-icon">${n.icon}</span><span>${n.label}</span></div>`).join('');
  navigateTo('dashPage');
  document.getElementById('cartFab').classList.toggle('hidden', currentUser.IdRol !== 3);
}
// función de navegación entre páginas
function navigateTo(pageId) {
  document.querySelectorAll('.sub-page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.remove('hidden');
  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');
  if (pageId === 'dashPage') renderDash();
  if (pageId === 'adminCatalogPage') renderAdminCatalog();
  if (pageId === 'adminUsersPage') renderAdminUsers();

  if (pageId === 'adminClientPage') {
    renderClientes(currentUser.IdRol === 1);
}
   // clientes para empleado
  if (pageId === 'adminOrdersPage') renderAdminOrders();
  if (pageId === 'clientCatalogPage') renderClientCatalog();
  if (pageId === 'clientOrdersPage') renderClientOrders();
  if (pageId === 'clientVehiclesPage') renderClientVehicles();
}

// ══ DASHBOARD ══
function renderDash() {
  document.getElementById('dashName').textContent = currentUser._nombre || currentUser.Username;
  const isAdmin = currentUser.IdRol <= 2;
  const statsRow = document.getElementById('statsRow');
  const totalRevenue = DB.detalleOrden.reduce((s, d) => s + d.Precio * d.Cantidad, 0);



  if (isAdmin) {
  statsRow.innerHTML = `
    <div class="stat-card"><div class="num">${DB.empleados.filter(u => u.Activo).length}</div><div class="lbl">Empleados activos</div></div>
    <div class="stat-card"><div class="num">${DB.clientes.length}</div><div class="lbl">Clientes registrados</div></div>
    <div class="stat-card"><div class="num">${DB.ordenes.length}</div><div class="lbl">Órdenes totales</div></div>
    <div class="stat-card"><div class="num">$${(totalRevenue / 1000).toFixed(1)}k</div><div class="lbl">Ingresos totales</div></div>`;
} else {
    const misOrdenes = DB.ordenes.filter(o => o.IdCliente === currentUser.IdCliente);
    statsRow.innerHTML = `
      <div class="stat-card"><div class="num">${misOrdenes.length}</div><div class="lbl">Mis pedidos</div></div>
      <div class="stat-card"><div class="num">${misOrdenes.filter(o => o.Estado === 'Pendiente').length}</div><div class="lbl">Pendientes</div></div>
      <div class="stat-card"><div class="num">${misOrdenes.filter(o => o.Estado === 'Completado').length}</div><div class="lbl">Completados</div></div>
      <div class="stat-card"><div class="num">${DB.catalogo.filter(c => c.Activo).length}</div><div class="lbl">Servicios disp.</div></div>`;
  }

  const feed = document.getElementById('activityFeed');
  const recentOrders = [...DB.ordenes].slice(0, 5);
  feed.innerHTML = recentOrders.map(o => {
    const cli = DB.clientes.find(c => c.IdCliente === o.IdCliente);
    return `<li><span class="activity-dot"></span><div><strong>${o.Tipo}</strong> · ${cli ? cli.Nombre : '—'}<div style="color:var(--muted);font-size:12px">${o.Fecha} · ${o.Estado}</div></div></li>`;
  }).join('');

  const canvas = document.getElementById('ordersChart');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 300, 200);
    const types = ['Compra', 'Reservacion', 'Apartado'];
    const colors = ['#179217', '#ff6b35', '#1a8aff'];
    const counts = types.map(t => DB.ordenes.filter(o => o.Tipo === t).length);
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    let startAngle = -Math.PI / 2;
    const cx = 150, cy = 95, r = 70, ri = 42;
    counts.forEach((c, i) => {
      const angle = (c / total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + angle);
      ctx.closePath(); ctx.fillStyle = colors[i]; ctx.fill();
      startAngle += angle;
    });
    ctx.beginPath(); ctx.arc(cx, cy, ri, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f0f0'; ctx.fill();//0a0a0a
    ctx.fillStyle = '#000000'; ctx.font = '22px Bebas Neue';//f0f0f0
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(DB.ordenes.length, cx, cy);
    types.forEach((t, i) => {
      ctx.fillStyle = colors[i]; ctx.fillRect(20, 168 + i * 22, 14, 14);
      ctx.fillStyle = '#000000'; ctx.font = '13px Bebas Neue';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(`${t}: ${counts[i]}`, 40, 175 + i * 22);
    });
  }
}

// ══ ADMIN CATÁLOGO ══


// ------------------------
function renderAdminCatalog() {
  const q = (document.getElementById('catalogSearch') || { value: '' }).value.toLowerCase();
  const tbody = document.getElementById('adminCatalogTbody');
  const rows = DB.catalogo.filter(p => !q || p.Nombre.toLowerCase().includes(q) || p.Descripcion.toLowerCase().includes(q));
  tbody.innerHTML = rows.map(p => `
    <tr>


      <td style="text-align:center">
        <img src="${p.Imagen}" alt="${p.Nombre}" 
        style="width:50px;height:50px;object-fit:cover;border-radius:8px;" 
        onerror="this.src='https://placehold.co/50x50?text=N/A'" />
      </td>
      <td><strong>${p.Nombre}</strong></td>
      <td style="color:var(--muted);font-size:13px">${p.Descripcion}</td>
      <td style="color:var(--accent);font-family:'Bebas Neue',sans-serif;font-size:18px">$${p.Precio.toFixed(2)}</td>
      <td><span class="tag ${p.Activo ? 'tag-done' : 'tag-cancelled'}">${p.Activo ? 'Activo' : 'Inactivo'}</span></td>
      <td><div class="actions-cell">
        <button class="btn btn-ghost" style="padding:5px 10px;font-size:12px" onclick="openCatalogModal(${p.IdProducto})">✏️ Editar</button>
        <button class="btn btn-danger" style="padding:5px 10px;font-size:12px" onclick="deleteCatalog(${p.IdProducto})">🗑</button>
      </div></td>

      
    </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">Sin resultados</td></tr>';
}


// abrir modal de edición/creación de producto
function openCatalogModal(id) {
  document.getElementById('catalogEditId').value = id || '';
  document.getElementById('catalogModalTitle').textContent = id ? 'Editar Producto' : 'Nuevo Producto';
  
  if (id) {
    const p = DB.catalogo.find(x => x.IdProducto === id);
    document.getElementById('catName').value = p.Nombre;
    document.getElementById('catDesc').value = p.Descripcion;
    document.getElementById('catPrice').value = p.Precio;
    document.getElementById('catEmoji').value = p.Imagen;
    document.getElementById('catActivo').value = p.Activo == true || p.Activo == 1 || p.Activo === '1' ? '1' : '0';
  } else {
    ['catName', 'catDesc', 'catPrice', 'catEmoji'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('catActivo').value = '1';
  }
  openModal('catalogModal');
}

//guardar producto (crear o actualizar según si tiene id)
async function saveCatalog() {
  const id = document.getElementById('catalogEditId').value;
  const Nombre = document.getElementById('catName').value.trim();
  const Descripcion = document.getElementById('catDesc').value.trim();
  const Precio = parseFloat(document.getElementById('catPrice').value);
  const Imagen = document.getElementById('catEmoji').value.trim() || '🔧';
  const Activo = parseInt(document.getElementById('catActivo').value);
  if (!Nombre || isNaN(Precio)) { showToast('⚠️ Nombre y precio son requeridos'); return; }
  try {
    const res = await fetch(`${API}/catalogo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IdProducto: id ? parseInt(id) : null, Nombre, Descripcion, Precio, Imagen, Activo })
    });
    const data = await res.json();
    if (!data.ok) { showToast('❌ Error al guardar'); return; }
    showToast(id ? '✅ Producto actualizado' : '✅ Producto creado');
    closeModal('catalogModal');
    DB.catalogo = await fetch(`${API}/catalogo`).then(r => r.json());
    renderAdminCatalog();
  } catch (err) { showToast('❌ Error al conectar'); }
}

//eliminar producto(borrado logico, se mantiene en BD pero se marca como inactivo)
async function deleteCatalog(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await fetch(`${API}/catalogo/${id}`, { method: 'DELETE' });
    showToast('🗑 Producto eliminado');
    DB.catalogo = await fetch(`${API}/catalogo`).then(r => r.json());
    renderAdminCatalog();
  } catch (err) { showToast('❌ Error al eliminar'); }
}


//---------------------------




//----------------------
// ══ ADMIN USUARIOS ══
function renderAdminUsers() {
  console.log(DB.empleados[0])
  const q = (document.getElementById('usersSearch') || { value: '' }).value.toLowerCase();
  const tbody = document.getElementById('adminUsersTbody');
  const rows = DB.empleados.filter(u => !q || u.Username.toLowerCase().includes(q) || (u.Nombre || '').toLowerCase().includes(q));
  tbody.innerHTML = rows.map(u => {
    const rol = DB.roles.find(r => r.IdRol === u.IdRol);
    return `<tr>
      <td style="color:var(--muted)">#${u.IdEmpleado}</td>
      <td><strong>${u.Username}</strong></td>
      <td>${u.Nombre || '—'}</td>
      <td>${u.Puesto || '—'}</td>
      <td><span class="tag" style="background:rgba(232,160,32,.12);color:var(--accent)">${rol ? rol.Nombre : '—'}</span></td>
      <td style="color:var(--muted);font-size:13px">${u.Correo || '—'}</td>
      <td><span class="tag ${u.Activo ? 'tag-done' : 'tag-cancelled'}">${u.Activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>
      <div class="actions-cell">

        <button class="btn btn-ghost" style="padding:5px 10px;font-size:12px" onclick="openUserModal(${u.IdEmpleado})">✏️</button>
        <button class="btn btn-danger" style="padding:5px 10px;font-size:12px" onclick="borrarEmpleado(${u.IdEmpleado})">🗑</button>

      </div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">Sin resultados</td></tr>';
}


  
function renderClientes(admin = false) {
  console.log('Renderizando clientes...');
  console.log(DB.clientes);
  console.log(DB.clientes[0]);
    const q = (document.getElementById('usersSearch') || { value: '' }).value.toLowerCase();

    const tbody = document.getElementById('ClientesBody');
    //const tbody = document.getElementById('adminClientTbody');


    const rows = DB.clientes.filter(c =>
      !q ||
      c.Nombre.toLowerCase().includes(q) ||
      (c.Correo || '').toLowerCase().includes(q)
    );

    tbody.innerHTML = rows.map(c => `
      <tr>
        <td style="color:var(--muted)">#${c.IdCliente}</td>
        <td><strong>${c.Nombre}</strong></td>
        <td>${c.Telefono || '—'}</td>
        <td style="color:var(--muted);font-size:13px">${c.Correo || '—'}</td>
        <td>${c.Direccion || '—'}</td>

        ${admin ? `
      <td>
        <div class="actions-cell">
          <button class="btn btn-ghost"onclick="editarCliente(${c.IdCliente})">✏️       
          </button>
          <button class="btn btn-danger"onclick="borrarCliente(${c.IdCliente})">🗑        
          </button>
        </div>
      </td>
      ` : ''}
      </tr>
    `).join('');
}

// abrir modal de edición/creación de cliente
function editarCliente(id) {
  console.log('Editar cliente:', id);
  document.getElementById('clienteEditId').value = id || '';

  const title = document.querySelector('#clienteModal h3');
  title.textContent = id ? 'Editar Cliente' : 'Nuevo Cliente';

  if (id) {
    const c = DB.clientes.find(x => x.IdCliente === id);

    document.getElementById('cNombre').value = c.Nombre || '';
    document.getElementById('cTelefono').value = c.Telefono || '';
    document.getElementById('cCorreo').value = c.Correo || '';
    document.getElementById('cDireccion').value = c.Direccion || '';

  } else {
    document.getElementById('cNombre').value = '';
    document.getElementById('cTelefono').value = '';
    document.getElementById('cCorreo').value = '';
    document.getElementById('cDireccion').value = '';
  }

  openModal('clienteModal');

}

async function borrarCliente(idCliente) {
  console.log('Borrar cliente:', idCliente);
  if (!confirm('¿Eliminar cliente?')) return;

  try {

    await fetch(`${API}/clientes/${idCliente}`, {
      method: 'DELETE'
    });

    DB.clientes = await fetch(`${API}/clientes`)
      .then(r => r.json());

    renderClientes(currentUser.IdRol === 1);

    showToast('✅ Cliente eliminado');

  } catch (err) {

    showToast('❌ Error al eliminar');

  }
}

// abrir modal de edición/creación de usuario
function openUserModal(id) {

  document.getElementById('userEditId').value = id || '';
  document.getElementById('userModalTitle').textContent = id ? 'Editar Empleado' : 'Nuevo Empleado';
  document.getElementById('uPassGroup').style.display = id ? 'none' : 'block';
  if (id) {
    const u = DB.empleados.find(x => x.IdEmpleado === id);
    document.getElementById('uNombre').value = u.Nombre || '';
    document.getElementById('uTel').value = u.Telefono || '';
    document.getElementById('uCorreo').value = u.Correo || '';
    document.getElementById('uUsername').value = u.Username;
    document.getElementById('uRol').value = u.IdRol;
    document.getElementById('uActivo').value = u.Activo;
    if (document.getElementById('uPuesto')) document.getElementById('uPuesto').value = u.Puesto || '';
  } else {
    ['uNombre', 'uTel', 'uCorreo', 'uUsername', 'uPass'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('uRol').value = '2';
    document.getElementById('uActivo').value = '1';
    if (document.getElementById('uPuesto')) document.getElementById('uPuesto').value = '';
  }
  openModal('userModal');
}

//guardar usuario (crear o actualizar según si tiene id)
async function saveUser() {
  const id       = document.getElementById('userEditId').value;
  const nombre   = document.getElementById('uNombre').value.trim();
  const telefono = document.getElementById('uTel').value.trim();
  const correo   = document.getElementById('uCorreo').value.trim();
  const username = document.getElementById('uUsername').value.trim();
  const password = document.getElementById('uPass').value.trim();
  const IdRol    = parseInt(document.getElementById('uRol').value);
  const Activo   = parseInt(document.getElementById('uActivo').value);
  const puesto   = document.getElementById('uPuesto') ? document.getElementById('uPuesto').value.trim() : '';
  if (!nombre || !username) { showToast('⚠️ Nombre y username son requeridos'); return; }

  let IdEmpleado = null, IdUsuario = null;
  if (id) {
    const emp = DB.empleados.find(x => x.IdEmpleado === parseInt(id));
    IdEmpleado = emp.IdEmpleado;
    IdUsuario  = emp.IdUsuario;
  }

  try {
    const res = await fetch(`${API}/empleados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IdEmpleado, IdUsuario, nombre, telefono, correo, puesto, username, password, IdRol, Activo })
    });
    const data = await res.json();
    if (!data.ok) { showToast('❌ ' + data.error); return; }
    showToast(id ? '✅ Empleado actualizado' : '✅ Empleado creado');
    closeModal('userModal');
    DB.empleados = await fetch(`${API}/empleados`).then(r => r.json());
    renderAdminUsers();
  } catch (err) { showToast('❌ Error al conectar'); }
}

async function borrarEmpleado(id) {
  console.log('Cambiar estado empleado:', id);
  const emp = DB.empleados.find(e => e.IdEmpleado === id);
  const isActive = emp.Activo == true || emp.Activo == 1 || emp.Activo === '1';
  
  console.log('Cambiar estado empleado:', id);
  if (!confirm(`¿Deseas ${isActive ? 'desactivar' : 'reactivar'} a ${emp.Nombre || emp.Username}?`)) return;

  try {
    await fetch(`${API}/empleados/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Activo: isActive ? 0 : 1 })
    });

    DB.empleados = await fetch(`${API}/empleados`).then(r => r.json());
    renderAdminUsers();
    showToast(isActive ? '🔒 Empleado desactivado' : '✅ Empleado reactivado');

  } catch (err) {
    showToast('❌ Error al actualizar estado');
  }
}

// eliminar usuario de forma definitiva
async function deleteUser(id) {
  if (!confirm('¿Eliminar este empleado?')) return;
  try {
    await fetch(`${API}/empleados/${id}`, { method: 'DELETE' });
    showToast('🗑 Empleado eliminado');
    DB.empleados = await fetch(`${API}/empleados`).then(r => r.json());
    renderAdminUsers();
  } catch (err) { showToast('❌ Error al eliminar'); }
}


//---------------------
// ordenes admin
function renderAdminOrders() {
  const q  = (document.getElementById('ordersSearch') || { value: '' }).value.toLowerCase();
  const tf = (document.getElementById('ordersFilter') || { value: '' }).value;
  const sf = (document.getElementById('ordersStatusFilter') || { value: '' }).value;
  const tbody = document.getElementById('adminOrdersTbody');
  const rows = DB.ordenes.filter(o => {
    const cli = DB.clientes.find(c => c.IdCliente === o.IdCliente);
    return (!q || (cli && cli.Nombre.toLowerCase().includes(q))) &&
           (!tf || o.Tipo === tf) && (!sf || o.Estado === sf);
  });
  tbody.innerHTML = rows.map(o => {
    const cli = DB.clientes.find(c => c.IdCliente === o.IdCliente);
    const total = DB.detalleOrden.filter(d => d.IdOrden === o.IdOrden).reduce((s, d) => s + d.Precio * d.Cantidad, 0);
    const tagCls = o.Estado === 'Completado' ? 'tag-done' : o.Estado === 'Cancelado' ? 'tag-cancelled' : 'tag-pending';
    return `<tr>
      <td style="font-family:'Bebas Neue',sans-serif;color:var(--accent)">#${o.IdOrden}</td>
      <td>${cli ? cli.Nombre : '—'}</td>
      <td>${o.Tipo}</td>
      <td style="color:var(--muted);font-size:13px">${o.Fecha}</td>
      <td style="font-family:'Bebas Neue',sans-serif">$${total.toFixed(2)}</td>
      <td><span class="tag ${tagCls}">${o.Estado}</span></td>
      <td><div class="actions-cell">
        <button class="btn btn-ghost" style="padding:5px 10px;font-size:12px" onclick="showOrderDetail(${o.IdOrden})">Ver</button>
        <button class="btn btn-success" style="padding:5px 10px;font-size:12px" onclick="changeOrderStatus(${o.IdOrden},'Completado')">✔</button>
        <button class="btn btn-danger" style="padding:5px 10px;font-size:12px" onclick="changeOrderStatus(${o.IdOrden},'Cancelado')">✘</button>
      </div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">Sin órdenes</td></tr>';
}

async function changeOrderStatus(idOrden, Estado) {
  try {
    await fetch(`${API}/ordenes/${idOrden}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Estado })
    });
    showToast('✅ Estado actualizado');
    DB.ordenes = await fetch(`${API}/ordenes`).then(r => r.json());
    renderAdminOrders();
  } catch (err) { showToast('❌ Error al actualizar'); }
}

// catalogo cliente
function renderClientCatalog() {
  const q = (document.getElementById('clientCatalogSearch') || { value: '' }).value.toLowerCase();
  const grid = document.getElementById('clientCatalogGrid');
  const items = DB.catalogo.filter(p => p.Activo && (!q || p.Nombre.toLowerCase().includes(q) || p.Descripcion.toLowerCase().includes(q)));
  grid.innerHTML = items.map(p => `
    <div class="cat-card">
      <div class="cat-img">
        <img src="${p.Imagen}" alt="${p.Nombre}"
             style="width:100%;height:100%;object-fit:cover;"
             onerror="this.src='https://placehold.co/300x200?text=N/A'" />
      </div>
      <div class="cat-body">
        <div class="cat-name">${p.Nombre}</div>
        <div class="cat-desc">${p.Descripcion}</div>
        <div class="cat-price">$${p.Precio.toFixed(2)}</div>
        <div class="cat-actions">
          <button class="btn btn-accent" style="flex:1" onclick="addToCart(${p.IdProducto})">+ Agregar</button>
        </div>
      </div>
    </div>`).join('') || '<div style="color:var(--muted);padding:30px">Sin productos disponibles</div>';
}

// function addToCart(idProducto) {
//   const p = DB.catalogo.find(x => x.IdProducto === idProducto);
//   if (!p) return;
//   const existing = cart.find(c => c.IdProducto === idProducto);
//   if (existing) { existing.Cantidad++; }
//   else { cart.push({ IdProducto: idProducto, Nombre: p.Nombre, Precio: p.Precio, Imagen: p.Imagen, Cantidad: 1 }); }
//   updateCartBadge();
//   showToast(`✅ ${p.Nombre} añadido al carrito`);
// }

function updateCartBadge() {
  const count = cart.reduce((s, c) => s + c.Cantidad, 0);
  const badge = document.getElementById('cartCount');
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

// carro de compra
function openCartModal() {
  const cartItems = document.getElementById('cartItems');
  cartItems.innerHTML = cart.length === 0
    ? '<div style="color:var(--muted);text-align:center;padding:30px">Tu carrito está vacío</div>'
    : cart.map(c => `
      <div class="cart-item">
        <div class="cart-item-icon">${c.Imagen}</div>
        <div><div class="cart-item-name">${c.Nombre}</div><div class="cart-item-price">$${c.Precio.toFixed(2)} c/u</div></div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="cartQty(${c.IdProducto},-1)">−</button>
          <span style="min-width:20px;text-align:center">${c.Cantidad}</span>
          <button class="qty-btn" onclick="cartQty(${c.IdProducto},1)">+</button>
          <button class="qty-btn" onclick="cartRemove(${c.IdProducto})" style="color:var(--danger);border-color:var(--danger)">✕</button>
        </div>
      </div>`).join('');
  document.getElementById('cartTotal').textContent = '$' + cart.reduce((s, c) => s + c.Precio * c.Cantidad, 0).toFixed(2);
  openModal('cartModal');
}

function cartQty(id, delta) {
  const item = cart.find(c => c.IdProducto === id);
  if (!item) return;
  item.Cantidad += delta;
  
  if (item.Cantidad <= 0) {
    cartRemove(id);
  } else { 
    saveCart();
    updateCartBadge(); 
    openCartModal(); // Refrescamos el modal para ver el cambio
  }
}

function cartRemove(id) {
  cart = cart.filter(c => c.IdProducto !== id);
  saveCart();
  updateCartBadge();
  openCartModal();
}

async function placeOrder() {
  if (cart.length === 0) { showToast('⚠️ Tu carrito está vacío'); return; }
  
  try {
    const res = await fetch(`${API}/ordenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        IdCliente: currentUser.IdCliente, // Usamos el ID del usuario logueado
        Tipo: selectedOrderType,
        items: cart.map(c => ({ IdProducto: c.IdProducto, Cantidad: c.Cantidad, Precio: c.Precio }))
      })
    });
    
    const data = await res.json();
    if (!data.ok) { showToast('❌ Error al crear orden'); return; }
    
    // LIMPIEZA
    cart = [];
    localStorage.removeItem('cart'); // Borramos el carrito del navegador
    
    updateCartBadge();
    closeModal('cartModal');
    showToast(`✅ ${selectedOrderType} confirmada. #${data.IdOrden}`);
    
    // Refrescamos datos locales
    DB.ordenes = await fetch(`${API}/ordenes`).then(r => r.json());
    DB.detalleOrden = await fetch(`${API}/detalle-ordenes`).then(r => r.json());
    navigateTo('clientOrdersPage');
    
  } catch (err) { 
    showToast('❌ Error al conectar con el servidor'); 
  }
}

// mis pedidos - cliente
function renderClientOrders() {
  const tbody = document.getElementById('clientOrdersTbody');
  const misOrdenes = DB.ordenes.filter(o => o.IdCliente === currentUser.IdCliente);
  tbody.innerHTML = misOrdenes.map(o => {
    const total = DB.detalleOrden.filter(d => d.IdOrden === o.IdOrden).reduce((s, d) => s + d.Precio * d.Cantidad, 0);
    const tagCls = o.Estado === 'Completado' ? 'tag-done' : o.Estado === 'Cancelado' ? 'tag-cancelled' : 'tag-pending';
    return `<tr>
      <td style="font-family:'Bebas Neue',sans-serif;color:var(--accent)">#${o.IdOrden}</td>
      <td>${o.Tipo}</td>
      <td style="color:var(--muted);font-size:13px">${o.Fecha}</td>
      <td style="font-family:'Bebas Neue',sans-serif">$${total.toFixed(2)}</td>
      <td><span class="tag ${tagCls}">${o.Estado}</span></td>
      <td><button class="btn btn-ghost" style="padding:5px 12px;font-size:12px" onclick="showOrderDetail(${o.IdOrden})">Ver detalle</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">Sin pedidos aún</td></tr>';
}

// ══ DETALLE DE ORDEN  ══
function showOrderDetail(idOrden) {
  const o = DB.ordenes.find(x => x.IdOrden === idOrden);
  const cli = DB.clientes.find(c => c.IdCliente === o.IdCliente);
  const detalles = DB.detalleOrden.filter(d => d.IdOrden === idOrden);
  const total = detalles.reduce((s, d) => s + d.Precio * d.Cantidad, 0);
  const tagCls = o.Estado === 'Completado' ? 'tag-done' : o.Estado === 'Cancelado' ? 'tag-cancelled' : 'tag-pending';

  // 1. AJUSTE DE ANCHO: Forzamos el modal a ser más ancho
  const modalElem = document.querySelector('#orderDetailModal .modal');
  if (modalElem) modalElem.style.width = 'min(850px, 95vw)';

  document.getElementById('orderDetailContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:25px;padding-bottom:15px;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;color:var(--accent);letter-spacing:1px">ORDEN #${o.IdOrden}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:2px">Fecha: ${new Date(o.Fecha).toLocaleString()}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;font-size:16px">${cli ? cli.Nombre : '—'}</div>
        ${cli ? `<div style="font-size:12px;color:var(--muted)">${cli.Telefono} • ${cli.Correo}</div>` : ''}
        <span class="tag ${tagCls}" style="display:inline-block;margin-top:8px;padding:4px 12px;font-size:11px">${o.Estado.toUpperCase()}</span>
      </div>
    </div>

    <table style="width:100%; border-collapse: collapse;">
      <thead>
        <tr style="text-align:left; border-bottom:2px solid var(--border); color:var(--muted); font-size:12px; text-transform:uppercase">
          <th style="padding:10px 5px">Servicio / Producto</th>
          <th style="padding:10px 5px">Cant.</th>
          <th style="padding:10px 5px">Precio Unit.</th>
          <th style="padding:10px 5px; text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${detalles.map(d => {
          const prod = DB.catalogo.find(p => p.IdProducto === d.IdProducto);
          // 2. CORRECCIÓN DE IMAGEN: Usamos la etiqueta <img> en lugar de solo el texto
          const imgSrc = (prod && prod.Imagen && prod.Imagen !== '???') ? prod.Imagen : 'https://via.placeholder.com/60?text=Servicio';
          
          return `
          <tr style="border-bottom:1px solid var(--border)">
            <td style="padding:15px 5px; display:flex; align-items:center; gap:15px">
              <img src="${imgSrc}" style="width:55px; height:55px; border-radius:10px; object-fit:cover; background:#f5f5f5" onerror="this.src='https://via.placeholder.com/60?text=Error'">
              <div style="font-weight:600; font-size:15px">${prod ? prod.Nombre : 'Servicio eliminado'}</div>
            </td>
            <td style="padding:15px 5px">${d.Cantidad}</td>
            <td style="padding:15px 5px; color:var(--muted)">$${d.Precio.toFixed(2)}</td>
            <td style="padding:15px 5px; text-align:right; font-family:'Bebas Neue',sans-serif; color:var(--accent); font-size:20px">
              $${(d.Precio * d.Cantidad).toFixed(2)}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div style="text-align:right; margin-top:25px; padding:20px; background:rgba(0,0,0,0.02); border-radius:12px">
      <span style="color:var(--muted); font-weight:600; font-size:14px; margin-right:15px">TOTAL DE LA ORDEN:</span>
      <span style="font-family:'Bebas Neue',sans-serif; font-size:36px; color:var(--accent); line-height:1">$${total.toFixed(2)}</span>
    </div>`;

  openModal('orderDetailModal');
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2800);
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});

function agregarvehiculo() {
  console.log('Agregar vehículo'); // Verificar que se llama a la función
}


function renderClientVehicles() {
  console.log('vehiculos en DB:', DB.vehiculos);       // ← ¿tiene datos?
  console.log('usuario actual:', currentUser);  
  const tbody = document.getElementById('clientVehiclesTbody');
  const vehiculos = DB.vehiculos.filter(v => v.IdCliente === currentUser.IdCliente);

  tbody.innerHTML = vehiculos.map(v => `
    <tr>
      <td>${v.Marca}</td>
      <td>${v.Modelo}</td>
      <td>${v.Anio}</td>
      <td>${v.Placa}</td>
      <td><div class="actions-cell">
        <button class="btn btn-ghost" style="padding:5px 10px;font-size:12px" onclick="editVehiculo(${v.IdVehiculo})">✎ Editar</button>
        <button class="btn btn-danger" style="padding:5px 10px;font-size:12px" onclick="deleteVehiculo(${v.IdVehiculo})">✘ Eliminar</button>
      </div></td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">No tienes vehículos registrados</td></tr>';
}



function openModal2(id) {
  const modal = document.getElementById(id);
  
  if (modal) {
    // Aplicamos los estilos directamente desde JS
    modal.style.display = 'flex';           // Lo hace visible
    modal.style.position = 'fixed';        // Se asegura de que flote sobre todo
    modal.style.zIndex = '9999';           // Lo pone al frente
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)'; // Oscurece el fondo
    
    console.log("Modal abierto con estilos inyectados");
  } else {
    console.error("No se encontró el elemento con ID:", id);
  }
}

function closeModal2(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none'; // Lo oculta de nuevo
  }
}


function limpiarFormulario() {
    // Lista de todos tus campos
    document.getElementById('cNombre').value = "";
    document.getElementById('cTelefono').value = "";
    document.getElementById('cCorreo').value = "";
    document.getElementById('cDireccion').value = "";
    document.getElementById('cUsername').value = "";
    document.getElementById('cPass').value = "";
    document.getElementById('cPass2').value = "";
    
    console.log("Formulario limpio ✨");
}



async function guardarClienteApp() {

  console.log('Guardando cliente desde app...');

  const nombre = document.getElementById('cNombre').value.trim();
  const telefono = document.getElementById('cTelefono').value.trim();
  const correo = document.getElementById('cCorreo').value.trim();
  const direccion = document.getElementById('cDireccion').value.trim();
  const username = document.getElementById('cUsername').value.trim();
  const password = document.getElementById('cPass').value.trim();
  const passconfirm = document.getElementById('cPass2').value.trim();

  if (!nombre || !correo || !telefono || !username || !password) {
    showToast('⚠️ Todos los campos son obligatorios');
    return;
  }

  if (password !== passconfirm) {
    showToast('⚠️ Las contraseñas no coinciden');
    return;
  }

  const datosRegistro = {
    Nombre: nombre,
    Telefono: telefono,
    Correo: correo,
    Direccion: direccion,
    Username: username,
    Password: password,
    IdRol: 3
  };

  console.log('Paquete listo para enviar:', datosRegistro);


  const respuesta = await doRegister(datosRegistro);

  if (respuesta && respuesta.success) {
    showToast('✅ Cliente registrado correctamente');
    closeModal('clienteNuevoModal');
    limpiarFormulario();
  } else {
    showToast('❌ Error: ' + (respuesta?.message || 'No se pudo registrar'));
  }
}




function openClientModal() {

  console.log('Abriendo modal para nuevo registro'); 
  const title = document.querySelector('#clienteNuevoModal h3');
  if (title) title.textContent = 'Nuevo Cliente';

  const editId = document.getElementById('clienteEditId');
  if (editId) editId.value = '';
  const passGroup = document.getElementById('cPassGroup');
  if (passGroup) {
    passGroup.style.display = 'block';
  } else {
    console.warn("Advertencia: No se encontró el ID 'cPassGroup' en el HTML");
  }
  const campos = ['cNombre', 'cTelefono', 'cCorreo', 'cDireccion', 'cUsername', 'cPass'];
  campos.forEach(idCampo => {
    const el = document.getElementById(idCampo);
    if (el) el.value = '';
  });

  openModal2('clienteNuevoModal'); //abri modal
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart)); // Guarda el estado actual
}

function addToCart(idProducto) {
  const p = DB.catalogo.find(x => x.IdProducto === idProducto);
  if (!p) return;
  
  const existing = cart.find(c => c.IdProducto === idProducto);
  if (existing) { 
    existing.Cantidad++; 
  } else { 
    // Guardamos los datos necesarios del producto
    cart.push({ 
      IdProducto: idProducto, 
      Nombre: p.Nombre, 
      Precio: p.Precio, 
      Imagen: p.Imagen, 
      Cantidad: 1 
    }); 
  }
  
  saveCart(); // Persistimos en LocalStorage
  updateCartBadge();
  showToast(`✅ ${p.Nombre} añadido al carrito`);
}





init();