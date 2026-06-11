import json
import zipfile
import os
import random
import argparse
from datetime import datetime, timezone

def load_team_payouts(file_path):
    """Loads payout structures from the team's JSON format."""
    with open(file_path, 'r') as f:
        data = json.load(f)
    # The team format has a 'prizes' dict inside 'structures'
    prizes = data['structures'][0]['prizes']
    return prizes

def generate_hand_config(title, stacks, blinds, prizes, script_content=None):
    """
    Generates settings.json matching the Hand 1.hrcz sample.
    """
    config = {
        "handdata": {
            "stacks": [int(s) for s in stacks],
            "blinds": [int(blinds["bb"]), int(blinds["sb"]), int(blinds["ante"])],
            "skipSb": False,
            "movingBu": True,
            "anteType": "REGULAR",
            "straddleType": "OFF"
        },
        "eqmodel": {
            "id": "mtticm",
            "structure": {
                "name": title,
                "chips": sum(stacks) * 10, # Arbitrary large number or sum
                "prizes": prizes
            }
        },
        "treeconfig": {
            "mode": "scripted" if script_content else "ui"
        },
        "engine": {
            "type": "montecarlo",
            "maxactive": 4, # As seen in sample
            "configuration": {
                "abstractions": [
                    {"street": 0, "buckets": 169},
                    {"street": 1, "buckets": 1024, "id": "22804b04d3732210b3f28dbaee3a59fbe7ab7a573b679ee68c876760aba76b94"},
                    {"street": 2, "buckets": 256, "id": "661d702e82b930222bdd1e7cea3eef35f9306baaad628cec48713091b7e2e398"},
                    {"street": 3, "buckets": 256, "id": "41e796828302d1cb95d18663fc2e1eee65f2831c90b26339a814d285003785a1"}
                ]
            }
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
    parser = argparse.ArgumentParser(description="HRC Hand Generator (Exact Sample Match)")
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

    # Default prizes as seen in sample (mapping rank string to float)
    prizes = {
        "1": 1420.0, "2": 940.0, "3": 675.0, "4": 485.0, "5": 360.0
    }
    if args.payouts and os.path.exists(args.payouts):
        prizes = load_team_payouts(args.payouts)

    blind_levels = [
        (30000, 60000, 7500), (40000, 80000, 10000), (50000, 100000, 12500)
    ]

    for i in range(args.count):
        num_players = 8 
        sb, bb, ante = random.choice(blind_levels)
        
        # High stakes as seen in sample
        stacks = [random.randint(500000, 5000000) for _ in range(num_players)]
        
        blinds = {"sb": sb, "bb": bb, "ante": ante}
        config = generate_hand_config(f"Hand {i+1}", stacks, blinds, prizes, script_content=script_content)
        
        filename = f"hand_{i+1}.hrcz"
        output_path = os.path.join(args.outdir, filename)
        package_hrcz(config, output_path)
        print(f"Generated {output_path}")

if __name__ == "__main__":
    main()
