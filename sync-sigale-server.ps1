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
# /XD   - exclude dirs: current-server (read-only BlackCoffe reference - must
#         NEVER be synced back), node_modules, .git
# /XF   - exclude files: .env* (environment-specific), *.log
# /NP   - no per-file progress %      /NDL - no directory list (cleaner output)
robocopy $src $dst /MIR `
    /XD "current-server" "node_modules" ".git" `
    /XF ".env" ".env.*" "*.log" `
    /NP /NDL

$rc = $LASTEXITCODE

# --- Report --------------------------------------------------------------
# robocopy exit codes are BIT FLAGS. Bit 3 (value 8) is the failure bit, so
# any code < 8 is success (possibly with warnings):
#   1 = files copied   2 = extras deleted   4 = mismatches   (0-7 = OK)
#   8 = some files could not be copied       16 = fatal error
if ($rc -lt 8) {
    Write-Host ""
    Write-Host "Done. robocopy code $rc (1=copied, 2=deleted, 4=mismatch; combined as bits)."
    if ($rc -band 4) {
        Write-Warning "Mismatches detected (bit 4) - review the output above."
    }
    Write-Host "Now commit the synced files inside the BlackCoffe repo: $blackcoffe"
}
else {
    Write-Error "robocopy failed with code $rc - check the output above for errors."
    exit $rc
}
