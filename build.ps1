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

# Installer toutes les dépendances en premier
foreach ($lambda in $selectedLambdas) {
    $lambdaDir = Join-Path $lambdaRoot $lambda.Path

    if (-not (Test-Path $lambdaDir)) {
        Write-Warning "Lambda path '$lambdaDir' does not exist, skipping."
        continue
    }

    Push-Location $lambdaDir
    if (Test-Path "package.json") {
        Write-Host "[NPM INSTALL] Installing dependencies for $($lambda.Name)"
        npm install --omit=dev
    }
    Pop-Location
}

# Attendre que tous les processus npm soient terminés
Write-Host "Waiting for npm processes to release file locks..."
Start-Sleep -Seconds 5

# Packager toutes les lambdas
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

    Start-Sleep -Seconds 2

    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::CreateFromDirectory($stagingDir, $zipPath, [System.IO.Compression.CompressionLevel]::Fastest, $false)
        Write-Host "[ZIP CREATED] $zipPath"
    } catch {
        Write-Warning "Failed with .NET method for $($lambda.Name), retrying with Compress-Archive..."
        Start-Sleep -Seconds 1
        Compress-Archive -Path (Join-Path $stagingDir '*') -DestinationPath $zipPath -Force

        if (Test-Path $zipPath) {
            Write-Host "[ZIP CREATED] $zipPath"
        } else {
            Write-Warning "[ZIP FAILED] $zipPath"
        }
    }

    Start-Sleep -Milliseconds 500
    Remove-Item -Recurse -Force $stagingDir -ErrorAction SilentlyContinue
}

Write-Host "[DONE] Selected Lambdas packaged!"
