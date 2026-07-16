#!/usr/bin/env bash
# HRC Automator — DEBUG/STEP version — 1500 players, 75% spot
#
# Same as 75.sh but PROCESSES ONE HAND and PAUSES before every step so you can
# watch HRC and confirm each keystroke lands where it should. Press Enter to run
# the next step; Ctrl+C to abort. Use this to validate the navigation on the
# instance BEFORE running the unattended 75.sh over all hands.
#
# Requires: xdotool. Run inside the DCV graphical session ($DISPLAY set).

set -u

# --- Configuration ---------------------------------------------------------
HRC_TITLE="HRC"
SETUP_TITLE="Hand Setup"                            # progress-dialog title (to verify!)
INPUT_DIR="/home/ec2-user/Documents/Hands/output_hands/1500/75"
JS_FILE="/home/ec2-user/Documents/Hands/Data/low_icm_new.js"

pause() { echo; echo ">>> $1"; read -r -p "    [Enter] to run this step, Ctrl+C to abort... " _; }

activate_hrc() {
    local id best_id="" best_area=0 area
    for id in $(xdotool search --onlyvisible --name "$HRC_TITLE" 2>/dev/null); do
        eval "$(xdotool getwindowgeometry --shell "$id")"
        area=$(( WIDTH * HEIGHT ))
        [ "$area" -gt "$best_area" ] && { best_area=$area; best_id=$id; }
    done
    [ -n "$best_id" ] || return 1
    xdotool windowactivate --sync "$best_id" 2>/dev/null
}

# grab just the first queued hand
TargetFile=$(ls "$INPUT_DIR"/*.json 2>/dev/null | head -1)
[ -n "$TargetFile" ] || { echo "No JSON files in $INPUT_DIR"; exit 1; }
echo "Debug run with: $TargetFile"

pause "Activate HRC main window"
activate_hrc || { echo "ERROR: HRC window not found"; exit 1; }
sleep 1

pause "STEP 1: File -> New -> From Saved File (Alt+F, N, S)"
xdotool key --clearmodifiers alt+f; sleep 0.6
xdotool key n;                       sleep 0.6
xdotool key s;                       sleep 1.5

pause "STEP 2: type the JSON path + Enter"
xdotool type --clearmodifiers -- "$TargetFile"
xdotool key Return;                  sleep 3

pause "STEP 3: Next on Basic Hand Data (Alt+N)"
xdotool key --clearmodifiers alt+n;  sleep 1.5

pause "STEP 4: Next on MTT Stacks (Alt+N)"
xdotool key --clearmodifiers alt+n;  sleep 2

pause "STEP 5: to Scripting tab (Tab x4, Right x2) -- WATCH: does it land on Scripting?"
xdotool key Tab Tab Tab Tab;         sleep 0.5
xdotool key Right Right;             sleep 0.8

pause "STEP 6: to folder icon (Tab x1) + open dialog (Enter) -- WATCH: does the file dialog open?"
xdotool key Tab;                     sleep 0.5
xdotool key Return;                  sleep 1.5

pause "STEP 7: type the JS path + Enter"
xdotool type --clearmodifiers -- "$JS_FILE"
xdotool key Return;                  sleep 2

pause "STEP 8: Finish (Alt+F, Enter) -- hand setup should start building"
xdotool key --clearmodifiers alt+f;  sleep 1
xdotool key Return

echo
echo ">>> Hand setup is building. In a SECOND terminal, run this to find the"
echo "    progress-dialog title (we assumed \"$SETUP_TITLE\"):"
echo '        xdotool search --name "" 2>/dev/null | while read id; do'
echo '          n=$(xdotool getwindowname $id 2>/dev/null); [ -n "$n" ] && echo "$n"; done'
echo
pause "When the setup progress dialog has CLOSED, continue to Nash calc #1"

pause "STEP 10: Run Nash Calc #1 (Alt+R, Enter)"
xdotool key --clearmodifiers alt+r;  sleep 1
xdotool key Return;                  sleep 1.5

pause "When calc #1 has finished (progress dialog closed), continue to Nash calc #2"

pause "STEP 12: Run Nash Calc #2 (Alt+R, Enter)"
xdotool key --clearmodifiers alt+r;  sleep 1
xdotool key Return;                  sleep 1.5

echo
echo ">>> Debug run done. Hand was NOT moved to processed (debug mode leaves it in place)."
echo "    If every step landed correctly, run the unattended version: bash 75.sh"
