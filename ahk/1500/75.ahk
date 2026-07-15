; HRC Automator — 1500 players — 75% spot — low_icm_new.js
; (Debug Version - Precision Navigation)
; Using user-provided Tab/Arrow sequence for Step 5 & 6

#NoEnv
SetWorkingDir %A_ScriptDir%
SendMode Input
SetTitleMatchMode, 2

; Configuration
HRC_TITLE := "HRC"
INPUT_DIR := "C:\Users\Swaggy\Documents\Deeprun\HRCScript\output_hands\1500\75"
JS_FILE := "C:\Users\Swaggy\Documents\Deeprun\HRCScript\Data\low_icm_new.js"
LOOP_DELAY := 5000

Loop {
    Loop, Files, %INPUT_DIR%\*.json
    {
        TargetFile := A_LoopFileFullPath

        if WinExist(HRC_TITLE) {
            WinActivate, %HRC_TITLE%
            WinWaitActive, %HRC_TITLE%, , 5
            if ErrorLevel {
                MsgBox, ERROR: Could not activate HRC window.
                continue
            }

            MsgBox, STEP 1: Opening File sequence (Alt+F, N, S)
            Send, !f
            Sleep, 600
            Send, n
            Sleep, 600
            Send, s
            Sleep, 1500

            MsgBox, STEP 2: Inputting JSON file path
            SendRaw, %TargetFile%
            Send, {Enter}
            Sleep, 3000

            MsgBox, STEP 3: Pressing Next on Basic Hand Data (Alt+N)
            Send, !n
            Sleep, 1500

            MsgBox, STEP 4: Pressing Next on MTT Stacks (Alt+N)
            Send, !n
            Sleep, 2000 ; Wait for Betting Setup page

            MsgBox, STEP 5: Navigating to Scripting Tab (4 Tabs + 2 Right Arrows)
            Send, {Tab 4}
            Sleep, 500
            Send, {Right 2}
            Sleep, 800

            MsgBox, STEP 6: Navigating to Folder Icon (1 Tab) and Opening Dialog
            Send, {Tab 1}
            Sleep, 500
            Send, {Enter} ; Press the Folder Button
            Sleep, 1500

            MsgBox, STEP 7: Inputting JS script path
            SendRaw, %JS_FILE%
            Send, {Enter}
            Sleep, 2000

            MsgBox, STEP 8: Clicking Finish (Alt+F)
            Send, !f
            Sleep, 1000
            Send, {Enter}

            ; --- HRC builds the HAND SETUP (progress dialog, unknown duration) ---
            ; Auto-detect: wait for the "Hand Setup" progress dialog (the one with
            ; the "Run in Background" button) to appear, then wait for it to CLOSE.
            ; No click needed, so this works unattended in production.
            WinWait, Hand Setup, Run in Background, 30 ; progress dialog opens
            WinWaitClose, Hand Setup, Run in Background ; closes = setup done
            Sleep, 800
            WinActivate, %HRC_TITLE%
            Sleep, 300
            ; DEBUG only — delete this line for unattended prod:
            MsgBox, STEP 9: Hand setup finished (progress dialog closed).

            ; --- Nash calculation #1 ---
            MsgBox, STEP 10: Run Nash Calc (Alt+R), then OK
            Send, !r
            Sleep, 1000
            Send, {Enter} ; OK on the run confirmation dialog
            Sleep, 1500

            ; --- Auto-detect Nash calc #1 completion (progress popup like Hand Setup) ---
            WinWait, , Run in Background, 30 ; calc progress popup opens
            WinWaitClose, , Run in Background ; closes = calc #1 done
            Sleep, 800
            WinActivate, %HRC_TITLE%
            Sleep, 300
            ; DEBUG only — delete this line for unattended prod:
            MsgBox, STEP 11: Nash calc #1 finished (progress dialog closed).

            ; --- Nash calculation #2 (run again) ---
            MsgBox, STEP 12: Run Nash Calc again (Alt+R), then OK
            Send, !r
            Sleep, 1000
            Send, {Enter} ; OK on the run confirmation dialog
            Sleep, 1500

            ; --- Auto-detect Nash calc #2 completion (progress popup like Hand Setup) ---
            WinWait, , Run in Background, 30 ; calc progress popup opens
            WinWaitClose, , Run in Background ; closes = calc #2 done
            Sleep, 800
            WinActivate, %HRC_TITLE%
            Sleep, 300
            ; DEBUG only — delete this line for unattended prod:
            MsgBox, STEP 13: Nash calc #2 finished (progress dialog closed).

            ; MOVE TO PROCESSED
            PROCESSED_DIR := INPUT_DIR . "\processed"
            if !FileExist(PROCESSED_DIR)
                FileCreateDir, %PROCESSED_DIR%
            FileMove, %TargetFile%, %PROCESSED_DIR%

            MsgBox, HAND PROCESSED SUCCESSFULLY!
            Sleep, 5000
        }
    }
    Sleep, %LOOP_DELAY%
}

^Esc::ExitApp
