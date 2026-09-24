# sync-sigale-server.ps1
# Mirrors this repo's  server\  folder into the BlackCoffe repo's  server\sigale\  subfolder.
# Safe: only writes inside ...\BlackCoffe\server\sigale\ - never touches BlackCoffe's own files.
# Run by executing this file (no args needed); paths resolve from the script's location.

# --- Paths ---------------------------------------------------------------
# The Sigale server folder is resolved from THIS script's directory, so the
# accented "Sigale" folder name never depends on this file's text encoding
# (Windows PowerShell 5.1 reads a BOM-less .ps1 as ANSI and would mangle it).
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$src = Join-Path $scriptDir "server"

# BlackCoffe is its OWN git repo; server\sigale is the hand-synced deploy copy.
# This is also the repo where you COMMIT after syncing.
$blackcoffe = "C:\dev\BlackCoffe"
$dst = Join-Path $blackcoffe "server\sigale"

# --- Sanity checks -------------------------------------------------------
if (-not (Test-Path -LiteralPath $src)) {
    Write-Error "Source not found: $src"
    exit 1
}

if (-not (Test-Path -LiteralPath $blackcoffe)) {
    Write-Error "BlackCoffe repo not found: $blackcoffe"
    exit 1
}

if (-not (Test-Path -LiteralPath $dst)) {
    Write-Host "Destination does not exist. Creating: $dst"
    New-Item -ItemType Directory -Path $dst -Force | Out-Null
}

Write-Host "Syncing Sigale server..."
Write-Host "  FROM: $src"
Write-Host "    TO: $dst"
Write-Host ""

# --- Mirror --------------------------------------------------------------
# /MIR  - mirror (copies new + modified, deletes files in dst not in src).
#         /MIR already implies /E (subdirs, including empty ones).
# /XD   - exclude dirs: node_modules, .git
# /XF   - exclude files: .env* (environment-specific), *.log
# /NP   - no per-file progress %      /NDL - no directory list (cleaner output)
# /NJH  - no job header (we already printed FROM/TO above)
# /BYTES- plain integers in the summary table so it parses predictably
# Output is captured instead of printed: we re-print just the file lines and
# replace robocopy's summary table with a single clear verdict line below.
$log = robocopy $src $dst /MIR `
    /XD "node_modules" ".git" `
    /XF ".env" ".env.*" "*.log" `
    /NP /NDL /NJH /BYTES

$rc = $LASTEXITCODE

# --- Report --------------------------------------------------------------
function Plural([int]$n, [string]$one, [string]$many) {
    if ($n -eq 1) { "$n $one" } else { "$n $many" }
}

# robocopy exit codes are BIT FLAGS. Bit 3 (value 8) is the failure bit, so
# any code < 8 is success (possibly with warnings):
#   1 = files copied   2 = extras deleted   4 = mismatches   (0-7 = OK)
#   8 = some files could not be copied       16 = fatal error
if ($rc -ge 8) {
    $log | ForEach-Object { Write-Host $_ }
    Write-Host ""
    Write-Host "ERROR: robocopy fallo con codigo $rc - revisa la salida de arriba." -ForegroundColor Red
    exit $rc
}

# Which files actually moved. robocopy tab-delimits its file entries, while the
# summary table is space-aligned, so "contains a tab" is a clean filter.
# /NDL means each entry carries a full path - strip the src/dst prefix so the
# list stays readable.
$details = @($log | Where-Object { $_ -match "`t" -and $_.Trim() })
$shown = 0
foreach ($line in $details) {
    if ($shown -ge 25) { Write-Host "  ... (+$($details.Count - 25) mas)"; break }
    $clean = ($line -replace "`t+", " ").Trim()
    $clean = $clean -replace [regex]::Escape($src), "" -replace [regex]::Escape($dst), ""
    Write-Host "  $clean"
    $shown++
}

# Parse robocopy's summary table. Its labels are localized, so match on SHAPE,
# not on text: every numeric row is
#   "<label> : Total Copied Skipped Mismatch FAILED Extras"
# and the rows always come in the order Dirs, Files, Bytes -> Files is index 1.
$rows = @($log | Where-Object { $_ -match '^\s*\S[^:]*:\s+\d+(\s+\d+){5}\s*$' })

Write-Host ""
if ($rows.Count -ge 2) {
    $n = @([regex]::Matches($rows[1], '\d+') | ForEach-Object { [int]$_.Value })
    $total = $n[0]; $copied = $n[1]; $failed = $n[4]; $extras = $n[5]

    $parts = @()
    if ($copied -gt 0) { $parts += (Plural $copied "archivo copiado" "archivos copiados") }
    if ($extras -gt 0) { $parts += (Plural $extras "archivo borrado en el destino" "archivos borrados en el destino") }
    if ($failed -gt 0) { $parts += (Plural $failed "archivo con error" "archivos con error") }

    if ($parts.Count -eq 0) {
        Write-Host "NADA PARA COPIAR - los $total archivos ya estaban identicos." -ForegroundColor Yellow
    }
    else {
        Write-Host ("SINCRONIZADO: " + ($parts -join ", ") + ".") -ForegroundColor Green
        Write-Host "Ahora haz commit en el repo BlackCoffe: $blackcoffe"
    }
}
else {
    # Summary table not found (unexpected robocopy output): fall back to the flags.
    if ($rc -eq 0) {
        Write-Host "NADA PARA COPIAR - todo ya estaba sincronizado." -ForegroundColor Yellow
    }
    else {
        Write-Host "SINCRONIZADO (robocopy codigo $rc)." -ForegroundColor Green
        Write-Host "Ahora haz commit en el repo BlackCoffe: $blackcoffe"
    }
}

# robocopy's non-zero success codes (1-7) would otherwise leak out as this
# script's exit code and look like a failure to the shell.
exit 0
