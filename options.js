// Cargar los comandos guardados al abrir la página de opciones
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    commandTemplate: 'ytd %url%',
    gdlTemplate: 'gdl %url%'
  }, (items) => {
    document.getElementById('cmd').value = items.commandTemplate;
    document.getElementById('gdl').value = items.gdlTemplate;
  });
});

// Guardar ambos comandos
document.getElementById('save').addEventListener('click', () => {
  const ytdValue = document.getElementById('cmd').value;
  const gdlValue = document.getElementById('gdl').value;
  
  chrome.storage.sync.set({
    commandTemplate: ytdValue,
    gdlTemplate: gdlValue
  }, () => {
    alert('Configuración guardada correctamente.');
  });
});