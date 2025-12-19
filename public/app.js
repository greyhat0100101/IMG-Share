const content = document.getElementById('content');
const viewTitle = document.getElementById('viewTitle');
const orgList = document.getElementById('orgList');
const modal = document.getElementById('modal');

let currentOrg = null;
let currentAlbum = null;

/* =====================
   HELPERS
===================== */
async function api(url, options) {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || 'Error');
  }
  return json.data;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showModal(innerHtml) {
  modal.innerHTML = `
    <div class="modal-box">
      ${innerHtml}
    </div>
  `;
  modal.classList.remove('hidden');

  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

function closeModal() {
  modal.classList.add('hidden');
  modal.innerHTML = '';
  modal.onclick = null;
}

function showDeleteConfirmModal(itemName, itemType, onConfirm) {
  showModal(`
    <h3><i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> Confirmar eliminación</h3>
    <p style="color: #cbd5e0; margin-bottom: 16px;">
      Para eliminar <strong style="color: #f87171;">${itemType}</strong>, debes escribir su nombre:
    </p>
    <p style="background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; color: #fca5a5; border-left: 3px solid #ef4444; margin-bottom: 16px;">
      <strong>"${itemName}"</strong>
    </p>
    <input id="deleteConfirmInput" placeholder="Escribe el nombre aquí..." style="margin-bottom: 16px;" />
    <br>
    <button onclick="confirmDelete('${itemName}', '${onConfirm}')" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white;">
      <i class="fas fa-trash"></i> Eliminar
    </button>
    <button onclick="closeModal()" style="background: rgba(226, 232, 240, 0.05); color: #cbd5e0;">
      <i class="fas fa-times"></i> Cancelar
    </button>
  `);
  
  // Enfocar el input automáticamente
  setTimeout(() => {
    const input = document.getElementById('deleteConfirmInput');
    if (input) input.focus();
  }, 100);
}

window.confirmDelete = function(expectedName, callbackName) {
  const input = document.getElementById('deleteConfirmInput');
  if (input.value.trim() !== expectedName) {
    alert('❌ El nombre no coincide. Operación cancelada.');
    return;
  }
  closeModal();
  window[callbackName]();
};

/* =====================
   ORGANIZATIONS
===================== */
async function loadOrgs() {
  const data = await api('/api/organizations');
  orgList.innerHTML = '';

  data.forEach(o => {
    const li = document.createElement('li');
    li.className = 'org-item';

    const name = document.createElement('span');
    name.textContent = o.name;
    name.onclick = () => viewAlbums(o._id, o.name);

    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';

    const menu = document.createElement('button');
    menu.className = 'menu-btn';
    menu.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    menu.onclick = (e) => {
      e.stopPropagation();
      toggleOrgMenu(e, o._id, o.name);
    };

    const dropdown = document.createElement('div');
    dropdown.className = 'org-dropdown hidden';
    dropdown.innerHTML = `
      <button class="dropdown-item" onclick="createAlbumPrompt('${o._id}')">
        <i class="fas fa-plus"></i> Crear Álbum
      </button>
      <button class="dropdown-item" style="color: #ef4444;" onclick="deleteOrganizationWithConfirm('${o._id}', '${o.name.replace(/'/g, "\\'")}')">
        <i class="fas fa-trash"></i> Eliminar Organización
      </button>
    `;

    menuContainer.appendChild(menu);
    menuContainer.appendChild(dropdown);

    li.appendChild(name);
    li.appendChild(menuContainer);
    orgList.appendChild(li);
  });
}

function toggleOrgMenu(e, orgId, orgName) {
  const dropdown = e.target.closest('.menu-btn').nextElementSibling;
  const isHidden = dropdown.classList.contains('hidden');

  // Cerrar otros dropdowns
  document.querySelectorAll('.org-dropdown').forEach(d => d.classList.add('hidden'));

  if (isHidden) {
    dropdown.classList.remove('hidden');
  }
}

async function createOrg() {
  const input = document.getElementById('orgName');
  const name = input.value.trim();
  if (!name) return;

  await api('/api/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  input.value = '';
  loadOrgs();
}

document.getElementById('btnCreateOrg').onclick = createOrg;

// Botón de Settings
document.getElementById('btnSettings').onclick = openSettings;

// Cerrar dropdowns al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-container')) {
    document.querySelectorAll('.org-dropdown').forEach(d => d.classList.add('hidden'));
  }
});

