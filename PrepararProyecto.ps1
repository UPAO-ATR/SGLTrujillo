$ErrorActionPreference = "Stop"
function EjecutarNpm {
  param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Argumentos)
  & npm @Argumentos
  if ($LASTEXITCODE -ne 0) { throw "NPM no pudo ejecutar: npm $($Argumentos -join ' ')" }
}
Write-Host "Instalando dependencias..."
EjecutarNpm install
EjecutarNpm --prefix Servidor install
EjecutarNpm --prefix Cliente install
if (-not (Test-Path "Servidor\.env")) {
  Copy-Item "Servidor\.env.ejemplo" "Servidor\.env"
  Write-Host "Se creó Servidor\.env. Completa URL_BASE_DATOS y CLAVE_JWT."
}
Write-Host "Construyendo el cliente..."
EjecutarNpm run construir
Write-Host "Proyecto preparado."
