import json
import zipfile
import os
import random
import argparse
from datetime import datetime

def load_team_payouts(file_path):
    """Loads payout structures from the team's JSON format."""
    with open(file_path, 'r') as f:
        data = json.load(f)
    prizes = data['structures'][0]['prizes']
    return [prizes[str(i)] for i in range(1, len(prizes) + 1)]

def generate_hand_config(title, stacks, blinds, payouts, script_content=None, model="ICM"):
    """
    Generates a modern HRC settings.json dictionary (Version 2.0+ compatible).
    """
    # Modern HRC uses a simple list for stacks in some versions, 
    # and a detailed players list in others. We'll use the common modern format.
    
    config = {
        "version": "2.0",
        "handdata": {
            "title": title,
            "date": datetime.utcnow().isoformat() + "Z",
            "stacks": stacks,
            "blinds": [blinds["bb"], blinds["sb"], blinds["ante"]],
            "anteType": "REGULAR",
            "movingBu": True,
            "skipSb": False
        },
        "eqmodel": {
            "id": model.lower() if model.lower() != "icm" else "icm_malmuth_harville",
            "payouts": payouts
        },
        "treeconfig": {
            "mode": "scripted" if script_content else "ui",
            "maxActivePlayers": len(stacks),
            "preflop": {
                "id": "preflop.settings.general",
                "settings": {
                    "SIZES_OPEN_OTHERS": "2.5bb",
                    "SIZES_3BET_IP": "3.0x",
                    "ALLOW_COLD_CALLS": True
                }
            },
            "postflop": {
                "id": "postflop.settings.simple",
                "settings": {
                    "POSTFLOP_MAX_BETS_PER_STREET": [2, 1]
                }
            }
        },
        "engine": {
            "type": "montecarlo",
            "maxactive": len(stacks)
        }
    }
    
    if script_content:
        config["treeconfig"]["script"] = script_content
        
    return config

def package_hrcz(config, output_path):
    """
    Writes the config to settings.json and zips it into an .hrcz file.
    """
    temp_json = "settings.json"
    with open(temp_json, "w") as f:
        json.dump(config, f, indent=2)
    
    with zipfile.ZipFile(output_path, "w") as z:
        z.write(temp_json)
    
    os.remove(temp_json)

def main():
    parser = argparse.ArgumentParser(description="HRC Hand Generator (Modern Schema)")
    parser.add_argument("--count", type=int, default=1, help="Number of hands to generate")
    parser.add_argument("--outdir", type=str, default="output_hands", help="Output directory")
    parser.add_argument("--script", type=str, help="Path to the team JS script")
    parser.add_argument("--payouts", type=str, help="Path to the team payout JSON")
    args = parser.parse_args()

    if not os.path.exists(args.outdir):
        os.makedirs(args.outdir)

    script_content = None
    if args.script and os.path.exists(args.script):
        with open(args.script, 'r') as f:
            script_content = f.read()

    # Default payouts (Normalizing to 0.0 - 1.0 format which modern HRC often prefers)
    payout_values = [0.50, 0.30, 0.20]
    if args.payouts and os.path.exists(args.payouts):
        raw_payouts = load_team_payouts(args.payouts)
        # Normalize if they are whole numbers (e.g., 50, 30, 20 -> 0.5, 0.3, 0.2)
        total = sum(raw_payouts)
        payout_values = [p / total for p in raw_payouts]

    blind_levels = [
        (100, 200, 25), (200, 400, 50), (400, 800, 100), (1000, 2000, 250)
    ]

    for i in range(args.count):
        num_players = 8 
        sb, bb, ante = random.choice(blind_levels)
        
        stack_options = list(range(10 * bb, 100 * bb, 100))
        stacks = random.sample(stack_options, num_players)
        
        blinds = {"sb": sb, "bb": bb, "ante": ante}
        config = generate_hand_config(f"Hand {i+1}", stacks, blinds, payout_values, script_content=script_content)
        
        filename = f"hand_{i+1}.hrcz"
        output_path = os.path.join(args.outdir, filename)
        package_hrcz(config, output_path)
        print(f"Generated {output_path}")

if __name__ == "__main__":
    main()
