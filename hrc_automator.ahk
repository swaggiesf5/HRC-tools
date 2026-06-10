; HRC Automator Script
; This script automates loading .hrcz files into HoldemResources Calculator

#NoEnv
SetWorkingDir %A_ScriptDir%
SendMode Input

; Configuration
HRC_TITLE := "HoldemResources Calculator" ; Verify this matches the actual window title
INPUT_DIR := A_ScriptDir . "\output_hands"
LOOP_DELAY := 5000 ; Check for files every 5 seconds

Loop {
    ; Find the first .hrcz file in the input directory
    Loop, Files, %INPUT_DIR%\*.hrcz
    {
        TargetFile := A_LoopFileFullPath
        
        if WinExist(HRC_TITLE) {
            WinActivate, %HRC_TITLE%
            WinWaitActive, %HRC_TITLE%, , 5
            
            if ErrorLevel {
                MsgBox, Could not activate HRC window.
                continue
            }
            
            ; Sequence: File -> New Calculation -> From Saved File
            ; Standard HRC shortcuts might be: Alt+F, N, S
            ; We'll use Alt+F first
            Send, !f
            Sleep, 500
            
            ; Navigate to New Calculation (N)
            Send, n
            Sleep, 500
            
            ; Navigate to From Saved File (S)
            Send, s
            Sleep, 1000 ; Wait for file dialog
            
            ; Input the file path
            SendRaw, %TargetFile%
            Send, {Enter}
            Sleep, 2000 ; Wait for file to load
            
            ; Trigger Calculation (Verify the hotkey/button)
            ; Typically 'Run' or 'Calculate' might be Enter or a specific button
            Send, {Enter}
            
            ; Move the file to a 'processed' folder to avoid re-running
            PROCESSED_DIR := INPUT_DIR . "\processed"
            if !FileExist(PROCESSED_DIR)
                FileCreateDir, %PROCESSED_DIR%
            
            FileMove, %TargetFile%, %PROCESSED_DIR%
            
            Sleep, 5000 ; Give it time to start calculation before next hand
        } else {
            ; HRC not open, maybe log or wait
        }
    }
    
    Sleep, %LOOP_DELAY%
}

; Hotkey to stop the script
^Esc::ExitApp
