param([string]$rawPayload)

if (-not $rawPayload) { exit }

# 1. Clean and decode the payload coming from Chrome
$cleanPayload = $rawPayload -replace '^runner://', '' -replace '/$', ''
$decodedCommand = [System.Uri]::UnescapeDataString($cleanPayload)

if (-not $decodedCommand) { exit }

# 2. Force loading the PowerShell Profile ($PROFILE)
$profilePath = "$Home\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"

if (Test-Path $profilePath) {
    . $profilePath
} else {
    $profile7Path = "$Home\Documents\PowerShell\Microsoft.PowerShell_profile.ps1"
    if (Test-Path $profile7Path) {
        . $profile7Path
    }
}

# 3. Execute the generic command and handle closing
Write-Host "Executing: $decodedCommand" -ForegroundColor Cyan

$success = $true
try {
    Invoke-Expression $decodedCommand -ErrorAction Stop
}
catch {
    $success = $false
    Write-Error "An error occurred while executing the command: $_"
}

# 4. Finalization based on the result
if ($success -and $LASTEXITCODE -eq 0) {
    Write-Host "`nProcess completed successfully. Closing in 5 seconds..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    exit
} else {
    Write-Host "`nAn error occurred during execution." -ForegroundColor Red
    Read-Host "Press Enter to exit"
}