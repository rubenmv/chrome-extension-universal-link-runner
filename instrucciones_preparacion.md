Para lograr que sea **100% genérico**, podemos cambiar el enfoque de la siguiente manera:

1. El protocolo en Windows pasará a ser universal (lo llamaremos `runner://`).
2. En la extensión, crearemos una **página de Opciones** donde podrás escribir el comando exacto que quieras (ej: `ytd %url% -s en` o `cpt %url% --output C:\Media`).
3. Al pulsar el botón, la extensión empaquetará el comando ya procesado (con la URL ya reemplazada) y lo enviará codificado a través de `runner://`.
4. El script de Windows se limitará a recibir el comando "cocinado" y a ejecutarlo a ciegas en el terminal.

Aquí tienes el código y los pasos modificados para este enfoque universal:

---

### Paso 1: El Intermediario Genérico en Windows

Este script ya no sabe qué es "ytd" ni "cpt". Solo recibe un texto, lo limpia y lo ejecuta en una consola.

Guarda este script como `C:\Scripts\universal-runner.ps1`:

```powershell
param([string]$rawPayload)

if (-not $rawPayload) { exit }

# Eliminar el prefijo del protocolo universal 'runner://'
$cleanPayload = $rawPayload -replace '^runner://', ''
# Descodificar los caracteres de la URL (ej: %20 pasará a ser un espacio)
$decodedCommand = [System.Uri]::UnescapeDataString($cleanPayload)

if (-not $decodedCommand) { exit }

# Lanzar CMD ejecutando directamente el comando que nos ha enviado Chrome
Start-Process cmd.exe -ArgumentList "/c", "mode con: cols=90 lines=20 & $decodedCommand & pause"

```

### Paso 2: Registrar el Protocolo Universal

Crea un archivo `register-runner.reg` y ejecútalo para asociar el protocolo `runner://` a tu nuevo script:

```registry
Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\runner]
@="URL:Universal Command Runner Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\runner\shell]

[HKEY_CLASSES_ROOT\runner\shell\open]

[HKEY_CLASSES_ROOT\runner\shell\open\command]
@="cmd.exe /c powershell.exe -WindowStyle Hidden -File \"C:\\Scripts\\universal-runner.ps1\" \"%1\""

```

---

### Paso 3: La Extensión de Chrome Configurable

Ahora la extensión necesita una pantalla de opciones para guardar tu comando personalizado y una estructura para procesarlo. Crea una carpeta para la extensión con estos 4 archivos:

#### 1. `manifest.json`

Añadimos el permiso `storage` para recordar tu comando y una página de opciones (`options.html`).

```json
{
  "manifest_version": 3,
  "name": "Universal Link Runner",
  "version": "1.1",
  "description": "Lanza cualquier comando de Windows usando la URL actual.",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "action": {
    "default_title": "Ejecutar comando local"
  },
  "options_page": "options.html",
  "background": {
    "service_worker": "background.js"
  }
}

```

#### 2. `options.html`

Una interfaz limpia para configurar el comando. Para acceder a ella, harás clic derecho en el icono de la extensión y seleccionarás "Opciones".

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; padding: 15px; width: 320px; }
    input { width: 100%; padding: 6px; margin: 8px 0; box-sizing: border-box; }
    button { padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .note { font-size: 11px; color: #555; margin-top: 5px; }
  </style>
</head>
<body>
  <h3>Configurar Comando Local</h3>
  <label for="cmd">Plantilla de comando:</label>
  <input type="text" id="cmd" placeholder="ej: ytd %url% -s en">
  <div class="note">Usa <b>%url%</b> donde quieras que se inserte el enlace actual.</div>
  <br>
  <button id="save">Guardar configuración</button>

  <script src="options.js"></script>
</body>
</html>

```

#### 3. `options.js`

Se encarga de guardar y cargar el comando usando la API de almacenamiento de Chrome.

```javascript
// Cargar comando guardado al abrir
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({ commandTemplate: 'ytd %url%' }, (items) => {
    document.getElementById('cmd').value = items.commandTemplate;
  });
});

// Guardar el comando al hacer clic
document.getElementById('save').addEventListener('click', () => {
  const template = document.getElementById('cmd').value;
  chrome.storage.sync.set({ commandTemplate: template }, () => {
    alert('Configuración guardada correctamente.');
  });
});

```

#### 4. `background.js`

Al pulsar el botón, lee la plantilla que configuraste, reemplaza `%url%` por la real, y lanza el protocolo `runner://`.

```javascript
chrome.action.onClicked.addListener((tab) => {
  if (!tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
    return;
  }

  // Recuperamos el comando que guardaste en las opciones
  chrome.storage.sync.get({ commandTemplate: 'ytd %url%' }, (items) => {
    const template = items.commandTemplate;
    
    // Construimos el comando final sustituyendo el token %url%
    const finalCommand = template.replace('%url%', tab.url);
    
    // Codificamos todo el comando para que viaje seguro vía URL hacia Windows
    const encodedCommand = encodeURIComponent(finalCommand);
    const customProtocolUrl = "runner://" + encodedCommand;
    
    // Enviamos el comando cocinado al handler de Windows
    chrome.tabs.update(tab.id, { url: customProtocolUrl });
  });
});

```

---

### ¿Por qué esta solución es mejor?

* **Mantenimiento cero en Windows:** Ya no tendrás que volver a tocar el registro de Windows ni tus scripts locales en PowerShell si decides cambiar de estrategia.
* **Flexibilidad absoluta:** Si mañana quieres cambiar de `ytd %url%` a `cpt --link %url% --verbose`, simplemente entras a las opciones de la extensión, editas la línea, guardas y listo. El intermediario de Windows procesará el cambio de forma transparente.