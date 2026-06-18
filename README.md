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

- **`src/hrc_generator.py`**: The "Brain." Programmatically generates mathematical hand configurations (stacks, blinds, field payouts) using configs from the team documents. Rounds all values to integers and exports standard `.json` files.
- **`hrc_automator.ahk`**: The "Hands." Automates loading calculations in the HRC Windows desktop client.
- **`output_hands/`**: Output folder where files are structured as `output_hands/{300p|1500p}/{spot_name}/hand_{N}.json`.

---

## 🚀 Usage

### 1. Run the Hand Generator
Run the generator using either the `300` or `1500` player configuration scenarios. 

```bash
# Generate 1 hand for all spots in the 1500 players scenario (default)
python src/hrc_generator.py --scenario 1500 --count 1

# Generate 3 hands for all spots in the 300 players scenario
python src/hrc_generator.py --scenario 300 --count 3

# Generate 5 hands only for specific tournament spots (e.g. 75pct, ft_9max)
python src/hrc_generator.py --scenario 1500 --count 5 --spots 75pct ft_9max
```

**Parameters:**
- `--scenario`: `"300"` or `"1500"` (selects the respective team tournament configuration).
- `--count`: Number of hands to randomly generate per spot (default: `1`).
- `--spots`: Space-separated list of spots to generate (e.g., `--spots 75pct stone_bubble ft_9max`). Generates all spots if omitted.
- `--outdir`: Root output directory (default: `"output_hands"`).

### 2. Run the HRC Automator
1.  Launch **HoldemResources Calculator** (ensure the window is visible).
2.  Run `hrc_automator.ahk` (double-click to run in the background).
3.  Load the generated hand configs via HRC's **File -> New Calculation -> From Saved File** menu. The setup, including blinds, clean integer BB stack counts, prize distributions, and scripting settings, will load automatically.
