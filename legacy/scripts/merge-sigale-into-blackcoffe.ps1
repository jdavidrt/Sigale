# ============================================================
# RETIRED - superseded by /sync-sigale-server.ps1. Do not run:
# it hardcodes an old BlackCoffe path and copies from the wrong
# source directory. See legacy/README.md.
# ============================================================
# =============================================================================
# Sigale -> BlackCoffe shared-server merge
# Runs the "outside the repo" steps from SIGALE_MERGE_INTO_SHARED_SERVER.md:
#   1. Copies the merged tree from Sigale/server/current-server -> BlackCoffe/server
#   2. Installs Sigale's new npm deps in the BlackCoffe repo
#   3. Prints the env vars to set on the host + the deploy/seed checklist
#
# Idempotent: re-running is safe. Existing BlackCoffe files that didn't change
# get the same bytes back; the only net adds are sigale/ and the index.js patch.
# =============================================================================

$ErrorActionPreference = 'Stop'

# --- Paths --------------------------------------------------------------------
$SigaleSrc        = 'C:\dev\Sígale\server\current-server'
$BlackCoffeServer = 'C:\Users\jdk_l\OneDrive\Escritorio\BlackCoffe\blackcoffe\server'

Write-Host ''
Write-Host '=== Sigale -> BlackCoffe shared-server merge ===' -ForegroundColor Cyan
Write-Host "Source : $SigaleSrc"
Write-Host "Target : $BlackCoffeServer"
Write-Host ''

if (-not (Test-Path $SigaleSrc))        { throw "Source not found: $SigaleSrc" }
if (-not (Test-Path $BlackCoffeServer)) { throw "Target not found: $BlackCoffeServer" }

# --- 1) Backup the BlackCoffe server dir (timestamped, sibling) ---------------
$stamp  = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path (Split-Path $BlackCoffeServer -Parent) "server.backup-$stamp"
Write-Host "[1/4] Backing up current BlackCoffe/server -> $backup" -ForegroundColor Yellow
robocopy $BlackCoffeServer $backup /E /NFL /NDL /NJH /NJS /NP /XD node_modules .git | Out-Null
Write-Host '      done.'
Write-Host ''

# --- 2) Copy current-server contents into BlackCoffe/server -------------------
# /E   : copy subdirs including empty ones
# /XD  : exclude node_modules and .git (host owns those)
# /XO  : skip older - but we do want to overwrite, so omit /XO
# Robocopy exit codes 0-7 are success; 8+ are real errors.
Write-Host '[2/4] Copying Sigale-merged tree into BlackCoffe/server' -ForegroundColor Yellow
robocopy $SigaleSrc $BlackCoffeServer /E /NFL /NDL /NJH /NJS /NP /XD node_modules .git
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }
Write-Host '      done.'
Write-Host ''

# --- 3) npm install the new Sigale deps in the BlackCoffe repo ----------------
# Per plan S7.1: bcryptjs, express-rate-limit, helmet, node-cron.
# (resend, cors, express, mysql2 are already present in BlackCoffe.)
Write-Host '[3/4] Installing Sigale npm deps in BlackCoffe/server' -ForegroundColor Yellow
Push-Location $BlackCoffeServer
try {
    npm install bcryptjs express-rate-limit helmet node-cron
    if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}
Write-Host '      done.'
Write-Host ''

# --- 4) Reminders ------------------------------------------------------------
Write-Host '[4/4] Next steps (manual)' -ForegroundColor Yellow
Write-Host ''
Write-Host 'A) Set these env vars on the host (Render/DO dashboard):' -ForegroundColor Green
Write-Host '     SIGALE_DB_NAME=sigale'
Write-Host '     # Reused by Sigale + BlackCoffe (both pools, same instance):'
Write-Host '     DB_HOST, DB_PORT, DB_USER, DB_PASSWORD          (already set)'
Write-Host '     RESEND_API_KEY, NOTIFICATION_EMAIL, FROM_EMAIL  (already set)'
Write-Host '     # One-time, only needed for the first organizer seed:'
Write-Host '     ORGANIZER_USERNAME=<choose>'
Write-Host '     ORGANIZER_INITIAL_PASSWORD=<choose>'
Write-Host ''
Write-Host 'B) Update the Sigale frontend CORS origin once known:' -ForegroundColor Green
Write-Host "     Edit $BlackCoffeServer\index.js and uncomment the"
Write-Host '     // https://sigale.onrender.com line in app.use(cors({...})).'
Write-Host ''
Write-Host 'C) Commit + deploy:' -ForegroundColor Green
Write-Host '     cd ' $BlackCoffeServer
Write-Host '     git status'
Write-Host '     git add .'
Write-Host '     git commit -m "Merge Sigale into shared server (plan Phase 6)"'
Write-Host '     git push'
Write-Host ''
Write-Host 'D) After deploy: seed the first organizer (one-time):' -ForegroundColor Green
Write-Host '     # SSH into the host or run remotely:'
Write-Host '     node sigale/seed/seedOrganizer.js'
Write-Host ''
Write-Host 'E) Smoke test (plan S9):' -ForegroundColor Green
Write-Host '     curl https://<shared-host>/ping              # BlackCoffe (unchanged)'
Write-Host '     curl https://<shared-host>/api/health        # { ok: true, service: "sigale" }'
Write-Host '     curl https://<shared-host>/api/events/active # NOT index.html'
Write-Host ''
Write-Host 'F) Rollback if needed:' -ForegroundColor Green
Write-Host "     robocopy `"$backup`" `"$BlackCoffeServer`" /E /MIR"
Write-Host '     (Then redeploy from the previous git commit.)'
Write-Host ''
Write-Host '=== Done. ===' -ForegroundColor Cyan
