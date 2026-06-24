# sync-sigale-server.ps1
# Mirrors C:\dev\Sigale\server into the BlackCoffe repo's sigale subfolder.
# Safe: only writes inside ...\server\sigale\ — never touches BlackCoffe files.
# Run from anywhere; no args needed.

$src = "C:\dev\Sígale\server"
$dst = "C:\Users\jdk_l\OneDrive\Escritorio\BlackCoffe\blackcoffe\server\sigale"

# Sanity checks
if (-not (Test-Path $src)) {
    Write-Error "Source not found: $src"
    exit 1
}

if (-not (Test-Path $dst)) {
    Write-Host "Destination does not exist. Creating: $dst"
    New-Item -ItemType Directory -Path $dst -Force | Out-Null
}

Write-Host "Syncing Sigale server..."
Write-Host "  FROM: $src"
Write-Host "    TO: $dst"
Write-Host ""

# /MIR  - mirror (copies new + modified, deletes files in dst not in src)
# /E    - include subdirectories (including empty ones)
# /XD   - exclude directories: current-server (circular ref) and node_modules
# /XF   - exclude files: .env files (environment-specific), *.log
# /NP   - no progress % (cleaner output)
# /NDL  - no directory list in output (less noise)
robocopy $src $dst /MIR /E `
    /XD "current-server" "node_modules" ".git" `
    /XF ".env" ".env.*" "*.log" `
    /NP /NDL

$rc = $LASTEXITCODE

# robocopy exit codes: 0=no change, 1=files copied, 2=extra deleted, 3=both, 4+=errors
if ($rc -le 3) {
    Write-Host ""
    Write-Host "Done. Exit code $rc (0=no change, 1=copied, 2=deleted, 3=both)."
    Write-Host "You can now commit inside: C:\Users\jdk_l\OneDrive\Escritorio\BlackCoffe\blackcoffe"
} else {
    Write-Error "robocopy exited with code $rc — check output above for errors."
    exit $rc
}
