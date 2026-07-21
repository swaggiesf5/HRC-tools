#!/usr/bin/env bash
# HRC Automator (Linux/xdotool) — 1500 players, 5 spot — low_icm_new.js
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
INPUT_DIR="/home/ec2-user/Documents/Hands/output_hands/1500/5"   # instance hands dir
JS_FILE="/home/ec2-user/Documents/Hands/Data/low_icm_new.js"     # instance betting script
PROCESSED_DIR="$INPUT_DIR/processed"
LOG_FILE="$INPUT_DIR/run.log"                       # timestamped progress log
LOOP_DELAY=5                                        # seconds between passes

# --- Logging ---------------------------------------------------------------
# Nobody watches a 45-minute calc. Every step is timestamped to both the
# terminal and $LOG_FILE so the run can be checked long after the fact:
#   tail -f  <run.log>   (watch live)   |   grep calc <run.log>   (timings)
log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE"; }

# The Nash calc shows its own window: "From <hand>.json: Monte Carlo Sampling"
# (MC-CFR progress bar + ETA). Matching that title directly is far tighter than
# diffing against a baseline — other windows opening on the desktop can't
# confuse it.
calc_dialog_present() {
    xdotool search --onlyvisible --name 'Monte Carlo Sampling' 2>/dev/null | grep -q .
}

# Wait for one Nash calc: the MC dialog appears, then closes. No timeout on the
# run itself (calc #1 is ~30-45 min). Returns 1 if the dialog never showed up
# within 90s, which means the calc never actually started.
wait_calc_done() {
    local t=0 gone=0
    while ! calc_dialog_present; do
        sleep 2; t=$((t + 2)); [ "$t" -ge 90 ] && return 1
    done
    while :; do
        if calc_dialog_present; then
            gone=0
        else
            gone=$((gone + 1)); [ "$gone" -ge 2 ] && return 0
        fi
        sleep 5
    done
}

# Wait for an export file to appear AND finish writing. The .zip is ~10 MB, so
# existing is not the same as complete: poll the size until it stops changing
# for 2 consecutive checks. Far more trustworthy than watching windows — the
# file on disk IS the deliverable. Times out after ~5 min; returns 1 if never
# seen (caller logs it and skips the move rather than losing the hand).
wait_file_stable() {
    local f="$1" t=0 last=-1 size stable=0
    while [ ! -e "$f" ]; do
        sleep 2; t=$((t + 2)); [ "$t" -ge 300 ] && return 1
    done
    while :; do
        size=$(stat -c %s "$f" 2>/dev/null || echo 0)
        if [ "$size" = "$last" ] && [ "$size" -gt 0 ]; then
            stable=$((stable + 1)); [ "$stable" -ge 2 ] && return 0
        else
            stable=0
        fi
        last=$size
        sleep 2
    done
}

# Human-readable duration from a start timestamp (seconds since epoch).
elapsed_since() {
    local s=$(( $(date +%s) - $1 ))
    printf '%dm %02ds' $(( s / 60 )) $(( s % 60 ))
}

# --- Helpers ---------------------------------------------------------------

# Activate the HRC main window. HRC opens several windows all titled "HRC Pro "
# (identical titles, ids change every restart), so we can't pick by name or id.
# Instead pick the LARGEST visible match — that is reliably the main window.
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

# Snapshot the set of visible, named windows (sorted ids).
snapshot() { xdotool search --onlyvisible --name '.' 2>/dev/null | sort; }

# True if any visible window exists that is NOT in baseline $1 — i.e. a dialog
# (the run-confirmation, or the long calc progress dialog) is currently open.
extra_present() {
    local base="$1" cur
    cur=$(snapshot)
    [ -n "$(comm -13 <(printf '%s\n' "$base") <(printf '%s\n' "$cur"))" ]
}

