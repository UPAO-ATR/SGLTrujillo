param(
  [Parameter(Mandatory=$true)]
  [string]$Destino,
  [switch]$NoPublicar
)
$ErrorActionPreference = "Stop"
$Origen = Split-Path -Parent $MyInvocation.MyCommand.Path

function EjecutarGit {
  param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Argumentos)
  & git @Argumentos
  if ($LASTEXITCODE -ne 0) { throw "Git no pudo ejecutar: git $($Argumentos -join ' ')" }
}

if (-not (Test-Path (Join-Path $Destino ".git"))) {
  throw "El destino no contiene una carpeta .git: $Destino"
}

Push-Location $Destino
try {
  $Cambios = git status --porcelain
  if ($LASTEXITCODE -ne 0) { throw "No se pudo consultar el estado de Git." }
  if ($Cambios) {
    throw "El repositorio tiene cambios sin guardar. Haz commit o guarda una copia antes de continuar."
  }
  $RamaActual = git branch --show-current
  if ($LASTEXITCODE -ne 0) { throw "No se pudo identificar la rama actual." }
  if ($RamaActual -ne "main") {
    throw "Debes ejecutar el script desde la rama main. Rama actual: $RamaActual"
  }
  $ExisteRespaldo = git branch --list version-anterior
  if (-not $ExisteRespaldo) { EjecutarGit branch version-anterior }
  $Remotos = @(git remote)
  if (-not $NoPublicar) {
    if ($Remotos -contains "RepositorioAmigo") { EjecutarGit push -u RepositorioAmigo version-anterior }
    if ($Remotos -contains "origin") { EjecutarGit push -u origin version-anterior }
  }
  Write-Host "Versión anterior respaldada en la rama version-anterior."
} finally {
  Pop-Location
}

robocopy $Origen $Destino /MIR /XD .git node_modules dist coverage AlmacenLocal /XF .env *.log | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Robocopy no pudo completar la copia." }

Push-Location $Destino
try {
  EjecutarGit add .
  $CambiosNuevos = git status --porcelain
  if (-not $CambiosNuevos) { throw "No se detectaron archivos nuevos después de la copia." }
  EjecutarGit commit -m "Implementa flujo corregido presencial SGL Trujillo"
  if (-not $NoPublicar) {
    $Remotos = @(git remote)
    if ($Remotos -contains "RepositorioAmigo") { EjecutarGit push RepositorioAmigo main }
    if ($Remotos -contains "origin") { EjecutarGit push origin main }
    Write-Host "Código publicado. Render iniciará el despliegue automático si Auto-Deploy está activo."
  } else {
    Write-Host "Commit creado sin publicar por solicitud del usuario."
  }
} finally {
  Pop-Location
}
