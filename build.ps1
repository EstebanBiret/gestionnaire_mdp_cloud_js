# powershell
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "ScriptDir: $scriptDir"

$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) {
    $env:Path = "$nodePath;$env:Path"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found in PATH"
    exit 1
}

$projectRoot = $scriptDir
Write-Host "ProjectRoot: $projectRoot"

$dist = Join-Path $projectRoot "dist"
Write-Host "Dist folder will be created at: $dist"

if (Test-Path $dist) {
    Write-Host "Cleaning existing dist folder at $dist"
    Remove-Item -Recurse -Force $dist
}

Write-Host "Creating dist folder at $dist"
New-Item -ItemType Directory -Path $dist | Out-Null

$lambdaRoot = Join-Path $projectRoot "lambdas"
Write-Host "LambdaRoot: $lambdaRoot"

$sharedDir = Join-Path $lambdaRoot "shared"
Write-Host "Shared folder: $sharedDir"

$selectedLambdas = @(
    @{ Name = "create"; Path = "passwords/create" },
    @{ Name = "getAll"; Path = "passwords/getAll" },
    @{ Name = "delete"; Path = "passwords/delete" },
    @{ Name = "update"; Path = "passwords/update" }
)

foreach ($lambda in $selectedLambdas) {
    $lambdaDir = Join-Path $lambdaRoot $lambda.Path

    if (-not (Test-Path $lambdaDir)) {
        Write-Warning "Lambda path '$lambdaDir' does not exist, skipping."
        continue
    }

    Push-Location $lambdaDir
    if (Test-Path "package.json") {
        Write-Host "[NPM] Installing production dependencies for $($lambda.Name)"
        try {
            if (Test-Path "package-lock.json") {
                npm ci --omit=dev --no-audit --no-fund
            } else {
                npm install --omit=dev --no-audit --no-fund
            }
        } catch {
            Write-Warning "[NPM FAILED] $_"
        }
    }
    Pop-Location
}

Write-Host "Waiting for npm processes to release file locks..."
Start-Sleep -Seconds 5

foreach ($lambda in $selectedLambdas) {
    $lambdaDir = Join-Path $lambdaRoot $lambda.Path
    $zipPath   = Join-Path $dist "$($lambda.Name).zip"

    Write-Host "[PACKAGING] $($lambda.Name).zip from $lambdaDir"

    if (-not (Test-Path $lambdaDir)) {
        Write-Warning "Lambda path '$lambdaDir' does not exist, skipping."
        continue
    }

    $stagingDir = Join-Path $dist "tmp_$($lambda.Name)"
    if (Test-Path $stagingDir) {
        Remove-Item -Recurse -Force $stagingDir -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Path $stagingDir | Out-Null

    Copy-Item -Path (Join-Path $lambdaDir '*') -Destination $stagingDir -Recurse -Force -ErrorAction SilentlyContinue

    if (Test-Path $sharedDir) {
        $sharedTarget = Join-Path $stagingDir "shared"
        Copy-Item -Path (Join-Path $sharedDir '*') -Destination $sharedTarget -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Host "[CLEAN] Removing TypeScript artefacts"
    Get-ChildItem -Path $stagingDir -Recurse -Include *.ts,*.d.ts,*.map -File -ErrorAction SilentlyContinue |
            ForEach-Object { Remove-Item -Force -ErrorAction SilentlyContinue $_.FullName }

    $maxAttempts = 3
    $success = $false
    for ($i = 1; $i -le $maxAttempts; $i++) {
        try {
            Write-Host "[ZIP] Attempt $i for $($lambda.Name)"
            Push-Location $stagingDir
            Compress-Archive -Path * -DestinationPath $zipPath -Force
            Pop-Location

            if (Test-Path $zipPath) {
                Write-Host "[ZIP CREATED] $zipPath"
                $success = $true
                break
            } else {
                Write-Warning "[ZIP FAILED] $zipPath (not created)"
            }
        } catch {
            Write-Warning "[ZIP ERROR] Attempt $i failed: $_"
            Start-Sleep -Seconds 1
        }
    }

    Remove-Item -Recurse -Force $stagingDir -ErrorAction SilentlyContinue

    if (-not $success) {
        Write-Warning "[ZIP FAILED] $zipPath after $maxAttempts attempts"
    }
}

Write-Host "[DONE] Selected Lambdas packaged!"
