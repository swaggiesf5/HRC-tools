# HoldemResources Calculator (HRC) Automation

## Objective
Automate hand simulations across 19 Virtual Machines to bypass manual UI setup.

## Strategy
1. **Python Generator**: Create a script to programmatically generate HRC-compatible JSON hand configuration files.
2. **UI Automation**: Use AutoHotkey (AHK) or a similar tool to automate the `File -> New Calculation -> From Saved File` sequence in the HRC client.

## Requirements
- Need a sample JSON hand config file from the HRC client to verify the schema.
- Parameters to vary: Stacks, Blinds, Payouts (ICM/PKO).

## Workflow
- Generator script runs -> produces `hand_N.json`.
- AHK script triggers -> loads `hand_N.json` into HRC and starts calculation.
