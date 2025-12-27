# Test-Upload fuer process-document Edge Function
# Funktioniert mit PowerShell 5.1+

param(
    [Parameter(Mandatory=$true)]
    [string]$PdfPath
)

$url = "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/process-document"

# Pruefen ob Datei existiert
if (-not (Test-Path $PdfPath)) {
    Write-Error "Datei nicht gefunden: $PdfPath"
    exit 1
}

$file = Get-Item $PdfPath
Write-Host "Uploading: $($file.Name) ($([math]::Round($file.Length/1KB, 1)) KB)" -ForegroundColor Cyan

# Multipart Form-Data erstellen (PowerShell 5.1 kompatibel)
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"$($file.Name)`"",
    "Content-Type: application/pdf",
    ""
)

$bodyStart = ($bodyLines -join $LF) + $LF
$bodyEnd = "$LF--$boundary--$LF"

# Datei lesen
$fileBytes = [System.IO.File]::ReadAllBytes($file.FullName)

# Body zusammenbauen
$encoding = [System.Text.Encoding]::GetEncoding("iso-8859-1")
$bodyStartBytes = $encoding.GetBytes($bodyStart)
$bodyEndBytes = $encoding.GetBytes($bodyEnd)

$body = New-Object byte[] ($bodyStartBytes.Length + $fileBytes.Length + $bodyEndBytes.Length)
[System.Buffer]::BlockCopy($bodyStartBytes, 0, $body, 0, $bodyStartBytes.Length)
[System.Buffer]::BlockCopy($fileBytes, 0, $body, $bodyStartBytes.Length, $fileBytes.Length)
[System.Buffer]::BlockCopy($bodyEndBytes, 0, $body, $bodyStartBytes.Length + $fileBytes.Length, $bodyEndBytes.Length)

# Request senden
try {
    Write-Host "Sende an Edge Function..." -ForegroundColor Yellow

    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -TimeoutSec 120

    Write-Host "`nErfolg!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "`nFehler!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host $_.Exception.Message

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host $reader.ReadToEnd()
    }
}
