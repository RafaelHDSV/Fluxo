# Ativa Node via nvm-windows ao abrir o terminal no VS Code/Cursor.
# Resolve .nvmrc (incl. "v22"), corrige PATH e escolhe a versao instalada.

function Get-NvmHome {
    if ($env:NVM_HOME -and (Test-Path $env:NVM_HOME)) {
        return $env:NVM_HOME
    }

    $defaultHome = Join-Path $env:APPDATA 'nvm'
    if (Test-Path $defaultHome) {
        $env:NVM_HOME = $defaultHome
        return $defaultHome
    }

    return $null
}

function Get-NvmSymlink {
    if ($env:NVM_SYMLINK -and (Test-Path $env:NVM_SYMLINK)) {
        return $env:NVM_SYMLINK
    }

    $settingsPath = Join-Path (Get-NvmHome) 'settings.txt'
    if ($settingsPath -and (Test-Path $settingsPath)) {
        $pathLine = Get-Content $settingsPath | Where-Object { $_ -match '^\s*path\s*:\s*(.+)$' } | Select-Object -First 1
        if ($pathLine -match '^\s*path\s*:\s*(.+)$') {
            $env:NVM_SYMLINK = $Matches[1].Trim()
            return $env:NVM_SYMLINK
        }
    }

    $defaultSymlink = 'C:\Program Files\nodejs'
    $env:NVM_SYMLINK = $defaultSymlink
    return $defaultSymlink
}

function Repair-NvmPath {
    param(
        [Parameter(Mandatory = $true)][string]$NvmHome,
        [Parameter(Mandatory = $true)][string]$NvmSymlink
    )

    $pathParts = $env:Path -split ';' | Where-Object {
        $_ -and
        $_ -ne '%NVM_HOME%' -and
        $_ -ne '%NVM_SYMLINK%' -and
        $_ -ne $NvmHome -and
        $_ -ne $NvmSymlink -and
        $_ -notlike "$NvmHome\*"
    }

    $env:Path = ($NvmHome, $NvmSymlink + $pathParts) -join ';'
}

function Find-Nvmrc {
    $dir = Get-Location
    while ($dir) {
        $candidate = Join-Path $dir '.nvmrc'
        if (Test-Path $candidate) {
            return $candidate
        }

        $parent = Split-Path $dir -Parent
        if (-not $parent -or $parent -eq $dir) {
            break
        }

        $dir = $parent
    }

    return $null
}

function Get-InstalledNvmVersions {
    param([Parameter(Mandatory = $true)][string]$NvmHome)

    Get-ChildItem -Path $NvmHome -Directory |
        Where-Object { $_.Name -match '^v?\d+\.' } |
        ForEach-Object { $_.Name.TrimStart('v') } |
        Sort-Object { [version]$_ } -Descending
}

function Resolve-NvmVersion {
    param(
        [Parameter(Mandatory = $true)][string]$Requested,
        [Parameter(Mandatory = $true)][string[]]$Installed
    )

    $requested = $Requested.Trim().TrimStart('v')
    if (-not $requested) {
        return $null
    }

    if ($requested -in $Installed) {
        return $requested
    }

    if ($requested -match '^\d+$') {
        $match = $Installed | Where-Object { $_ -match "^$requested\." } | Select-Object -First 1
        if ($match) {
            return $match
        }
    }

    return ($Installed | Where-Object { $_ -like "$requested*" } | Select-Object -First 1)
}

function Enable-NvmVersion {
    param(
        [Parameter(Mandatory = $true)][string]$Version,
        [Parameter(Mandatory = $true)][string]$NvmHome,
        [Parameter(Mandatory = $true)][string]$NvmSymlink
    )

    $versionDir = Join-Path $NvmHome "v$Version"
    if (-not (Test-Path $versionDir)) {
        return $false
    }

    $pathParts = $env:Path -split ';' | Where-Object {
        $_ -and
        $_ -ne $NvmSymlink -and
        $_ -notlike "$NvmHome\v*"
    }

    $env:Path = ($versionDir, $NvmSymlink + $pathParts) -join ';'
    return $true
}

function Invoke-NvmCli {
    param([Parameter(Mandatory = $true)][string]$Arguments)

    $nvmExe = Join-Path (Get-NvmHome) 'nvm.exe'
    if (-not (Test-Path $nvmExe)) {
        return 1
    }

    & cmd.exe /d /s /c "`"$nvmExe`" $Arguments >nul 2>&1 & exit /b %ERRORLEVEL%"
    return $LASTEXITCODE
}

$nvmHome = Get-NvmHome
if (-not $nvmHome) {
    Write-Warning 'nvm-windows nao encontrado. Instale em https://github.com/coreybutler/nvm-windows'
    return
}

$nvmSymlink = Get-NvmSymlink
Repair-NvmPath -NvmHome $nvmHome -NvmSymlink $nvmSymlink

$installed = @(Get-InstalledNvmVersions -NvmHome $nvmHome)
$nvmrcPath = Find-Nvmrc

if ($nvmrcPath) {
    $requested = (Get-Content $nvmrcPath -Raw).Trim()
    $version = Resolve-NvmVersion -Requested $requested -Installed $installed

    if (-not $version) {
        Write-Host "Instalando Node $requested (via nvm)..."
        Invoke-NvmCli -Arguments "install $requested" | Out-Null
        $installed = @(Get-InstalledNvmVersions -NvmHome $nvmHome)
        $version = Resolve-NvmVersion -Requested $requested -Installed $installed
    }

    if ($version -and (Enable-NvmVersion -Version $version -NvmHome $nvmHome -NvmSymlink $nvmSymlink)) {
        Write-Host "Node $(node -v) (nvm $version)"
    } elseif ($version) {
        Write-Warning "Versao $version listada no nvm, mas pasta nao encontrada em $nvmHome"
    } else {
        Write-Warning "Nao foi possivel resolver a versao do .nvmrc: $requested"
    }
} else {
    $defaultVersion = $installed | Select-Object -First 1

    if ($defaultVersion -and (Enable-NvmVersion -Version $defaultVersion -NvmHome $nvmHome -NvmSymlink $nvmSymlink)) {
        Write-Host "Node $(node -v) (nvm $defaultVersion)"
    }
}
