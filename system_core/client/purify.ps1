$files = Get-ChildItem -Path "c:\Users\javir\Documents\DEVs\INDRA FRONT END\system_core\client\src" -Filter *.jsx -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    # Caso 1: import React, { something } from 'react' -> import { something } from 'react'
    $content = $content -replace "import React,\s*\{", "import {"
    # Caso 2: import { something }, React from 'react' -> import { something } from 'react'
    $content = $content -replace ",\s*React\s*\}", " }"
    # Caso 3: import React from 'react' (reforzado)
    $content = $content -replace "(?m)^\s*import React from ['\"]react['\"];?\s*`r?`n", ""
    
    $content | Set-Content $file.FullName
}
