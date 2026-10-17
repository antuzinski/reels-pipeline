#!/bin/bash
# macOS launcher: double-click in Finder. Close the Terminal window to stop.
cd "$(dirname "$0")" || exit 1
node tools/sfx-board-server.mjs
