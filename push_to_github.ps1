# 1-Click Script to Push Madhav Enterprises to GitHub
param (
    [string]$GitHubToken = ""
)

$gitPath = "C:\Users\Gopal\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe"
if (-not (Test-Path $gitPath)) {
    $gitPath = "git"
}
$projectDir = if ($PSScriptRoot) { $PSScriptRoot } else { "G:\My Drive\AntigravityProjects\madhav-enterprises" }
Set-Location $projectDir

if ($GitHubToken -ne "") {
    Write-Host "Pushing with provided Personal Access Token..." -ForegroundColor Cyan
    & $gitPath push "https://${GitHubToken}@github.com/drshyamp19/madahv-enterprises.git" main
} else {
    Write-Host "Attempting push to GitHub..." -ForegroundColor Cyan
    & $gitPath push -u origin main
}
