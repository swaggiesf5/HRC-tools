; HRC Automator Script
; This script automates loading .json files into HoldemResources Calculator

#NoEnv
SetWorkingDir %A_ScriptDir%
SendMode Input

; Configuration
HRC_TITLE := "HoldemResources Calculator" ; Verify this matches the actual window title
INPUT_DIR := A_ScriptDir . "\output_hands"
LOOP_DELAY := 5000 ; Check for files every 5 seconds

MsgBox, AHK Script Started! Watching directory:`n%INPUT_DIR%

Loop {
    FileCount := 0
    ; Find the first .json file in the input directory
    Loop, Files, %INPUT_DIR%\*.json
    {
        FileCount++
        TargetFile := A_LoopFileFullPath

        MsgBox, Found file: %TargetFile%`nLooking for window: %HRC_TITLE%

        if WinExist(HRC_TITLE) {
            MsgBox, HRC Window Found! Attempting to activate...
            WinActivate, %HRC_TITLE%
            WinWaitActive, %HRC_TITLE%, , 5

            if ErrorLevel {
                MsgBox, Could not activate HRC window. Is it minimized or behind another window?
                continue
            }

            ; Sequence: File -> New Calculation -> From Saved File
            Send, !f
            Sleep, 500
            Send, n
            Sleep, 500
            Send, s
            Sleep, 1000 

            SendRaw, %TargetFile%
            Send, {Enter}
            Sleep, 2000 

            Send, {Enter}

            PROCESSED_DIR := INPUT_DIR . "\processed"
            if !FileExist(PROCESSED_DIR)
                FileCreateDir, %PROCESSED_DIR%

            FileMove, %TargetFile%, %PROCESSED_DIR%
            MsgBox, File processed and moved.

            Sleep, 5000 
        } else {
            MsgBox, ERROR: Could not find a window named "%HRC_TITLE%". Please check the exact name of the window.
        }
    }

    if (FileCount == 0) {
        ; Optional: Uncomment to see if it's checking empty folders
        ; MsgBox, No JSON files found in %INPUT_DIR%. Waiting...
    }

    Sleep, %LOOP_DELAY%
}

^Esc::ExitApp
