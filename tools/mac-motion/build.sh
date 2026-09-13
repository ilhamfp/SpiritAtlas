#!/bin/sh
set -eu
cd "$(dirname "$0")"
mkdir -p .build
xcrun clang -O2 -Wall reader.c -framework IOKit -framework CoreFoundation -o .build/btb-motion-reader
./.build/btb-motion-reader --presence
