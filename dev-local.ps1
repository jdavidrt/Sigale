#Requires -Version 5.1
<#
  dev-local.ps1 - Sigale 2.0 local stack launcher (Windows / PowerShell)

  Boots the WHOLE local stack for testing and tears it down cleanly:
    1. Frees ports 25060 (API) and 5173 (client) so no stale instance lingers.
    2. (optional) Creates the local 'sigale' DB + user   ->  -InitDb
    3. Installs deps the first time (if node_modules is missing).
    4. Starts the backend (node --env-file=.env index.js) - migrations run on boot.
    5. Seeds organizer + sample event (idempotent)        ->  skip with -NoSeed
    6. Starts the Vite client.
    7. Waits. On Ctrl+C / window close / a child crashing, it TREE-KILLS every
       process it started and frees both ports again.

  Never touches DigitalOcean: it only drives the local server, whose db.js
  enforces DB_NAME=sigale.

  Usage (from the repo root):
    powershell -ExecutionPolicy Bypass -File .\dev-local.ps1
    .\dev-local.ps1 -InitDb        # first run: also create the DB + user
    .\dev-local.ps1 -NoSeed        # don't reseed
    .\dev-local.ps1 -NoClient      # backend only
    .\dev-local.ps1 -Open          # open the browser when ready
