# ISK Module Validator (PowerShell)
# Ensures zero .gs imports and validates metadata compliance

$ISK_ROOT = "src\modules\isk"
$VIOLATIONS = @()

function Scan-Directory {
    param([string]$Path)
    
    Get-ChildItem -Path $Path -Recurse -Include *.jsx,*.js | ForEach-Object {
        $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
        $content = Get-Content $_.FullName -Raw
        
        # Check for .gs imports
        if ($content -match 'import\s+.*from\s+[''"].*\.gs[''"]') {
            $VIOLATIONS += @{
                File = $relativePath
                Type = "FORBIDDEN_IMPORT"
                Details = "Found .gs import in file"
            }
        }
        
        # Check for metadata in .jsx files
        if ($_.Extension -eq ".jsx" -and $content -notmatch '\.metadata\s*=') {
            $VIOLATIONS += @{
                File = $relativePath
                Type = "MISSING_METADATA"
                Details = "Component missing .metadata declaration"
            }
        }
    }
}

Write-Host "🔍 Scanning ISK module for violations...`n" -ForegroundColor Cyan

Scan-Directory -Path $ISK_ROOT

if ($VIOLATIONS.Count -eq 0) {
    Write-Host "✅ All checks passed! ISK module is compliant.`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Found $($VIOLATIONS.Count) violation(s):`n" -ForegroundColor Red
    $i = 1
    foreach ($v in $VIOLATIONS) {
        Write-Host "$i. [$($v.Type)] $($v.File)" -ForegroundColor Yellow
        Write-Host "   $($v.Details)`n"
        $i++
    }
    exit 1
}