/* =====================
   ORG MENU
===================== */
function orgMenu(id, name) {
  showModal(`
    <h3><i class="fas fa-cog"></i> ${escapeHtml(name)}</h3>
    <button onclick="createAlbumPrompt('${id}')" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;">
      <i class="fas fa-plus"></i> Crear Álbum
    </button>
    <br><br>
    <button onclick="closeModal()">
      <i class="fas fa-times"></i> Cerrar
    </button>
  `);
}

window.createAlbumPrompt = (orgId) => {
  showModal(`
    <h3><i class="fas fa-folder-plus"></i> Nuevo Álbum</h3>
    <input id="albumName" placeholder="Nombre del álbum" />
    <br>
    <button onclick="createAlbum('${orgId}')" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;">
      <i class="fas fa-check"></i> Crear
    </button>
  `);
};

async function createAlbum(orgId) {
  const name = document.getElementById('albumName').value.trim();
  if (!name) return;

  await api('/api/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, organizationId: orgId })
  });

  closeModal();
  viewAlbums(orgId, viewTitle.textContent.replace('Álbums - ', ''));
}

/* =====================
   ALBUMS
===================== */
async function viewAlbums(orgId, name) {
  currentOrg = orgId;
  currentAlbum = null;

  viewTitle.innerHTML = `<i class="fas fa-folder-open"></i> Álbums - ${name}`;
  const data = await api(`/api/albums/org/${orgId}`);

  content.innerHTML = `<div class="grid"></div>`;
  const grid = content.firstChild;

  data.forEach(a => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-icon">
        <i class="fas fa-folder-open"></i>
      </div>
      <div class="card-title">${escapeHtml(a.name)}</div>
      <div class="card-actions">
        <button class="card-download" title="Descargar álbum" onclick="downloadAlbumByName('${a._id}', '${escapeHtml(a.name).replace(/'/g, "\\'")}')">
          <i class="fas fa-download"></i>
        </button>
        <button class="card-delete" title="Eliminar álbum" onclick="deleteAlbumWithConfirm('${a._id}', '${escapeHtml(a.name).replace(/'/g, "\\'")}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    card.style.cursor = 'pointer';
    // Click en cualquier parte abre el álbum
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-download') && !e.target.closest('.card-delete')) {
        viewAlbum(a);
      }
    });
    grid.appendChild(card);
  });
}

/* =====================
   ALBUM VIEW
===================== */
async function viewAlbum(album) {
  currentAlbum = album;
  viewTitle.innerHTML = `<i class="fas fa-image"></i> Álbum: ${album.name}`;

  content.innerHTML = `
    <div class="toolbar">
      <input type="file" id="files" multiple accept="image/*" />
      <button id="btnUploadImages">
        <i class="fas fa-upload"></i> Subir imágenes
      </button>
      <button id="btnDownloadAlbum" data-download-album onclick="downloadAlbum()">
        <i class="fas fa-download"></i> Descargar Álbum
      </button>
    </div>
    <div class="image-grid" id="imageGrid"></div>
  `;

  // Abrir selector de archivos al hacer clic en el botón
  document.getElementById('btnUploadImages').onclick = () => {
    document.getElementById('files').click();
  };
  
  // Subir imágenes cuando se seleccionen archivos
  document.getElementById('files').addEventListener('change', uploadImages);
  
  loadImages();
}

