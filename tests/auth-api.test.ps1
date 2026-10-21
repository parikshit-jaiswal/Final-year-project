$ErrorActionPreference = "Stop"
$baseUrl = $env:API_BASE_URL
if (-not $baseUrl) { $baseUrl = "http://127.0.0.1:5055" }

try {
  Invoke-RestMethod "$baseUrl/api/auth/refresh" -Method Post -ContentType "application/json" -Body "{}"
  throw "Missing refresh token was accepted"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 400) {
    throw
  }
}

try {
  Invoke-RestMethod "$baseUrl/api/providers/000000000000000000000000" -Headers @{ Authorization = "Bearer invalid" }
  throw "Invalid access token was accepted"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 401) {
    throw
  }
}

Write-Output "Auth failure flows passed"
