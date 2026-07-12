param([string]$rawPayload)

if (-not $rawPayload) { exit }

# Eliminar el prefijo del protocolo universal 'runner://'
$cleanPayload = $rawPayload -replace '^runner://', ''
# Descodificar los caracteres de la URL (ej: %20 pasará a ser un espacio)
$decodedCommand = [System.Uri]::UnescapeDataString($cleanPayload)

if (-not $decodedCommand) { exit }

# Lanzar CMD ejecutando directamente el comando que nos ha enviado Chrome
Start-Process cmd.exe -ArgumentList "/c", "mode con: cols=90 lines=20 & $decodedCommand & pause"