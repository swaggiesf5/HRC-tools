# HRC-tools: Distributed Simulation Orchestrator

## 📝 Project Reflection

### The Challenge
In high-stakes poker analysis, the bottleneck isn't just the calculation time—it's the **human UI interaction**. Manually setting up complex ICM and PKO scenarios in HoldemResources Calculator (HRC) for hundreds of hands is a repetitive, error-prone task that scales poorly.

### The Solution: "Decoupled Automation"
This project implements a hybrid automation strategy to scale simulations across **19 Virtual Machines**:

1.  **Logical Layer (Python)**: Instead of using the HRC UI to build hands, we use `src/hrc_generator.py` to programmatically generate JSON hand configuration files. Following advice from HRC Support, we utilize these plain JSON files to auto-populate the setup dialog, allowing us to vary payout structures and randomize stack depths with mathematical precision without manual data entry.
2.  **Execution Layer (AutoHotkey)**: To bridge the gap between our generated data and the HRC proprietary client, we use `hrc_automator.ahk`. This script acts as a "virtual user," watching for new JSON files and instantly feeding them into the calculation engine using the `File -> New Calculation -> From Saved File` sequence.

### Strategic Impact
By distributing this setup across 19 VMs, we transform a serial, manual process into a **massively parallel simulation fleet**. 
*   **Efficiency**: Reduces setup time from minutes per hand to milliseconds.
*   **Scalability**: Adding more VMs requires zero changes to the logic.
*   **Consistency**: Eliminates human error in stack size and payout entry.

---

## 🛠️ Architecture Overview

- **`src/hrc_generator.py`**: The "Brain." Generates the mathematical state of the hand (stacks, blinds, ICM payouts) and outputs standard `.json` configuration files that HRC natively understands.
- **`hrc_automator.ahk`**: The "Hands." Handles window focus, menu navigation, and file loading within the Windows environment. Uses partial title matching to lock onto "HRC" or "HRC Pro".
- **`output_hands/`**: The hot-folder used for communication between the Python logic and the AHK execution. Processed files are moved to `output_hands/processed/`.

## 🚀 Usage
1.  **Run the generator:** 
    ```bash
    # Generate a single hand with the default structure
    python src/hrc_generator.py --count 1
    
    # Generate multiple hands using a custom tournament payout structure
    python src/hrc_generator.py --count 10 --payouts "path/to/mtt_1500_payout.json"
    ```
2.  **Launch HRC** on the VM (ensure it is visible).
3.  **Run `hrc_automator.ahk`** (it runs silently in the background).
4.  Watch the simulations stack up as the script automatically clicks through the menus and loads the JSON files.
