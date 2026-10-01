while ($true) {
    Write-Host "Starting localtunnel..."
    npx localtunnel --port 4000 --subdomain withus-uat-stable-1
    Write-Host "Localtunnel exited, restarting in 1 second..."
    Start-Sleep -Seconds 1
}
