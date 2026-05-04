#!/usr/bin/env bash
# Source this file in any shell that wants to talk to the Android SDK / emulator:
#   source scripts/setup-env.sh
#
# Idempotent: safe to source multiple times.

export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

# Prepend tool dirs only if missing
case ":$PATH:" in
  *":$JAVA_HOME/bin:"*) ;;
  *) export PATH="$JAVA_HOME/bin:$PATH" ;;
esac
case ":$PATH:" in
  *":$ANDROID_HOME/platform-tools:"*) ;;
  *) export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH" ;;
esac

echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"
java -version 2>&1 | head -1
which adb emulator avdmanager 2>/dev/null
