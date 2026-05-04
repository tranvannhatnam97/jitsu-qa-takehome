#!/usr/bin/env bash
# Shared environment: exports JDK and Android SDK paths.
# Sourced by every other script. Idempotent — safe to re-source.

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

_prepend_path() {
  case ":$PATH:" in
    *":$1:"*) ;;
    *) [ -d "$1" ] && PATH="$1:$PATH" ;;
  esac
}

_prepend_path "$JAVA_HOME/bin"
_prepend_path "$ANDROID_HOME/cmdline-tools/latest/bin"
_prepend_path "$ANDROID_HOME/platform-tools"
_prepend_path "$ANDROID_HOME/emulator"
export PATH
