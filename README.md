# HRC-tools: Automated Hand Configuration Generator for HoldemResources Calculator

## Table of Contents
- [Overview](#overview)
- [The Idea](#the-idea)
- [How the Script Works](#how-the-script-works)
- [How It Was Developed](#how-it-was-developed)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Usage Reference](#usage-reference)
- [Output Format](#output-format)
- [Tournament Spots](#tournament-spots)
- [Project Structure](#project-structure)
- [Unfinished Work](#unfinished-work)

---

## Overview

This project provides a **ready-to-use JavaScript script** that programmatically generates JSON hand configuration files for [HoldemResources Calculator (HRC)](https://www.holdemresources.net/). Instead of manually entering blinds, stacks, payouts, and bet-sizing settings through the HRC GUI for every hand, this script produces fully configured `.json` files that can be directly imported via **File → New Calculation → From Saved File**.

It supports two tournament scenarios:
- **300-player MTT** — 18 tournament spots (early game through 3-handed final table)
- **1500-player MTT** — 19 tournament spots (includes a 5% field spot)

Each generated hand has randomized stack depths, correct payout structures, and pre-configured bet-sizing script references — ready for HRC to calculate immediately.

---

## The Idea

### The Problem
Setting up a single HRC simulation manually involves entering:
1. Stack sizes for every player at the table
2. Blind and ante levels
3. The full payout structure for the tournament
4. Remaining-player stack distributions (for MTT ICM calculations)
5. Bet-sizing tree configurations

When you need to run **hundreds of these simulations** across different tournament stages — and distribute them across **19 Virtual Machines** — doing this by hand becomes impossibly slow and error-prone.

### The Solution
We bypassed the manual process entirely by generating the data **outside of HRC**. The script produces `.json` files that match HRC's internal format, so when you import them, everything is pre-filled: stacks, blinds, payouts, ICM model, bet-sizing scripts — all of it. No manual entry required.

This approach was developed after consulting with HRC Support, who confirmed that HRC can load hand configurations from plain `.json` files through the "From Saved File" import dialog.

### Why This Matters
- **Speed**: Generating 19 hands (one per spot) takes under 1 second. Manually entering the same data would take 30+ minutes.
- **Accuracy**: Stack values are guaranteed to be clean integer multiples of the Big Blind. Payout structures are loaded directly from our team configuration files. No typos, no missed fields.
- **Scalability**: Generating 100 random hands per spot is just `--count 100`. The script handles randomization, chip conservation, and mathematical constraints automatically.

---

## How the Script Works

### 1. Payout Structure Loading
The script reads payout structures from JSON files in the `Data/` directory (`mtt_300_players.json` or `mtt_1500_payout.json`). These files define the total chip count and the full prize distribution (e.g., 1st place gets $593.70, 2nd gets $399.00, etc.).

The raw prize map is **compressed** into HRC's range-start format. For example, if positions 10–12 all pay the same amount, only position 10 is stored with that value. The final position is always preserved — this is critical because HRC uses the last key in the prize map to determine **how many places are paid** (the bubble cutoff).

### 2. Stack Generation
For each hand, the script generates a realistic set of stack sizes:

- **Integer Big Blinds**: Each stack is drawn as a random integer number of Big Blinds within the configured range (e.g., 15–60 BB for early spots, 5–40 BB for final tables).
- **Chip Conservation**: For **final table spots** (where `remaining players = table size`), the stacks are mathematically adjusted so their sum equals the total tournament chips exactly. For **non-final-table spots**, the stacks are constrained so that enough chips remain for the other players in the tournament.
- **Clean Values**: All stacks are rounded to integer BB units, then multiplied by the Big Blind value — producing clean numbers like `1,920,000` or `720,000` instead of messy floats.

### 3. Other-Stack Distribution (MTT Field)
For non-final-table spots in MTT ICM mode, the remaining chips (total chips minus the active table's chips) are distributed across all other tournament participants using a **LogNormal distribution** as recommended by HRC Support:

$$X_i = e^{\sigma Z_i}$$

where $Z_i$ is generated using the Box-Muller transform to obtain standard normal random variables, and $\sigma$ is the shape parameter (defaulting to `0.6`, customizable in the `0.5`–`0.75` range). Stacks are sorted descending, clamped to a minimum of 1 chip, and adjusted dynamically to ensure the exact sum of all chips in play equals the total tournament chips.

### 4. Configuration Assembly
Each generated hand config contains four sections:

| Section | Purpose |
|---|---|
| `handdata` | Player stacks, blinds (BB/SB/ante), and table settings |
| `eqmodel` | ICM/ChipEV model selection, other-player stacks, and full payout structure |
| `treeconfig` | Bet-sizing tree mode (`scripted`) and path to the JavaScript tree script |
| `engine` | Solver engine settings (Monte Carlo with card abstraction buckets) |

The equity model is set to:
- **`mtticm`** (Multi-Table ICM) for non-final-table MTT spots
- **`malmuthharvil`** (Malmuth-Harville) for final-table MTT spots
- **`chipev`** (ChipEV) for ChipEV mode (payout structures and otherstacks are completely omitted)

The bet-sizing tree script is selected based on the spot's ICM pressure:
- `low_icm_test.js` for early/mid-tournament spots
- `high_icm_test.js` for spots with higher ICM pressure (near bubble, final tables)

### 5. File Output
Generated files are organized by mode and tournament size:
```
output_hands/
├── 300p/                      # MTT ICM hands (300 players)
│   ├── 75pct/
│   │   ├── hand_1.json
│   │   └── hand_2.json
│   └── ft_3max/
├── 300p_chipev/               # ChipEV hands (300 players scenario blinds)
│   ├── 75pct/
│   └── ...
└── 1500p/                     # MTT ICM hands (1500 players)
    └── ...
```

---

## How It Was Developed

### 1. Reverse Engineering HRC's Format
HRC stores its hand data in `.hrcz` files, which are zip-compressed JSON. By extracting and studying these files, we identified the exact JSON schema that HRC expects — including field names, value types, and how data like payout structures need to be formatted.

### 2. Decompiling HRC's Parser
To resolve specific edge cases (like why some prize structures loaded incorrectly, or why "Remaining Players" wasn't being set), we decompiled HRC's internal Java bytecode (`net.holdemresources.calculator` JAR). This revealed:
- **No `remainingPlayers` JSON key exists** — HRC calculates total players by summing `len(stacks) + len(otherstacks)`.
- **The last key in `prizes`** determines the bubble cutoff (places paid).
- **The `scriptfile` key** inside `treeconfig` must point to the bet-sizing script's absolute path for HRC to restore it automatically.

---

## Prerequisites

- **Node.js** (version 14 or higher)
- The `Data/` directory must contain:
  - `mtt_300_players.json` — 300-player payout structure
  - `mtt_1500_payout.json` — 1500-player payout structure
  - `low_icm_test.js` — Low ICM bet-sizing tree script
  - `high_icm_test.js` — High ICM bet-sizing tree script

---

## Quick Start

```bash
# Generate 1 hand for every spot in the 1500-player scenario (MTT ICM)
npm run generate -- --scenario 1500 --count 1

# Generate ChipEV hands instead
npm run generate -- --mode chipev --scenario 1500 --count 1

# Import into HRC:
# File → New Calculation → From Saved File → select any .json from output_hands/
```

That's it. The hand loads with stacks, blinds, payouts, and bet-sizing all pre-configured.

---

## Usage Reference

```bash
npm run generate -- [options]
```

| Option | Default | Description |
|---|---|---|
| `--scenario` | `1500` | Tournament scenario stage constraints: `"300"` or `"1500"` |
| `--count` | `1` | Number of random hands to generate per spot |
| `--spots` | all | Space-separated spot names to generate (e.g., `--spots 75pct ft_9max`) |
| `--outdir` | `output_hands` | Root output directory |
| `--mode` | `icm` | Calculations mode: `"icm"` (MTT ICM) or `"chipev"` (Chip EV) |
| `--shape` | `0.6` | Shape parameter ($\sigma$) for LogNormal otherstacks generation (usually `0.5`–`0.75`) |
| `--help` | — | Show help message |

### Examples

```bash
# All 19 spots, 1 hand each (1500-player tournament, MTT ICM)
npm run generate -- --scenario 1500 --count 1

# All 18 spots, 3 hands each (300-player tournament, ChipEV mode)
npm run generate -- --mode chipev --scenario 300 --count 3

# Only specific spots, 5 hands each, using shape 0.65 for otherstacks
npm run generate -- --scenario 1500 --count 5 --spots 75pct stone_bubble --shape 0.65
```

---

## Output Format

Each generated `.json` file looks like this (simplified):

```json
{
  "handdata": {
    "stacks": [1920000, 720000, 2040000, 2700000, 3900000, 2580000, 1380000, 1270000],
    "blinds": [60000, 30000, 7500],
    "skipSb": false,
    "movingBu": false,
    "anteType": "REGULAR",
    "straddleType": "OFF"
  },
  "eqmodel": {
    "otherstacks": [309756, 281596, 258130, "... (1117 other players)"],
    "id": "mtticm",
    "structure": {
      "name": "Deeprun1500",
      "chips": 15000000,
      "prizes": {"1": 594, "2": 399, "...": "..."}
    }
  },
  "treeconfig": {
    "mode": "scripted",
    "scriptfile": "C:/path/to/Data/low_icm_test.js"
  },
  "engine": {
    "type": "montecarlo",
    "maxactive": 4,
    "configuration": { "abstractions": ["..."] }
  }
}
```

All stack values are **clean integers** — no floats, no decimals.

---

## Tournament Spots

### 300-Player Scenario (18 spots)

| Spot | Blinds (SB/BB) | Ante | Table Size | Remaining | ICM Script | Equity Model |
|---|---|---|---|---|---|---|
| 75pct | 30K/60K | 7.5K | 8 | 225 | low_icm | Multi-Table ICM |
| 50pct | 50K/100K | 12.5K | 8 | 150 | low_icm | Multi-Table ICM |
| 25pct | 100K/200K | 25K | 8 | 75 | low_icm | Multi-Table ICM |
| 18pct | 150K/300K | 35K | 8 | 54 | high_icm | Multi-Table ICM |
| stone_bubble | 175K/350K | 45K | 8 | 46 | high_icm | Multi-Table ICM |
| 10pct | 250K/500K | 60K | 8 | 30 | low_icm | Multi-Table ICM |
| final_3_table | 500K/1M | 125K | 8 | 24 | high_icm | Multi-Table ICM |
| final_2_table_8max | 1M/2M | 250K | 8 | 16 | high_icm | Multi-Table ICM |
| final_2_table_7max | 1M/2M | 250K | 7 | 14 | high_icm | Multi-Table ICM |
| final_2_table_6max | 1M/2M | 250K | 6 | 12 | high_icm | Multi-Table ICM |
| final_2_table_5max | 1M/2M | 250K | 5 | 10 | high_icm | Multi-Table ICM |
| ft_9max → ft_3max | 1.5M/3M | 350K | 9→3 | 9→3 | high_icm | Malmuth-Harville |

### 1500-Player Scenario (19 spots)

| Spot | Blinds (SB/BB) | Ante | Table Size | Remaining | ICM Script | Equity Model |
|---|---|---|---|---|---|---|
| 75pct | 30K/60K | 7.5K | 8 | 1125 | low_icm | Multi-Table ICM |
| 50pct | 50K/100K | 12.5K | 8 | 750 | low_icm | Multi-Table ICM |
| 25pct | 100K/200K | 25K | 8 | 375 | low_icm | Multi-Table ICM |
| 18pct | 150K/300K | 35K | 8 | 270 | high_icm | Multi-Table ICM |
| stone_bubble | 175K/350K | 45K | 8 | 226 | high_icm | Multi-Table ICM |
| 10pct | 300K/600K | 75K | 8 | 150 | low_icm | Multi-Table ICM |
| 5pct | 500K/1M | 125K | 8 | 75 | low_icm | Multi-Table ICM |
| final_3_table | 1M/2M | 250K | 8 | 24 | high_icm | Multi-Table ICM |
| final_2_table_8max | 1.5M/3M | 350K | 8 | 16 | high_icm | Multi-Table ICM |
| final_2_table_7max | 1.5M/3M | 350K | 7 | 14 | high_icm | Multi-Table ICM |
| final_2_table_6max | 1.5M/3M | 350K | 6 | 12 | high_icm | Multi-Table ICM |
| final_2_table_5max | 1.5M/3M | 350K | 5 | 10 | high_icm | Multi-Table ICM |
| ft_9max → ft_3max | 5M/10M | 1.25M | 9→3 | 9→3 | high_icm | Malmuth-Harville |

---

## Project Structure

```
HRCScript/
├── package.json              # Node.js project config (npm run generate)
├── src/
│   └── hrc_generator.js      # Main generator script (zero dependencies)
├── Data/
│   ├── mtt_300_players.json   # 300-player payout structure
│   ├── mtt_1500_payout.json   # 1500-player payout structure
│   ├── low_icm_test.js        # Low ICM bet-sizing tree script
│   └── high_icm_test.js       # High ICM bet-sizing tree script
├── output_hands/              # Generated hand configs (gitignored)
├── hrc_automator.ahk          # AutoHotkey UI automation (⚠️ unfinished)
└── README.md
```

---

## Unfinished Work

### AutoHotkey UI Automation (`hrc_automator.ahk`) — ⚠️ In Progress

The AutoHotkey script (`hrc_automator.ahk`) is designed to automate the last-mile interaction with HRC's desktop GUI — clicking through the **File → New Calculation → From Saved File** dialog, selecting the generated `.json` files, and triggering the calculation. The goal is to enable fully unattended batch processing across 19 Virtual Machines.

**Current status:**
- Basic window detection and menu navigation are implemented.
- **Not yet reliable**: The script does not consistently handle HRC's popups, focus changes, and the "Remaining Players" input field across all edge cases.
- **The "Remaining Players" field** still requires manual input in some cases, because HRC's JSON format does not support a `remainingPlayers` key — the value is derived from `len(stacks) + len(otherstacks)`, which our generator already handles correctly, but the MTT setup dialog may still prompt for confirmation.

**What remains:**
1. Robust popup and dialog detection (handling the "built with a script" warning, focus loss, etc.)
2. End-to-end testing across the full VM cluster.
3. Automatic triggering of calculations after file import without manual confirmation.
