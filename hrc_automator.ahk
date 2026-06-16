; HRC Automator Script (Debug Version - Precision Navigation)
; Using user-provided Tab/Arrow sequence for Step 5 & 6

#NoEnv
SetWorkingDir %A_ScriptDir%
SendMode Input
SetTitleMatchMode, 2

; Configuration
HRC_TITLE := "HRC" 
INPUT_DIR := "C:\Users\Swaggy\Documents\Deeprun\HRCScript\output_hands"
JS_FILE := "C:\Users\Swaggy\Documents\Deeprun\HRCScript\Data\low_icm_test.js"
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
