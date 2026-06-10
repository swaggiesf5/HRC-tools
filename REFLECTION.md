# Project Reflection: HRC Automation & Workflow

### 1. What I Did (Actions Taken)
Since June 1st, I have transitioned the HRC simulation process from a manual task to a structured automation pipeline. My key actions included:
*   **Reverse Engineering HRC Files**: I identified that `.hrcz` files are zip-compressed JSON objects. This discovery allowed me to bypass the HRC interface for hand creation.
*   **Python Development**: I wrote `src/hrc_generator.py` to programmatically generate these hand configurations, supporting custom stack sizes, blinds, and payout structures.
*   **UI Automation**: I developed an AutoHotkey (AHK) script to handle the file-loading sequence, aiming to reduce human interaction across 19 Virtual Machines.
*   **Environment Standardization**: I set up a version-controlled repository with specific commit conventions (`feat`, `docs`, `fix`) to ensure the team can track progress clearly.

### 2. What I Learned (Technical & Process Insights)
*   **UI Automation Fragility**: I learned that while AHK is powerful, automating complex software like HRC requires handling many edge cases (popups, focus issues). This has shifted my focus toward making the automation more robust and "aware" of the application state.
*   **The Power of Programmatic Generation**: I learned that generating data outside of a proprietary UI is significantly faster and more reliable than trying to click through menus to set up scenarios.
*   **Documentation as a Deliverable**: I’ve realized that documentation isn't just an "extra" task—it is a core part of the engineering job. Proper documentation ensures that the work I do on these 19 VMs is transparent, reproducible, and professional.

### 3. Current Status & Next Steps
The automation logic is currently being refined to handle the HRC menu complexity more reliably. My goal is to finish the "perfect" loop for the AHK script so the fleet of 19 VMs can run autonomously without further delays.
