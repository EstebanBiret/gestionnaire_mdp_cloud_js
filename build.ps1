$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "ScriptDir: $scriptDir"


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
    @{ Name = "register"; Path = "auth/register" }
)


foreach ($lambda in $selectedLambdas) {

    $lambdaDir = Join-Path $lambdaRoot $lambda.Path
    $zipPath   = Join-Path $dist "$($lambda.Name).zip"

    Write-Host "[PACKAGING] $($lambda.Name).zip from $lambdaDir"

    if (-not (Test-Path $lambdaDir)) {
        Write-Warning "Lambda path '$lambdaDir' does not exist, skipping."
        continue
    }

    $itemsToZip = @()
    $itemsToZip += (Get-ChildItem -Path $lambdaDir -Recurse | ForEach-Object { $_.FullName })

    if (Test-Path $sharedDir) {
        $itemsToZip += (Get-ChildItem -Path $sharedDir -Recurse | ForEach-Object { $_.FullName })
    }

    $zipDir = Split-Path $zipPath -Parent
    if (-not (Test-Path $zipDir)) { New-Item -ItemType Directory -Path $zipDir | Out-Null }

    Compress-Archive -Path $itemsToZip -DestinationPath $zipPath -Force

    if (Test-Path $zipPath) {
        Write-Host "[ZIP CREATED] $zipPath"
    } else {
        Write-Warning "[ZIP FAILED] $zipPath"
    }
}

Write-Host "[DONE] Selected Lambdas packaged!"