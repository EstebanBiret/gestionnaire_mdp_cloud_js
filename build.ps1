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
    @{ Name = "create";   Path = "passwords/create";   Include = @("handler.js") }
    @{ Name = "getAll";   Path = "passwords/getAll";   Include = @("handler.js") }
    @{ Name = "delete";   Path = "passwords/delete";   Include = @("handler.js") }
    @{ Name = "update";   Path = "passwords/update";   Include = @("handler.js") }
    @{ Name = "register"; Path = "auth/register";      Include = @("handler.js") }
    @{ Name = "logout";   Path = "auth/logout";        Include = @("handler.js") }
    @{ Name = "login";    Path = "auth/login";         Include = @("handler.js") }
    @{ Name = "authorizer"; Path = "auth/authorizer";  Include = @("handler.js") }
)

foreach ($lambda in $lambdas) {
    $lambdaPath = Join-Path $lambdaRoot $lambda.Path
    $zipOut = Join-Path $dist "$($lambda.Name).zip"
    Copy-Item $sharedZip $zipOut
    $zip = [System.IO.Compression.ZipFile]::Open($zipOut, 'Update')

    foreach ($pattern in $lambda.Include) {
        Get-ChildItem -Path $lambdaPath -Filter $pattern -Recurse | ForEach-Object {
            $entryPath = $_.FullName.Substring($lambdaRoot.Length + 1)
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryPath)
        }
    }

    $zip.Dispose()
    Write-Host "[ZIP] $zipOut créé"
}

Write-Host "Build done!"
