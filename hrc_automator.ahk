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

            ; 1. Open the File Menu sequence
            Send, !f
            Sleep, 500
            Send, n
            Sleep, 500
            Send, s
            Sleep, 1500 

            ; 2. Input the JSON file path
            SendRaw, %TargetFile%
            Send, {Enter}
            Sleep, 3000 ; Wait for "Hand Setup / MTT Stacks" page to load

            ; 3. Click 'Next' on MTT Stacks page
            ; Using Alt+N is the standard Windows shortcut for "Next"
            Send, !n 
            Sleep, 2000 ; Wait for "Betting Setup" page to load

            ; 4. Navigate to "Scripting"
            ; Note: If Alt+S doesn't work, we'll need to use {Tab} presses
            Send, !s 
            Sleep, 1000
            
            ; 5. Click "Load a tree building script"
            ; Note: If Alt+L doesn't work, we'll need to use {Tab} presses
            Send, !l 
            Sleep, 1500 ; Wait for file dialog

            ; 6. Input the JS script path
            JS_SCRIPT := "C:\Users\Swaggy\Documents\Deeprun\HRCScript\Data\low_icm_test.js"
            SendRaw, %JS_SCRIPT%
            Send, {Enter}
            Sleep, 2000

            ; 7. Finalize and Start Calculation (Usually 'Finish' is Alt+F or Enter)
            Send, !f
            Sleep, 500
            Send, {Enter}

            ; 8. Move the file to a 'processed' folder to avoid re-running
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
