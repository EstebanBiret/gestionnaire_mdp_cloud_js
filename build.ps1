$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$dist = Join-Path $root "dist"
$lambdaRoot = Join-Path $root "lambdas"
$shared = Join-Path $lambdaRoot "shared"

if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }
New-Item -ItemType Directory $dist | Out-Null

# Créer un dossier temporaire pour shared
$tmpShared = Join-Path $root "tmp_shared"
if (Test-Path $tmpShared) { Remove-Item -Recurse -Force $tmpShared }
Copy-Item $shared $tmpShared -Recurse

# Zipper shared une fois
$sharedZip = Join-Path $dist "shared.zip"
Compress-Archive -Path "$tmpShared/*" -DestinationPath $sharedZip -Force

Remove-Item -Recurse -Force $tmpShared

$lambdas = @(
    @{ Name = "create";   Path = "passwords/create" }
    @{ Name = "getAll";   Path = "passwords/getAll" }
    @{ Name = "delete";   Path = "passwords/delete" }
    @{ Name = "register"; Path = "auth/register" }
    @{ Name = "logout";   Path = "auth/logout" }
    @{ Name = "login";    Path = "auth/login" }
)

foreach ($lambda in $lambdas) {

    $lambdaPath = Join-Path $lambdaRoot $lambda.Path
    $zipOut = Join-Path $dist "$($lambda.Name).zip"

    # Copier shared.zip comme base
    Copy-Item $sharedZip $zipOut

    # Injecter le handler dedans
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::Open($zipOut, 'Update')

    Get-ChildItem -Recurse $lambdaPath | ForEach-Object {
        $entryPath = $_.FullName.Substring($lambdaRoot.Length + 1)
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryPath)
    }

    $zip.Dispose()
    Write-Host "[ZIP] $zipOut created"
}

Write-Host "Build done!"