#>
[CmdletBinding()]
param(
  [switch]$InitDb,
  [switch]$NoSeed,
  [switch]$NoClient,
  [switch]$NoInstall,
  [switch]$Open
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# ---- config ---------------------------------------------------------------
$Root      = $PSScriptRoot
$ServerDir = Join-Path $Root 'server'
$ApiPort   = 25060
$CliPort   = 5173
$ApiUrl    = "http://localhost:$ApiPort"
$CliUrl    = "http://localhost:$CliPort"
$LogDir    = Join-Path $Root '.dev-local-logs'
$DbPassword = 'sigale_local_dev'   # must match server\.env
$null = New-Item -ItemType Directory -Force -Path $LogDir

$script:Procs = New-Object System.Collections.ArrayList

# ---- helpers --------------------------------------------------------------
function Step($m){ Write-Host "==> $m" -ForegroundColor Cyan }
function Ok($m){   Write-Host "    $m" -ForegroundColor Green }
function Note($m){ Write-Host "    $m" -ForegroundColor Yellow }

function Stop-TreePid($procId){
  try { & taskkill /PID $procId /T /F *> $null } catch {}
}
function Free-Port($port){
  try {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique |
      ForEach-Object { Stop-TreePid $_ }
  } catch {}
}
function Cleanup {
  Write-Host ''
  Step 'Shutting down the local stack...'
  foreach($p in @($script:Procs)){
    try { if($p -and -not $p.HasExited){ Stop-TreePid $p.Id } } catch {}
  }
  Free-Port $ApiPort
  Free-Port $CliPort
  Ok 'All local instances stopped.'
}

# ---- main -----------------------------------------------------------------
try {
  # Node >= 20.6 (needed for --env-file)
  $nodeRaw = (& node -v) 2>$null
  if(-not $nodeRaw){ throw 'Node.js not found in PATH.' }
  $v = ($nodeRaw -replace '^v','').Split('.')
  if([int]$v[0] -lt 20 -or ([int]$v[0] -eq 20 -and [int]$v[1] -lt 6)){
    throw "Node $nodeRaw found; need >= 20.6 for --env-file. Upgrade Node, or add dotenv (see docs\LOCAL_TESTING.md)."
  }
  Ok "Node $nodeRaw"

  if(-not (Test-Path (Join-Path $ServerDir '.env'))){
    throw "server\.env is missing. See docs\LOCAL_TESTING.md, Section 2."
  }

  # Free the ports first - 'closes any execution instance' from a previous run.
  Step "Freeing ports $ApiPort and $CliPort if already in use"
  Free-Port $ApiPort
  Free-Port $CliPort

  # Optional one-time DB + user creation (needs MySQL root).
  if($InitDb){
    Step "Creating local 'sigale' database and user (MySQL root required)"
    $sec  = Read-Host 'MySQL root password' -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    $rootPw = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    $sql = @"
CREATE DATABASE IF NOT EXISTS sigale CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'sigale'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DbPassword';
GRANT ALL PRIVILEGES ON sigale.* TO 'sigale'@'localhost';
FLUSH PRIVILEGES;
"@
    $sql | & mysql -u root "--password=$rootPw"
    if($LASTEXITCODE -ne 0){ throw 'DB init failed (check the root password and that mysql is in PATH).' }
    Ok 'Database and user ready.'
  }

  # Install deps on first run.
  if(-not $NoInstall){
    if(-not (Test-Path (Join-Path $Root 'node_modules'))){
      Step 'Installing client dependencies (first run)'
      Push-Location $Root; & npm.cmd install; Pop-Location
    }
    if(-not (Test-Path (Join-Path $ServerDir 'node_modules'))){
      Step 'Installing server dependencies (first run)'
      Push-Location $ServerDir; & npm.cmd install; Pop-Location
    }
  }

  # Start the backend (migrations run on boot).
  Step 'Starting backend (migrations run automatically)'
  $srvOut = Join-Path $LogDir 'server.out.log'
  $srvErr = Join-Path $LogDir 'server.err.log'
  $srv = Start-Process -FilePath 'node' -ArgumentList '--env-file=.env','index.js' `
           -WorkingDirectory $ServerDir -PassThru -NoNewWindow `
           -RedirectStandardOutput $srvOut -RedirectStandardError $srvErr
  [void]$script:Procs.Add($srv)

  # Wait for /api/health (or fail fast if the process exits).
  $healthy = $false
  for($i=0; $i -lt 60; $i++){
    if($srv.HasExited){ break }
    try {
      $r = Invoke-WebRequest "$ApiUrl/api/health" -UseBasicParsing -TimeoutSec 2
      if($r.StatusCode -eq 200){ $healthy = $true; break }
    } catch {}
    Start-Sleep -Milliseconds 500
  }
  if(-not $healthy){
    Note 'Backend did not become healthy. Last log lines:'
    if(Test-Path $srvErr){ Get-Content $srvErr -Tail 25 | ForEach-Object { Write-Host "      $_" } }
    if(Test-Path $srvOut){ Get-Content $srvOut -Tail 25 | ForEach-Object { Write-Host "      $_" } }
    throw 'Backend failed to start - usually MySQL is not running, or server\.env credentials are wrong.'
  }
  Ok "Backend healthy at $ApiUrl"

  # Seed (idempotent).
  if(-not $NoSeed){
    Step 'Seeding organizer + sample event (idempotent)'
    Push-Location $ServerDir
    & npm.cmd run --silent seed:all
    Pop-Location
    Ok 'Seed complete.'
  }

  # Start the client.
  if(-not $NoClient){
    Step 'Starting frontend (Vite)'
    $cliOut = Join-Path $LogDir 'client.out.log'
    $cliErr = Join-Path $LogDir 'client.err.log'
    $cli = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' `
             -WorkingDirectory $Root -PassThru -NoNewWindow `
             -RedirectStandardOutput $cliOut -RedirectStandardError $cliErr
    [void]$script:Procs.Add($cli)
    for($i=0; $i -lt 60; $i++){
      if($cli.HasExited){ break }
      if(Get-NetTCPConnection -LocalPort $CliPort -State Listen -ErrorAction SilentlyContinue){ break }
      Start-Sleep -Milliseconds 500
    }
    Ok "Frontend at $CliUrl"
    if($Open){ Start-Process $CliUrl }
  }

  Write-Host ''
  Write-Host 'Sigale local stack is running.' -ForegroundColor Green
  Write-Host "  Backend : $ApiUrl"
  if(-not $NoClient){ Write-Host "  Frontend: $CliUrl" }
  Write-Host "  Logs    : $LogDir"
  Write-Host 'Press Ctrl+C to stop everything.' -ForegroundColor Yellow

  # Foreground wait. Treat Ctrl+C as input so the finally{} cleanup always runs.
  $useKey = ($Host.Name -eq 'ConsoleHost')
  if($useKey){ try { [Console]::TreatControlCAsInput = $true } catch { $useKey = $false } }
  while($true){
    if($useKey -and [Console]::KeyAvailable){
      $k = [Console]::ReadKey($true)
      if(($k.Modifiers -band [ConsoleModifiers]::Control) -and ($k.Key -eq 'C')){ break }
    }
    foreach($p in @($script:Procs)){
      if($p.HasExited){ Note "A child process exited (PID $($p.Id))."; throw 'A managed process stopped; shutting down.' }
    }
    Start-Sleep -Milliseconds 400
  }
}
finally {
  try { if($Host.Name -eq 'ConsoleHost'){ [Console]::TreatControlCAsInput = $false } } catch {}
  Cleanup
}
