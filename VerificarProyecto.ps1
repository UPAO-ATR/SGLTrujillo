$ErrorActionPreference = "Stop"
function EjecutarNpm {
  param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Argumentos)
  & npm @Argumentos
  if ($LASTEXITCODE -ne 0) { throw "NPM no pudo ejecutar: npm $($Argumentos -join ' ')" }
}
Write-Host "Instalando dependencias reproducibles..."
EjecutarNpm ci --include=dev
EjecutarNpm --prefix Servidor ci
EjecutarNpm --prefix Cliente ci
Write-Host "Ejecutando pruebas..."
EjecutarNpm run probar
Write-Host "Construyendo versión de producción..."
EjecutarNpm run construir
Write-Host "Verificación completada correctamente."
