#!/bin/bash
# Detached dev server launcher — double-fork to survive parent exit
cd /home/z/my-project
rm -f dev.log
(
  (
    setsid bash -c 'cd /home/z/my-project && exec bun run dev' </dev/null >/dev/null 2>&1 &
    echo $! > /home/z/my-project/.zscripts/dev.pid
  )
)
exit 0
