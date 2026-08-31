#!/usr/bin/env bash
# Starts the Appium server, waits for it to come up, runs the login-screen
# smoke test against the emulator, then tears the server down and exits
# with the test's own exit code.
#
# This lives in its own file (rather than inline in the workflow's
# script: block) because reactivecircus/android-emulator-runner executes
# each line of a multi-line script as its own separate shell invocation -
# it does not preserve variables or backgrounded jobs across lines, so
# APPIUM_PID=$! set on one line was invisible on the next. Running this
# whole thing as a single "bash run-appium-smoke.sh" call gives it normal,
# single-process bash semantics instead.
set -uo pipefail

appium --base-path / --log-timestamp &
APPIUM_PID=$!
sleep 8

APK_PATH="$GITHUB_WORKSPACE/SpendAgentMobile/android/app/build/outputs/apk/debug/app-debug.apk" \
APP_PACKAGE="com.spendagent.mobile" \
  node mobile-tests/test/login-screen.test.js
TEST_EXIT=$?

kill "$APPIUM_PID" 2>/dev/null || true
exit "$TEST_EXIT"

