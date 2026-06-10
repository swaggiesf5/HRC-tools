# HRC-tools: Distributed Simulation Orchestrator

## 📝 Project Reflection

### The Challenge
In high-stakes poker analysis, the bottleneck isn't just the calculation time—it's the **human UI interaction**. Manually setting up complex ICM and PKO scenarios in HoldemResources Calculator (HRC) for hundreds of hands is a repetitive, error-prone task that scales poorly.

### The Solution: "Decoupled Automation"
This project implements a hybrid automation strategy to scale simulations across **19 Virtual Machines**:

1.  **Logical Layer (Python)**: Instead of using the HRC UI to build hands, we use `src/hrc_generator.py` to programmatically generate `.hrcz` files. This allows us to inject custom JS scripts, vary payout structures, and randomize stack depths with mathematical precision.
2.  **Execution Layer (AutoHotkey)**: To bridge the gap between our generated data and the HRC proprietary client, we use `hrc_automator.ahk`. This script acts as a "virtual user," watching for new hands and instantly feeding them into the calculation engine.

### Strategic Impact
By distributing this setup across 19 VMs, we transform a serial, manual process into a **massively parallel simulation fleet**. 
*   **Efficiency**: Reduces setup time from minutes per hand to milliseconds.
*   **Scalability**: Adding more VMs requires zero changes to the logic.
*   **Consistency**: Eliminates human error in stack size and payout entry.

---

## 🛠️ Architecture Overview

- **`src/hrc_generator.py`**: The "Brain." Generates the `settings.json` schema and packages it into the `.hrcz` zip format HRC expects.
- **`hrc_automator.ahk`**: The "Hands." Handles window focus, menu navigation, and file loading within the Windows environment.
- **`output_hands/`**: The hot-folder used for communication between the Python logic and the AHK execution.

## 🚀 Usage
1.  Run the generator: `python src/hrc_generator.py --count 10`
2.  Launch HRC on the VM.
3.  Run `hrc_automator.ahk`.
4.  Watch the simulations stack up.
