$ErrorActionPreference = "Stop"
$baseUrl = $env:API_BASE_URL
if (-not $baseUrl) { $baseUrl = "http://127.0.0.1:5055" }
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$phone = "+9188$($stamp.ToString().Substring(3, 8))"

$body = @{
  fullName = "API Test Worker $stamp"
  phone = $phone
  yearOfBirth = 1992
  gender = "male"
  industry = "Construction"
  homeState = "Bihar"
  homeDistrict = "Samastipur"
  workDestination = "Mumbai MMR"
  consent = $true
} | ConvertTo-Json

$worker = Invoke-RestMethod "$baseUrl/api/workers" -Method Post -ContentType "application/json" -Body $body
$login = Invoke-RestMethod "$baseUrl/api/workers/login" -Method Post -ContentType "application/json" -Body (@{ workerId = $worker.worker.workerId } | ConvertTo-Json)
$profile = Invoke-RestMethod "$baseUrl/api/workers/$($worker.worker.workerId)" -Headers @{ Authorization = "Bearer $($login.tokens.accessToken)" }

if ($profile.worker.workerId -ne $worker.worker.workerId) {
  throw "Worker profile was not persisted"
}

Write-Output "Worker API flow passed"
