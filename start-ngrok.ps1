# Script de démarrage VoyageVista avec ngrok
# Lancer depuis PowerShell en tant qu'admin si nécessaire

Write-Host "=== VoyageVista - Lancement ngrok ===" -ForegroundColor Cyan

# 1. Vérifier que ngrok est installé
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "ngrok non trouvé. Installe-le avec: winget install ngrok" -ForegroundColor Red
    exit 1
}

# 2. Lancer les tunnels ngrok en arrière-plan
Write-Host "Démarrage des tunnels ngrok..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "start --all" -WindowStyle Normal

# 3. Attendre que ngrok démarre
Start-Sleep -Seconds 3

# 4. Récupérer les URLs via l'API locale de ngrok
try {
    $tunnels = (Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels").tunnels
    $backendTunnel  = $tunnels | Where-Object { $_.name -eq "backend"  } | Select-Object -First 1
    $frontendTunnel = $tunnels | Where-Object { $_.name -eq "frontend" } | Select-Object -First 1

    $backendUrl  = $backendTunnel.public_url  -replace "^http:", "https:"
    $frontendUrl = $frontendTunnel.public_url -replace "^http:", "https:"

    Write-Host ""
    Write-Host "=== URLs ngrok ===" -ForegroundColor Green
    Write-Host "Backend  : $backendUrl/VoyageVista/backend/api" -ForegroundColor White
    Write-Host "Frontend : $frontendUrl" -ForegroundColor White
    Write-Host ""

    # 5. Mettre à jour .env avec l'URL backend ngrok
    $envContent = "VITE_API_URL=$backendUrl/VoyageVista/backend/api`n"
    Set-Content -Path "d:\cour\projet 6\VoyageVista\frontend\.env" -Value $envContent -Encoding utf8
    Write-Host ".env mis à jour avec l'URL backend ngrok" -ForegroundColor Green

    Write-Host ""
    Write-Host "Maintenant lance le frontend dans un autre terminal:" -ForegroundColor Cyan
    Write-Host "  cd 'd:\cour\projet 6\VoyageVista\frontend'" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Partage cette URL: $frontendUrl" -ForegroundColor Yellow

} catch {
    Write-Host "Impossible de récupérer les URLs ngrok automatiquement." -ForegroundColor Yellow
    Write-Host "Ouvre http://localhost:4040 dans ton navigateur pour voir les URLs." -ForegroundColor White
    Write-Host "Puis mets à jour frontend/.env avec VITE_API_URL=<url-backend>/VoyageVista/backend/api" -ForegroundColor White
}
