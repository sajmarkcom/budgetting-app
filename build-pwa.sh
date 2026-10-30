set -e; cd "$(dirname "$0")"; bash build.sh
{ echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
  echo '<meta name="theme-color" content="#1E3A8A"><meta name="apple-mobile-web-app-status-bar-style" content="default"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="apple-touch-icon.png">'
  echo '<style>html{color-scheme:light}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'
  cat src/0-csp.html
  sed -n '1,/<\/style>/p' pecule.html | grep -v 'claude:viewport-fit-sides'
  echo '</head><body>'
  sed -n '/<\/style>/,$p' pecule.html | sed '1d'
  echo "<script>if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})</script>"
  echo '</body></html>'
} > index.html
