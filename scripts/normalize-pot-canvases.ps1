param(
  [string[]]$Names,
  [string]$AssetRoot = '..\public\images\planting\pots',
  [string]$ReferenceName = 'flower-pot.png'
)

Add-Type -AssemblyName System.Drawing

$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot $AssetRoot))
$sourceDir = Join-Path $root 'corrected-transparent'
$referencePath = Join-Path $root $ReferenceName

function Get-AlphaBounds([System.Drawing.Bitmap]$bitmap) {
  $left = $bitmap.Width
  $top = $bitmap.Height
  $right = -1
  $bottom = -1

  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      if ($bitmap.GetPixel($x, $y).A -ge 128) {
        if ($x -lt $left) { $left = $x }
        if ($x -gt $right) { $right = $x }
        if ($y -lt $top) { $top = $y }
        if ($y -gt $bottom) { $bottom = $y }
      }
    }
  }

  return [System.Drawing.Rectangle]::FromLTRB($left, $top, $right + 1, $bottom + 1)
}

$reference = [System.Drawing.Bitmap]::FromFile($referencePath)
$targetBounds = Get-AlphaBounds $reference
$targetSize = New-Object System.Drawing.Size($reference.Width, $reference.Height)
$reference.Dispose()

$files = Get-ChildItem -LiteralPath $sourceDir -Filter '*.png'
if ($Names) {
  $files = $files | Where-Object { $Names -contains $_.Name }
}

$files | ForEach-Object {
  $source = [System.Drawing.Bitmap]::FromFile($_.FullName)
  $sourceBounds = Get-AlphaBounds $source
  $canvas = New-Object System.Drawing.Bitmap($targetSize.Width, $targetSize.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.DrawImage($source, $targetBounds, $sourceBounds, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()
  $source.Dispose()

  $tempPath = $_.FullName + '.normalized.png'
  $canvas.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()
  Move-Item -LiteralPath $tempPath -Destination $_.FullName -Force
}
