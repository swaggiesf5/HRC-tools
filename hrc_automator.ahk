; HRC Automator Script
; This script automates loading .json files into HoldemResources Calculator

#NoEnv
SetWorkingDir %A_ScriptDir%
SendMode Input
SetTitleMatchMode, 2 ; Allows partial matching of window titles

; Configuration
HRC_TITLE := "HRC" ; Matches "HRC" or "HRC Pro"
INPUT_DIR := A_ScriptDir . "\output_hands"
LOOP_DELAY := 5000 ; Check for files every 5 seconds

Loop {
    FileCount := 0
    ; Find the first .json file in the input directory
    Loop, Files, %INPUT_DIR%\*.json
    {
        FileCount++
        TargetFile := A_LoopFileFullPath

        if WinExist(HRC_TITLE) {
            WinActivate, %HRC_TITLE%
            WinWaitActive, %HRC_TITLE%, , 5

            if ErrorLevel {
                ; Could not activate HRC window.
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

            Sleep, 5000 
        } else {
            ; Window not found, silently wait
        }
    }

    Sleep, %LOOP_DELAY%
}

^Esc::ExitApp