# Wait for a long HRC operation (hand setup / Nash calc) to finish WITHOUT
# depending on the dialog title (it varies, and the calc can take ~an hour).
# We watch for an "extra" window (the progress dialog) relative to the
# persistent baseline: first wait up to 30s for one to appear, then wait — no
# timeout — until no extra window has been present for 2 consecutive polls
# (the 2-poll rule ignores the brief gap between the confirm and progress
# dialogs, so we never declare "done" early and loop into the next hand).
# Returns 0 if a popup was seen and waited out (normal), 1 if none ever
# appeared within 30s — the caller logs that as NO-DIALOG, which is the
# warning sign that we raced ahead without actually waiting for anything.
wait_busy_done() {
    local base="$1" t=0 clear=0
    while ! extra_present "$base"; do
        sleep 1; t=$((t + 1)); [ "$t" -ge 30 ] && return 1
    done
    while :; do
        if extra_present "$base"; then
            clear=0
        else
            clear=$((clear + 1)); [ "$clear" -ge 2 ] && break
        fi
        sleep 5
    done
}

# --- Main loop -------------------------------------------------------------

mkdir -p "$PROCESSED_DIR"

# Baseline = the persistent windows present while HRC sits idle at its Home
# screen (main window + terminals). Any window beyond this baseline is a
# dialog or progress popup. Capture it now, before any hand is opened.
MAIN_BASELINE=$(snapshot)

log "=========================================================="
log "Run started — input: $INPUT_DIR"
log "Remaining hands: $(find "$INPUT_DIR" -maxdepth 1 -name '*.json' | wc -l)"
log "REMINDER: Export Strategies scope must be set to 'Complete Export' once,"
log "          by hand, before this run (HRC remembers it afterwards)."

