// Función genérica para procesar y lanzar el comando
async function launchCommand(storageKey, defaultTemplate, extraArgs = "") {
  // 1. Obtener la pestaña activa actual
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
    window.close();
    return;
  }

  // 2. Recuperar la plantilla guardada de las opciones
  chrome.storage.sync.get({ [storageKey]: defaultTemplate }, (items) => {
    const template = items[storageKey];
    
    // Construimos la porción de la URL protegida y con sus argumentos de resolución previos si existen
    const urlPayload = `${extraArgs}'${tab.url}'`;
    
    // 3. Reemplazar %url% por nuestro payload cocinado
    const finalCommand = template.replace('%url%', urlPayload);
    
    // 4. Codificar y enviar al protocolo universal de Windows
    const encodedCommand = encodeURIComponent(finalCommand);
    const customProtocolUrl = "runner://" + encodedCommand;
    
    chrome.tabs.update(tab.id, { url: customProtocolUrl });
    
    // Cerrar el menú flotante automáticamente tras hacer clic
    setTimeout(() => { window.close(); }, 100);
  });
}

// Escuchadores para los tres botones del menú
document.getElementById('ytd-1080-btn').addEventListener('click', () => {
  // Pasa "-r 1080 " antes de la URL
  launchCommand('commandTemplate', 'ytd %url%', '-r 1080 ');
});

document.getElementById('ytd-2160-btn').addEventListener('click', () => {
  // Pasa "-r 2160 " antes de la URL
  launchCommand('commandTemplate', 'ytd %url%', '-r 2160 ');
});

document.getElementById('gdl-btn').addEventListener('click', () => {
  // gallery-dl no lleva argumentos de resolución extra
  launchCommand('gdlTemplate', 'gdl %url%');
});