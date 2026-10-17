#!/bin/bash
# macOS: opens Remotion Studio for the project folder (default: first-reel).
cd "$(dirname "$0")/${1:-first-reel}" || { echo "Project folder not found"; read -r; exit 1; }
echo "Запускаю Remotion Studio… Не закрывайте это окно, пока работаете в студии."
npx remotion studio
