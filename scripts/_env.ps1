#Requires -Version 5.1
<#
Shared environment for the *.ps1 scripts. Dot-source it:
    . scripts\_env.ps1

Auto-detects JDK 17 in common locations and ANDROID_HOME under
%LOCALAPPDATA%\Android\Sdk (Android Studio default) or %USERPROFILE%\Android\sdk.
Idempotent — safe to dot-source multiple times.
#>

if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $candidates = @(
        "$env:ProgramFiles\Microsoft\jdk-17*",
        "$env:ProgramFiles\Eclipse Adoptium\jdk-17*",
        "$env:ProgramFiles\Java\jdk-17*",
        "$env:ProgramFiles\Zulu\zulu-17*",
        "$env:ProgramW6432\Microsoft\jdk-17*"
    )
    $jdk = Get-ChildItem -Path $candidates -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending | Select-Object -First 1
    if ($jdk) { $env:JAVA_HOME = $jdk.FullName }
}

if (-not $env:ANDROID_HOME) {
    if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
        $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
    } else {
        $env:ANDROID_HOME = "$env:USERPROFILE\Android\sdk"
    }
}
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

function Add-PathIfMissing([string]$dir) {
    if ($dir -and (Test-Path $dir) -and (";$env:Path;" -notlike "*;$dir;*")) {
        $env:Path = "$dir;$env:Path"
    }
}

if ($env:JAVA_HOME)    { Add-PathIfMissing "$env:JAVA_HOME\bin" }
Add-PathIfMissing "$env:ANDROID_HOME\cmdline-tools\latest\bin"
Add-PathIfMissing "$env:ANDROID_HOME\platform-tools"
Add-PathIfMissing "$env:ANDROID_HOME\emulator"
