const DEFAULT_TEMPLATES = {
  commandTemplate: 'ytd %url%',
  gdlTemplate: 'gdl %url%'
};

const templates = { ...DEFAULT_TEMPLATES };
let templatesReady = false;
let launching = false;

// Precargamos la configuración al abrir el popup para que el clic no dependa de una
// lectura asíncrona de storage: así el lanzamiento del protocolo ocurre de inmediato.
const templatesLoaded = new Promise((resolve) => {
  chrome.storage.sync.get(DEFAULT_TEMPLATES, (items) => {
    if (chrome.runtime.lastError) {
      console.error('No se pudo leer la configuración:', chrome.runtime.lastError.message);
    } else {
      Object.assign(templates, items);
    }
    templatesReady = true;
    resolve();
  });
});

function setStatus(message, isError = false) {
  const status = document.getElementById('status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('status--error', isError);
}

function setButtonsDisabled(disabled) {
  document.querySelectorAll('.btn').forEach((button) => {
    button.disabled = disabled;
  });
}

function isValidWebUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

// Función genérica para procesar y lanzar el comando
async function launchCommand(storageKey, extraArgs = '') {
  if (launching) return;
  launching = true;
  setButtonsDisabled(true);
  setStatus('Lanzando comando...');

  try {
    if (!templatesReady) {
      await templatesLoaded;
    }

    // 1. Obtener la pestaña activa actual
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab && (tab.url || tab.pendingUrl);

    if (!tab || !isValidWebUrl(url)) {
      // No cerramos el popup: el usuario ve por qué no se hace nada.
      setStatus('Esta pestaña no tiene una URL http(s) válida (¿página de error?). Abre la página que quieres descargar y vuelve a intentarlo.', true);
      return;
    }

    // 2. Plantilla ya cargada en memoria (sin esperas de storage en el clic)
    const template = templates[storageKey] || DEFAULT_TEMPLATES[storageKey];

    // Construimos la porción de la URL protegida y con sus argumentos de resolución previos si existen
    const urlPayload = `${extraArgs}'${url}'`;

    // 3. Reemplazar %url% por nuestro payload cocinado
    const finalCommand = template.replace('%url%', urlPayload);

    // 4. Codificar y enviar al protocolo universal de Windows
    const protocolUrl = 'runner://' + encodeURIComponent(finalCommand);

    await chrome.tabs.update(tab.id, { url: protocolUrl });

    // El background devuelve la pestaña a su página original si Edge la deja bloqueada
    // en la página de error (about:blank#blocked / chrome-error://).
    chrome.runtime.sendMessage({
      type: 'protocolLaunchStarted',
      tabId: tab.id,
      originalUrl: url
    }).catch(() => {});

    // Cerramos el popup en cuanto la navegación al protocolo ya está en marcha.
    window.close();
  } catch (error) {
    console.error('Error al lanzar el comando:', error);
    setStatus(`No se pudo lanzar el comando: ${error.message}`, true);
  } finally {
    launching = false;
    setButtonsDisabled(false);
  }
}

// Escuchadores para los tres botones del menú
document.getElementById('ytd-1080-btn').addEventListener('click', () => {
  // Pasa "-r 1080 " antes de la URL
  launchCommand('commandTemplate', '-r 1080 ');
});

document.getElementById('ytd-2160-btn').addEventListener('click', () => {
  // Pasa "-r 2160 " antes de la URL
  launchCommand('commandTemplate', '-r 2160 ');
});

document.getElementById('gdl-btn').addEventListener('click', () => {
  // gallery-dl no lleva argumentos de resolución extra
  launchCommand('gdlTemplate');
});