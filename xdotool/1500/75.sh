#!/usr/bin/env bash
# HRC Automator (Linux/xdotool port of 75.ahk) — 1500 players, 75% spot
#
# AutoHotkey is Windows-only; this is the Linux equivalent using xdotool.
# Run it inside the graphical session (e.g. Amazon DCV) where the HRC GUI
# is visible, with $DISPLAY pointing at that X server.
#
# Requires: xdotool   (Amazon Linux: sudo yum install -y xdotool)
# Exit anytime with Ctrl+C.

set -u

# --- Configuration (EDIT these for the instance) ---------------------------
HRC_TITLE="HRC"                                    # main window title (partial match)
SETUP_TITLE="Hand Setup"                           # progress-dialog title (setup + calc)
INPUT_DIR="/home/ec2-user/HRCScript/output_hands/1500/75"   # TODO: instance path
JS_FILE="/home/ec2-user/HRCScript/Data/low_icm_new.js"      # TODO: instance path
PROCESSED_DIR="$INPUT_DIR/processed"
LOOP_DELAY=5                                        # seconds between passes

# --- Helpers ---------------------------------------------------------------

# Activate the HRC main window (first match).
activate_hrc() {
    local id
    id=$(xdotool search --name "$HRC_TITLE" 2>/dev/null | head -1)
    [ -n "$id" ] || return 1
    xdotool windowactivate --sync "$id" 2>/dev/null
}

# Wait until a window whose title matches $1 APPEARS (timeout $2 seconds).
wait_window_appear() {
    local name="$1" timeout="${2:-30}" waited=0
    while ! xdotool search --name "$name" >/dev/null 2>&1; do
        sleep 0.5
        waited=$((waited + 1))
        [ "$waited" -ge $((timeout * 2)) ] && return 1
    done
}

# Wait until every window whose title matches $1 has CLOSED (no timeout —
# this is the calc, which can run for many minutes).
wait_window_close() {
    local name="$1"
    while xdotool search --name "$name" >/dev/null 2>&1; do
        sleep 1
    done
}

# --- Main loop -------------------------------------------------------------

mkdir -p "$PROCESSED_DIR"

while true; do
    shopt -s nullglob
    for TargetFile in "$INPUT_DIR"/*.json; do
        activate_hrc || { echo "ERROR: HRC window not found; retrying next pass"; continue; }
        sleep 1

        # STEP 1: File -> New -> From Saved File (Alt+F, N, S)
        xdotool key --clearmodifiers alt+f; sleep 0.6
        xdotool key n;                       sleep 0.6
        xdotool key s;                       sleep 1.5

        # STEP 2: type the JSON file path
        xdotool type --clearmodifiers -- "$TargetFile"
        xdotool key Return;                  sleep 3

        # STEP 3: Next on Basic Hand Data (Alt+N)
        xdotool key --clearmodifiers alt+n;  sleep 1.5

        # STEP 4: Next on MTT Stacks (Alt+N) — buckets/otherstacks already in JSON
        xdotool key --clearmodifiers alt+n;  sleep 2

        # STEP 5: to Scripting tab (4x Tab, 2x Right)
        xdotool key Tab Tab Tab Tab;         sleep 0.5
        xdotool key Right Right;             sleep 0.8

        # STEP 6: to folder icon (1x Tab) and open the dialog
        xdotool key Tab;                     sleep 0.5
        xdotool key Return;                  sleep 1.5

        # STEP 7: type the JS script path
        xdotool type --clearmodifiers -- "$JS_FILE"
        xdotool key Return;                  sleep 2

        # STEP 8: Finish (Alt+F)
        xdotool key --clearmodifiers alt+f;  sleep 1
        xdotool key Return

        # STEP 9: hand setup builds — wait for its progress dialog to close
        wait_window_appear "$SETUP_TITLE" 30
        wait_window_close  "$SETUP_TITLE"
        sleep 0.8; activate_hrc; sleep 0.3

        # STEP 10: run Nash calc #1 (Alt+R), then OK
        xdotool key --clearmodifiers alt+r;  sleep 1
        xdotool key Return;                  sleep 1.5

        # STEP 11: wait for calc #1 progress dialog to close
        wait_window_appear "$SETUP_TITLE" 30
        wait_window_close  "$SETUP_TITLE"
        sleep 0.8; activate_hrc; sleep 0.3

        # STEP 12: run Nash calc #2 (Alt+R), then OK
        xdotool key --clearmodifiers alt+r;  sleep 1
        xdotool key Return;                  sleep 1.5

        # STEP 13: wait for calc #2 progress dialog to close
        wait_window_appear "$SETUP_TITLE" 30
        wait_window_close  "$SETUP_TITLE"
        sleep 0.8; activate_hrc; sleep 0.3

        # Done with this hand — move it to processed
        mv -- "$TargetFile" "$PROCESSED_DIR/"
        echo "Processed: $(basename "$TargetFile")"
    done
    sleep "$LOOP_DELAY"
done