while true; do
    # Process hands in natural numeric order: avg_15bb_03, _04, _05, ...
    # (sort -V handles both the zero-padded index and the bb value correctly,
    # unlike a plain *.json glob which sorts purely alphabetically). Files in
    # the processed/ subdir are excluded by -maxdepth 1.
    mapfile -t HANDS < <(find "$INPUT_DIR" -maxdepth 1 -name '*.json' | sort -V)
    for TargetFile in "${HANDS[@]}"; do
        [ -e "$TargetFile" ] || continue
        HAND_START=$(date +%s)
        log "=== Starting: $(basename "$TargetFile") ==="
        activate_hrc || { log "ERROR: HRC window not found; retrying next pass"; continue; }
        sleep 1

        # STEP 1: File -> New Calculation -> Start Hand from Saved File.
        # Linux HRC menu navigated by arrows:
        #   Alt+F opens File, Right -> open New Calculation submenu,
        #   Down x2 -> Start Hand from Saved File, Enter -> GTK file chooser.
        xdotool key --clearmodifiers alt+f;  sleep 1
        xdotool key Right;                   sleep 0.5
        xdotool key Down;                    sleep 0.3
        xdotool key Down;                    sleep 0.3
        xdotool key Return;                  sleep 1.5

        # STEP 2: type the JSON file path into the GTK file chooser.
        # GTK choosers need Ctrl+L to open the location bar before typing a path.
        xdotool key --clearmodifiers ctrl+l; sleep 0.5
        xdotool type --clearmodifiers -- "$TargetFile"
        xdotool key Return;                  sleep 3

        # STEP 3: Next on Basic Hand Data (Alt+N)
        xdotool key --clearmodifiers alt+n;  sleep 1.5

        # STEP 4: Next on MTT Stacks (Alt+N) — buckets/otherstacks already in JSON
        xdotool key --clearmodifiers alt+n;  sleep 2

        # STEP 5: to Scripting tab (4x Tab, 2x Right)
        xdotool key Tab Tab Tab Tab;         sleep 0.5
        xdotool key Right Right;             sleep 0.8

        # STEP 6+7: load the betting script.
        #   Tab   -> focus the folder browse button,
        #   Enter -> open the GTK file chooser,
        #   Ctrl+L-> location bar, type the .js path, Enter.
        xdotool key Tab;                     sleep 0.6
        xdotool key Tab;                     sleep 0.6
        xdotool key Return;                  sleep 1.2
        xdotool key --clearmodifiers ctrl+l; sleep 0.5
        xdotool type --clearmodifiers -- "$JS_FILE"
        xdotool key Return;                  sleep 2

        # STEP 8: Finish (Alt+F)
        xdotool key --clearmodifiers alt+f;  sleep 1
        xdotool key Return

        # STEP 9: wizard closes and hand setup builds — wait until the wizard
        # and any progress dialog are gone and we're back to the baseline.
        wait_busy_done "$MAIN_BASELINE" || log "  WARNING: setup — no dialog seen in 30s"
        sleep 0.8; activate_hrc; sleep 0.3
        log "  setup done"

        # STEP 10: run Nash calc #1 (Alt+R), confirm only if asked.
        # The Enter is ONLY for a pre-calc confirmation dialog. Once the Monte
        # Carlo window is up we must NOT press Enter: its default button is
        # "Run in Background", which would hide the calc and make the wait below
        # think it finished — sending calc #2 into a still-running calc #1.
        log "  calc #1 started"
        T=$(date +%s)
        xdotool key --clearmodifiers alt+r;  sleep 1
        calc_dialog_present || { xdotool key Return; sleep 1.5; }

        # STEP 11: Nash calc #1 runs (~30-45 min) — wait for the MC window to close.
        wait_calc_done || log "  WARNING: calc #1 — MC dialog never appeared (calc did not start)"
        log "  calc #1 done in $(elapsed_since "$T")"
        sleep 0.8; activate_hrc; sleep 0.3

        # STEP 12: run Nash calc #2 (Alt+R), same no-Enter-once-running guard.
        log "  calc #2 started"
        T=$(date +%s)
        xdotool key --clearmodifiers alt+r;  sleep 1
        calc_dialog_present || { xdotool key Return; sleep 1.5; }

        # STEP 13: Nash calc #2 runs (~3-10 min, much faster than #1) — wait.
        wait_calc_done || log "  WARNING: calc #2 — MC dialog never appeared (calc did not start)"
        log "  calc #2 done in $(elapsed_since "$T")"
        sleep 0.8; activate_hrc; sleep 0.3

        # STEP 14: export the solved strategies.
        #   Ctrl+H, E    -> Hand > Export Strategies (accelerator chord, same
        #                   kind as Alt+R; works without menu navigation).
        #   Return       -> OK on the Export Strategies dialog. The scope
        #                   dropdown must already be set to "Complete Export";
        #                   HRC remembers it, so it is set ONCE by hand before
        #                   the run (see the startup reminder in the log).
        #   Return       -> Save on the GTK save dialog. No Ctrl+L and no typing:
        #                   it opens in this spot's folder with the name already
        #                   filled in ("From <hand>.json" -> "...json.zip").
        log "  export started"
        T=$(date +%s)
        EXPORT_ZIP="$INPUT_DIR/From $(basename "$TargetFile").zip"
        xdotool key --clearmodifiers ctrl+h; sleep 0.4
        xdotool key e;                       sleep 1.5
        xdotool key Return;                  sleep 2      # OK -> save dialog
        xdotool key Return;                  sleep 1      # Save (default name)

        # The .zip landing on disk and finishing its write is the real proof the
        # hand is done — so the hand is only retired once that file is complete.
        if wait_file_stable "$EXPORT_ZIP"; then
            log "  export done in $(elapsed_since "$T") ($(du -h "$EXPORT_ZIP" | cut -f1))"
            mv -- "$EXPORT_ZIP" "$PROCESSED_DIR/"
            mv -- "$TargetFile" "$PROCESSED_DIR/"
            log "Processed: $(basename "$TargetFile") — total $(elapsed_since "$HAND_START") | remaining: $(find "$INPUT_DIR" -maxdepth 1 -name '*.json' | wc -l)"
        else
            # No export file => the hand is NOT done. Leave the JSON in place so
            # it is retried on the next pass instead of being silently lost.
            log "  ERROR: export file never appeared: $(basename "$EXPORT_ZIP")"
            log "SKIPPED (will retry): $(basename "$TargetFile")"
        fi
    done
    sleep "$LOOP_DELAY"
done
