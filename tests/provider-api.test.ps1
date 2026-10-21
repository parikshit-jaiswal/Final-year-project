$ErrorActionPreference = "Stop"
$baseUrl = $env:API_BASE_URL
if (-not $baseUrl) { $baseUrl = "http://127.0.0.1:5055" }
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$phone = "+9199$($stamp.ToString().Substring(3, 8))"

$body = @{
  category = "phc"
  fullName = "API Test Provider $stamp"
  designation = "Medical Officer"
  facilityId = "TEST-$stamp"
  phone = $phone
  state = "Maharashtra"
  district = "Pune"
  consent = $true
} | ConvertTo-Json

$provider = Invoke-RestMethod "$baseUrl/api/providers" -Method Post -ContentType "application/json" -Body $body
$otp = Invoke-RestMethod "$baseUrl/api/providers/auth/request-otp" -Method Post -ContentType "application/json" -Body (@{ phone = $phone } | ConvertTo-Json)
$verified = Invoke-RestMethod "$baseUrl/api/providers/auth/verify-otp" -Method Post -ContentType "application/json" -Body (@{ phone = $phone; code = $otp.otp } | ConvertTo-Json)
$profile = Invoke-RestMethod "$baseUrl/api/providers/$($provider.provider._id)" -Headers @{ Authorization = "Bearer $($verified.tokens.accessToken)" }

if ($profile.provider._id -ne $provider.provider._id) {
  throw "Provider profile was not persisted"
}

Write-Output "Provider API flow passed"
