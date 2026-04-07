param(
  [int]$Port = 9022
)

$RootPath = (Get-Location).Path
$prefix = "http://localhost:$Port/"

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Front-end (estatico) escuchando en $prefix"
Write-Host "Sirviendo archivos desde: $RootPath"
Write-Host "Entradas: GET / (index.html), GET /archivo..."
Write-Host "Ctrl+C para parar."

function Get-ContentType([string]$path) {
  $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
  switch ($ext) {
    ".html" { return "text/html; charset=utf-8" }
    ".js"   { return "text/javascript; charset=utf-8" }
    ".css"  { return "text/css; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".png"  { return "image/png" }
    ".jpg"  { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".gif"  { return "image/gif" }
    ".svg"  { return "image/svg+xml" }
    default { return "application/octet-stream" }
  }
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()

    # Solo GET (para simplificar).
    $method = $context.Request.HttpMethod.ToUpperInvariant()
    if ($method -ne "GET") {
      $context.Response.StatusCode = 405
      $context.Response.Close()
      continue
    }

    $reqPath = $context.Request.Url.AbsolutePath.Trim('/')
    if ([string]::IsNullOrWhiteSpace($reqPath)) {
      $reqPath = "index.html"
    }

    # Evitar traversal de rutas.
    if ($reqPath -like "*..*" -or $reqPath.StartsWith("/")) {
      $context.Response.StatusCode = 400
      $context.Response.Close()
      continue
    }

    $filePath = Join-Path $RootPath $reqPath
    if (Test-Path $filePath -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $context.Response.ContentType = (Get-ContentType $filePath)
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $context.Response.StatusCode = 404
      $buf = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
      $context.Response.OutputStream.Write($buf, 0, $buf.Length)
    }

    $context.Response.Close()
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}

