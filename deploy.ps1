# Build et déploiement VoyageVista vers XAMPP
Write-Host "=== Build VoyageVista ===" -ForegroundColor Cyan

# 1. Build frontend
Set-Location "d:\cour\projet 6\VoyageVista\frontend"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build échoué !" -ForegroundColor Red
    exit 1
}

$dest = "C:\xampp\htdocs\VoyageVista"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

# 2. Copier le frontend buildé
Write-Host "Copie du frontend..." -ForegroundColor Yellow
Copy-Item -Recurse -Force "dist\*" $dest

# 3. Copier le backend PHP
Write-Host "Copie du backend..." -ForegroundColor Yellow
Copy-Item -Recurse -Force "d:\cour\projet 6\VoyageVista\backend" $dest

Write-Host ""
Write-Host "=== Déploiement terminé ! ===" -ForegroundColor Green
Write-Host "Lance ngrok :  ngrok http 80" -ForegroundColor White
Write-Host "URL :          https://TON-URL.ngrok-free.app/VoyageVista/" -ForegroundColor Yellow
