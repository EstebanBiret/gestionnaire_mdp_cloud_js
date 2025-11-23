$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$dist = Join-Path $root 'dist'
$lambdaRoot = Join-Path $root 'lambdas'
$shared = Join-Path $lambdaRoot 'shared'
$sharedNodeModules = Join-Path $shared 'node_modules'
$sharedZip = Join-Path $shared 'shared.zip'

if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }
New-Item -ItemType Directory $dist | Out-Null

if (-not (Test-Path $sharedNodeModules)) {
    Write-Host 'Installation des dépendances dans shared...'
    Push-Location $shared
    npm install --production
    Pop-Location
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

if (-not (Test-Path $sharedZip) -or (Get-Item $sharedZip).LastWriteTime -lt (Get-Item $sharedNodeModules).LastWriteTime) {
    Write-Host 'Compression du cache shared...'
    if (Test-Path $sharedZip) { Remove-Item $sharedZip -Force }

    $tempZip = [System.IO.Compression.ZipFile]::Open($sharedZip, [System.IO.Compression.ZipArchiveMode]::Create)

    Get-ChildItem -Path $sharedNodeModules -Recurse -File | ForEach-Object {
        $relativePath = ($_.FullName.Substring($shared.Length + 1)) -replace '\\','/'
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($tempZip, $_.FullName, $relativePath)
    }

    $vendorPath = Join-Path $sharedNodeModules 'aws-sdk\vendor'
    if (Test-Path $vendorPath) {
        Get-ChildItem -Path $vendorPath -Recurse -File | ForEach-Object {
            $vendorRelative = ($_.FullName.Substring($vendorPath.Length + 1)) -replace '\\','/'
            $relativePath = "node_modules/aws-sdk/vendor/$vendorRelative"
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($tempZip, $_.FullName, $relativePath)
        }
    }

    $tempZip.Dispose()
}

$lambdas = @(
    @{ Name = 'create';     Path = 'passwords/create' }
    @{ Name = 'getAll';     Path = 'passwords/getAll' }
    @{ Name = 'delete';     Path = 'passwords/delete' }
    @{ Name = 'update';     Path = 'passwords/update' }
    @{ Name = 'register';   Path = 'auth/register' }
    @{ Name = 'logout';     Path = 'auth/logout' }
    @{ Name = 'login';      Path = 'auth/login' }
    @{ Name = 'authorizer'; Path = 'auth/authorizer' }
)

foreach ($lambda in $lambdas) {
    $lambdaPath = Join-Path $lambdaRoot $lambda.Path
    $handlerFile = Join-Path $lambdaPath 'handler.js'
    if (-not (Test-Path $handlerFile)) {
        Write-Warning "handler.js introuvable pour $($lambda.Name)"
        continue
    }

    $zipOut = Join-Path $dist "$($lambda.Name).zip"
    Copy-Item $sharedZip $zipOut -Force

    $zip = [System.IO.Compression.ZipFile]::Open($zipOut, [System.IO.Compression.ZipArchiveMode]::Update)
    $existing = $zip.GetEntry('handler.js')
    if ($existing) { $existing.Delete() }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $handlerFile, 'handler.js')
    $zip.Dispose()

    Write-Host "[ZIP] $zipOut prêt"
}

Write-Host 'Build done!'
