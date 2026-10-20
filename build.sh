set -e
cd "$(dirname "$0")"
{ cat src/1-head.html
  echo '<div id="app"></div>'
  echo '<nav id="nav" class="nav" aria-label="Navigation principale"></nav>'
  echo '<button id="fab" class="fab" aria-label="Nouvelle opération" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>'
  echo '<div id="actionbar" class="actionbar"></div>'
  echo '<script>'
  cat src/2-core.js src/3-ui.js src/4-sheets.js src/5-more.js src/7-ynab.js src/8-ynab-api.js src/9-drive.js src/10-bank.js src/6-events.js
  echo '</script>'
} > pecule.html