/* =====================
   IMAGES
===================== */
async function uploadImages() {
  const files = document.getElementById('files').files;
  if (!files.length) {
    console.log('No files selected');
    return;
  }

  console.log(`Uploading ${files.length} files...`);

  const uploadBtn = document.getElementById('btnUploadImages');
  const originalHTML = uploadBtn.innerHTML;
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
  uploadBtn.disabled = true;

  try {
    const uploads = [...files].map(file => {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('albumId', currentAlbum._id);
      fd.append('organizationId', currentOrg);
      
      return fetch('/api/images', { 
        method: 'POST', 
        body: fd 
      }).then(async res => {
        const json = await res.json();
        if (!res.ok || json.ok === false) {
          throw new Error(json.error || `Error: ${res.status}`);
        }
        return json.data;
      });
    });

    await Promise.all(uploads);
    console.log('All images uploaded successfully');
    loadImages();
    document.getElementById('files').value = '';
    alert('✅ Imágenes subidas correctamente');
  } catch (error) {
    console.error('Upload error:', error);
    alert('❌ Error al subir imágenes: ' + error.message);
  } finally {
    uploadBtn.innerHTML = originalHTML;
    uploadBtn.disabled = false;
  }
}

async function loadImages() {
  const data = await api(`/api/images/album/${currentAlbum._id}`);
  const grid = document.getElementById('imageGrid');
  grid.innerHTML = '';

  if (data.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #9ca3af;">
        <i class="fas fa-image" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
        <p>No hay imágenes aún. ¡Sube algunas para comenzar!</p>
      </div>
    `;
    return;
  }

  data.forEach(img => {
    const div = document.createElement('div');
    div.className = 'image-card';

    const image = document.createElement('img');
    image.src = img.url;
    image.alt = img.originalName || 'Imagen';
    image.style.cursor = 'pointer';
    image.onclick = () => openImageFullscreen(img);

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.title = 'Descargar imagen';
    downloadBtn.onclick = (e) => {
      e.stopPropagation();
      downloadImage(img);
    };

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.innerHTML = '<i class="fas fa-trash"></i>';
    del.title = 'Eliminar imagen';
    del.onclick = (e) => {
      e.stopPropagation();
      deleteImage(img._id);
    };

    div.appendChild(image);
    div.appendChild(downloadBtn);
    div.appendChild(del);
    grid.appendChild(div);
  });
}

function openImageFullscreen(img) {
  const fullscreenModal = document.createElement('div');
  fullscreenModal.className = 'fullscreen-modal';
  fullscreenModal.innerHTML = `
    <div class="fullscreen-container">
      <button class="close-fullscreen" onclick="this.closest('.fullscreen-modal').remove()">
        <i class="fas fa-times"></i>
      </button>
      <img src="${img.url}" alt="${img.originalName || 'Imagen'}" />
      <div class="fullscreen-controls">
        <button class="fullscreen-download" onclick="downloadImage({url: '${img.url}', originalName: '${img.originalName || 'imagen'}'})">
          <i class="fas fa-download"></i> Descargar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(fullscreenModal);

  fullscreenModal.addEventListener('click', (e) => {
    if (e.target === fullscreenModal) {
      fullscreenModal.remove();
    }
  });
}

async function downloadImage(img) {
  try {
    const response = await fetch(img.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = img.originalName || 'imagen.jpg';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    alert('❌ Error al descargar imagen: ' + error.message);
  }
}

async function downloadAlbum() {
  try {
    const data = await api(`/api/images/album/${currentAlbum._id}`);
    if (data.length === 0) {
      alert('No hay imágenes para descargar');
      return;
    }

    const downloadBtn = document.querySelector('[data-download-album]');
    if (downloadBtn) {
      downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Descargando...';
      downloadBtn.disabled = true;
    }

    for (const img of data) {
      await downloadImage(img);
      // Pequeña pausa entre descargas
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    alert(`✅ ${data.length} imagen${data.length > 1 ? 'es' : ''} descargada${data.length > 1 ? 's' : ''}`);
  } catch (error) {
    alert('❌ Error al descargar álbum: ' + error.message);
  } finally {
    const downloadBtn = document.querySelector('[data-download-album]');
    if (downloadBtn) {
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> Descargar Álbum';
      downloadBtn.disabled = false;
    }
  }
}

async function downloadAlbumByName(albumId, albumName) {
  try {
    const data = await api(`/api/images/album/${albumId}`);
    if (data.length === 0) {
      alert('No hay imágenes para descargar');
      return;
    }

    for (const img of data) {
      await downloadImage(img);
      // Pequeña pausa entre descargas
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    alert(`✅ ${data.length} imagen${data.length > 1 ? 'es' : ''} descargada${data.length > 1 ? 's' : ''} del álbum "${albumName}"`);
  } catch (error) {
    alert('❌ Error al descargar álbum: ' + error.message);
  }
}

async function deleteAlbumWithConfirm(albumId, albumName) {
  showDeleteConfirmModal(albumName, 'álbum', 'performDeleteAlbum');
  window.deleteAlbumId = albumId;
  window.deleteAlbumName = albumName;
}

async function performDeleteAlbum() {
  try {
    await api(`/api/albums/${window.deleteAlbumId}`, { method: 'DELETE' });
    alert('✅ Álbum eliminado correctamente');
    // Recargar la vista actual
    const orgName = viewTitle.textContent.replace(/^.*Álbums - /, '');
    viewAlbums(currentOrg, orgName);
  } catch (error) {
    alert('❌ Error al eliminar álbum: ' + error.message);
  }
}

async function deleteOrganizationWithConfirm(orgId, orgName) {
  showDeleteConfirmModal(orgName, 'organización', 'performDeleteOrganization');
  window.deleteOrgId = orgId;
  window.deleteOrgName = orgName;
}

async function performDeleteOrganization() {
  try {
    const res = await fetch(`/api/organizations/${window.deleteOrgId}`, { 
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (!res.ok || json.ok === false) {
      throw new Error(json.error || `Error: ${res.status}`);
    }
    alert('✅ Organización eliminada correctamente');
    // Recargar la lista de organizaciones
    loadOrgs();
    // Limpiar la vista actual
    viewTitle.textContent = 'Organizaciones';
    content.innerHTML = '';
  } catch (error) {
    console.error('Delete organization error:', error);
    alert('❌ Error al eliminar organización: ' + error.message);
  }
}

async function deleteImage(id) {
  showDeleteConfirmModal('esta imagen', 'imagen', 'performDeleteImage');
  window.deleteImageId = id;
}

async function performDeleteImage() {
  try {
    await api(`/api/images/${window.deleteImageId}`, { method: 'DELETE' });
    loadImages();
    alert('✅ Imagen eliminada correctamente');
  } catch (error) {
    alert('❌ Error al borrar la imagen: ' + error.message);
  }
}

/* =====================
   SETTINGS
===================== */
async function openSettings() {
  viewTitle.innerHTML = `<i class="fas fa-cog"></i> Configuración`;
  
  try {
    const config = await api('/api/config');
    // Guardar estado original en window para referencia
    window.originalConfig = config;
    
    content.innerHTML = `
      <div class="settings-container">
        <div class="settings-tabs">
          <button class="tab-btn active" data-tab="cloudinary">
            <i class="fas fa-cloud"></i> Cloudinary
          </button>
          <button class="tab-btn" data-tab="redis">
            <i class="fas fa-database"></i> Redis
          </button>
        </div>

        <div class="tab-content">
          <div id="tab-cloudinary" class="tab-pane active">
            <div class="settings-card">
              <h3><i class="fas fa-cloud"></i> Configuración de Cloudinary</h3>
              <p class="settings-description">Actualiza tus credenciales de Cloudinary. El app usará estas credenciales en lugar de las del servidor.</p>
              
              <div class="form-group">
                <label for="cloudName">Cloud Name:</label>
                <input type="text" id="cloudName" value="${config.cloudinary.cloudinaryCloudName || ''}" placeholder="ej: my-cloud" />
                <small>Tu identificador único de Cloudinary</small>
              </div>

              <div class="form-group">
                <label for="apiKey">API Key:</label>
                <input type="text" id="apiKey" value="${config.cloudinary.cloudinaryApiKey || ''}" placeholder="Ingresa tu API Key" />
                <small>Clave pública de Cloudinary</small>
              </div>

              <div class="form-group">
                <label for="apiSecret">API Secret:</label>
                <input type="password" id="apiSecret" value="${config.cloudinary.cloudinaryApiSecret === '••••••••' ? '' : config.cloudinary.cloudinaryApiSecret}" placeholder="Ingresa tu API Secret" />
                <small>⚠️ Clave privada - no la compartas</small>
              </div>

              <button class="btn-save" onclick="saveCloudinaryConfig()">
                <i class="fas fa-save"></i> Guardar Cloudinary
              </button>
            </div>
          </div>

          <div id="tab-redis" class="tab-pane">
            <div class="settings-card">
              <h3><i class="fas fa-database"></i> Configuración de Redis</h3>
              <p class="settings-description">Configurar Redis para caché. Este es opcional pero recomendado para mejor rendimiento.</p>
              
              <div class="form-group">
                <label for="redisHost">Redis Host:</label>
                <input type="text" id="redisHost" value="${config.redis.redisHost || ''}" placeholder="ej: redis.example.com" />
                <small>Dirección del servidor Redis</small>
              </div>

              <div class="form-group">
                <label for="redisPort">Redis Port:</label>
                <input type="number" id="redisPort" value="${config.redis.redisPort || 6379}" placeholder="6379" />
                <small>Puerto de Redis (por defecto 6379)</small>
              </div>

              <div class="form-group">
                <label for="redisPassword">Redis Password:</label>
                <input type="password" id="redisPassword" value="${config.redis.redisPassword === '••••••••' ? '' : config.redis.redisPassword}" placeholder="Contraseña de Redis" />
                <small>Contraseña de autenticación</small>
              </div>

              <button class="btn-save" onclick="saveRedisConfig()">
                <i class="fas fa-save"></i> Guardar Redis
              </button>
            </div>
          </div>
        </div>

        <div class="button-group">
          <button id="btnBackSettings" class="btn-cancel">
            <i class="fas fa-arrow-left"></i> Volver
          </button>
        </div>
      </div>
    `;

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      });
    });

    document.getElementById('btnBackSettings').onclick = () => {
      viewTitle.textContent = 'Organizaciones';
      content.innerHTML = '';
      loadOrgs();
    };
  } catch (error) {
    alert('❌ Error al cargar configuración: ' + error.message);
  }
}

async function saveCloudinaryConfig() {
  const cloudName = document.getElementById('cloudName').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  const apiSecret = document.getElementById('apiSecret').value.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    alert('❌ Todos los campos de Cloudinary son requeridos');
    return;
  }

  const btn = event.target;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cloudinaryCloudName: cloudName,
        cloudinaryApiKey: apiKey,
        cloudinaryApiSecret: apiSecret
      })
    });

    const json = await res.json();
    if (!res.ok || json.ok === false) {
      throw new Error(json.error || json.message || 'Error al guardar');
    }

    alert('✅ Configuración de Cloudinary guardada');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

async function saveRedisConfig() {
  const redisHost = document.getElementById('redisHost').value.trim();
  const redisPort = document.getElementById('redisPort').value.trim();
  const redisPassword = document.getElementById('redisPassword').value.trim();

  if (!redisHost || !redisPort || !redisPassword) {
    alert('❌ Todos los campos de Redis son requeridos');
    return;
  }

  const btn = event.target;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redisHost: redisHost,
        redisPort: Number(redisPort),
        redisPassword: redisPassword
      })
    });

    const json = await res.json();
    if (!res.ok || json.ok === false) {
      throw new Error(json.error || json.message || 'Error al guardar');
    }

    alert('✅ Configuración de Redis guardada');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

/* INIT */
loadOrgs();
