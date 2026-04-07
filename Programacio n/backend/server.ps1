param(
  [int]$Port = 9021
)

$prefix = "http://localhost:$Port/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Backend escuchando en $prefix"
Write-Host "Endpoints: GET /api/hello , GET /api/ping"
Write-Host "Ctrl+C para parar."

function Write-CorsHeaders($context) {
  # Permite llamadas desde cualquier origen (útil para front-end servido localmente).
  $context.Response.Headers.Add("Access-Control-Allow-Origin", "*")
  $context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
  $context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
}

function Write-Json($context, $obj, $statusCode = 200) {
  $json = $obj | ConvertTo-Json -Depth 10
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $context.Response.StatusCode = $statusCode
  $context.Response.ContentType = "application/json; charset=utf-8"
  $context.Response.ContentLength64 = $bytes.Length
  $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $context.Response.OutputStream.Flush()
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()

    # Ruta sin la barra inicial: /api/hello -> api/hello
    $path = $context.Request.Url.AbsolutePath.Trim('/')
    $method = $context.Request.HttpMethod.ToUpperInvariant()

    Write-CorsHeaders $context

    if ($method -eq "OPTIONS") {
      # Respuesta rápida para preflight CORS.
      $context.Response.StatusCode = 204
      $context.Response.OutputStream.Flush()
      $context.Response.Close()
      continue
    }

    if ($method -eq "GET" -and $path -eq "api/hello") {
      Write-Json $context @{
        message = "Hello World desde el back-end"
        time     = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
      } 200
    }
    elseif ($method -eq "GET" -and $path -eq "api/ping") {
      Write-Json $context @{ pong = $true; time = (Get-Date).ToString("HH:mm:ss") } 200
    }
    else {
      Write-Json $context @{ error = "No encontrado" } 404
    }

    $context.Response.Close()
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}

