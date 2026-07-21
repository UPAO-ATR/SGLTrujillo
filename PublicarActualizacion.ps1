param(
  [string]$Mensaje = "Actualiza flujo corregido SGL Trujillo"
)
$ErrorActionPreference = "Stop"

function Ejecutar {
  param([string]$Programa, [Parameter(ValueFromRemainingArguments=$true)][string[]]$Argumentos)
  & $Programa @Argumentos
  if ($LASTEXITCODE -ne 0) { throw "Falló: $Programa $($Argumentos -join ' ')" }
}

if (-not (Test-Path ".git")) { throw "Ejecuta este script desde la raíz del repositorio Git." }
Ejecutar npm run probar
Ejecutar npm run construir
Ejecutar git add .
$Cambios = git status --porcelain
if ($LASTEXITCODE -ne 0) { throw "No se pudo consultar el estado de Git." }
if ($Cambios) {
  Ejecutar git commit -m $Mensaje
} else {
  Write-Host "No hay cambios nuevos para registrar."
}
$Remotos = @(git remote)
if ($Remotos -contains "RepositorioAmigo") { Ejecutar git push RepositorioAmigo main }
if ($Remotos -contains "origin") { Ejecutar git push origin main }
Write-Host "Publicación terminada. Render desplegará el último commit automáticamente."
