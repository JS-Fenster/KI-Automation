$body = @{
    value = @(@{
        subscriptionId = '21f03d8e-6ace-456f-bafe-d7a0b2a80a46'
        changeType = 'created'
        resource = 'Users/f39679f6-38d2-48b1-9d6f-6e4e6f0f9e98/Messages/AAMkADYzTestMessage123'
        clientState = 'js-fenster-email-webhook-secret'
        tenantId = '08af0c7f-e407-4561-91f3-eb29b0d58f2e'
        resourceData = @{
            '@odata.type' = '#Microsoft.Graph.Message'
            '@odata.id' = 'Users/f39679f6-38d2-48b1-9d6f-6e4e6f0f9e98/Messages/AAMkADYzTestMessage123'
            id = 'AAMkADYzTestMessage123'
        }
    })
} | ConvertTo-Json -Depth 5

Write-Host "=== Simulated Webhook Test - Resource Mismatch Regression ==="
Write-Host "Testing GUID-format resource vs email-format in DB"
Write-Host ""
Write-Host "Request Body:"
Write-Host $body
Write-Host ""
Write-Host "Sending to email-webhook..."
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri 'https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/email-webhook' -Method Post -ContentType 'application/json' -Body $body
    Write-Host "Response:"
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $_"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
}
