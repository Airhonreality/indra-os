$path = "c:\Users\javir\Documents\DEVs\INDRA FRONT END\OrbitalCore_Codex_v1"
$files = Get-ChildItem -Path $path -Recurse -Include *.gs,*.js | Where-Object { $_.FullName -notmatch 'node_modules' }

$output = New-Object System.Text.StringBuilder
[void]$output.AppendLine("Estructura de archivos (.gs, .js) en OrbitalCore_Codex_v1:`n")

foreach ($file in $files) {
    # Calculate relative path
    $relativePath = $file.FullName.Substring($path.Length + 1)
    [void]$output.AppendLine($relativePath)
}

$output.ToString() | Set-Clipboard
Write-Host "Se ha copiado la LISTA de $($files.Count) archivos al portapapeles." -ForegroundColor Green
