$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$dist = Join-Path $root "dist"
$lambdaRoot = Join-Path $root "lambdas"
$shared = Join-Path $lambdaRoot "shared"

# --- CORRECTION ---
# Les fichiers npm sont dans le dossier "shared"
$packageJson = Join-Path $shared "package.json"
$nodeModules = Join-Path $shared "node_modules"

# --- 1. Installation automatique des dépendances ---
if (Test-Path $packageJson) {
    Write-Host "package.json détecté dans 'shared'. Vérification des modules..."

    # On se déplace dans le dossier shared pour l'installation
    Push-Location $shared
    try {
        cmd /c "npm install --production"
        if ($LASTEXITCODE -ne 0) { throw "Erreur npm install" }
    }
    catch {
        Write-Error "Échec de l'installation des dépendances."
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Write-Warning "Aucun package.json trouvé dans $shared !"
}

if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }
New-Item -ItemType Directory $dist | Out-Null

# --- 2. Préparation du ZIP partagé (Code + Modules) ---
$tmpShared = Join-Path $root "tmp_shared"
if (Test-Path $tmpShared) { Remove-Item -Recurse -Force $tmpShared }
New-Item -ItemType Directory $tmpShared | Out-Null

# A. Copier TOUT le contenu de shared (utils.js + node_modules fraîchement installés)
# Comme node_modules est maintenant DANS shared, cette commande copie tout d'un coup.
Copy-Item "$shared\*" $tmpShared -Recurse

# B. Vérification de sécurité (pour être sûr que node_modules est bien là)
if (-not (Test-Path (Join-Path $tmpShared "node_modules"))) {
    Write-Warning "Attention : Le dossier node_modules semble absent du package final."
} else {
    Write-Host "node_modules inclus avec succès."
}

# C. Créer l'archive de base
$sharedZip = Join-Path $dist "shared.zip"
Compress-Archive -Path "$tmpShared\*" -DestinationPath $sharedZip -Force

Remove-Item -Recurse -Force $tmpShared

# --- 3. Construction des Lambdas ---
$lambdas = @(
    @{ Name = "create";     Path = "passwords/create";     Include = @("handler.js") }
    @{ Name = "getAll";     Path = "passwords/getAll";     Include = @("handler.js") }
    @{ Name = "delete";     Path = "passwords/delete";     Include = @("handler.js") }
    @{ Name = "update";     Path = "passwords/update";     Include = @("handler.js") }
    @{ Name = "register";   Path = "auth/register";        Include = @("handler.js") }
    @{ Name = "logout";     Path = "auth/logout";          Include = @("handler.js") }
    @{ Name = "login";      Path = "auth/login";           Include = @("handler.js") }
    @{ Name = "authorizer"; Path = "auth/authorizer";      Include = @("handler.js") }
)

foreach ($lambda in $lambdas) {
    $lambdaPath = Join-Path $lambdaRoot $lambda.Path
    $zipOut = Join-Path $dist "$($lambda.Name).zip"

    Copy-Item $sharedZip $zipOut

    $zip = [System.IO.Compression.ZipFile]::Open($zipOut, 'Update')

    foreach ($pattern in $lambda.Include) {
        Get-ChildItem -Path $lambdaPath -Filter $pattern -Recurse | ForEach-Object {
            $entryPath = $_.FullName.Substring($lambdaPath.Length)

            if ($entryPath.StartsWith("\") -or $entryPath.StartsWith("/")) {
                $entryPath = $entryPath.Substring(1)
            }

            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryPath)
        }
    }

    $zip.Dispose()
    Write-Host "$($lambda.Name) construit."
}

Write-Host "Build termine avec succes !" -ForegroundColor Cyan