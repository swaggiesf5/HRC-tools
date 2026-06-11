import json
import zipfile
import os
import random
import argparse

def load_team_payouts(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data['structures'][0]['prizes']

def generate_hand_config(title, stacks, blinds, prizes, script_content=None):
    """
    Generates settings.json matching the Hand 1.hrcz sample exactly.
    """
    # The crucial missing piece for mtticm: 'otherstacks'. 
    # Without this, the ICM math engine throws IllegalArgumentException.
    # We provide a generic distribution of other stacks to make the math work.
    default_otherstacks = [
        70552.43, 62334.05, 57768.11, 54632.66, 52258.60, 50355.69, 48772.21, 47419.07,
        46239.60, 45195.58, 44260.04, 43413.26, 42640.39, 41929.97, 41273.01, 40662.28,
        40091.93, 39557.12, 39053.85, 38578.72, 38128.86, 37701.82, 37295.46, 36907.95,
        36537.68, 36183.23, 35843.35, 35516.93, 35202.99, 34900.64, 34609.08, 34327.59,
        34055.53, 33792.30, 33537.38, 33290.26, 33050.51, 32817.71, 32591.48, 32371.47,
        32157.37, 31948.87, 31745.70, 31547.60, 31354.33, 31165.68, 30981.42, 30801.38,
        30625.36, 30453.19, 30284.72, 30119.80, 29958.28, 29800.03, 29644.93, 29492.85,
        29343.68, 29197.33, 29053.68, 28912.64, 28774.12, 28638.04, 28504.31, 28372.86
    ]

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
            "otherstacks": default_otherstacks,
            "id": "mtticm",
            "structure": {
                "name": title,
                "chips": sum(stacks) + sum(default_otherstacks),
                "prizes": prizes
            }
        },
        "treeconfig": {
            "mode": "scripted" if script_content else "ui"
        },
        "engine": {
            "type": "montecarlo",
            "maxactive": 4,
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
    else:
        # Fallback script to ensure it doesn't crash if set to scripted mode
        config["treeconfig"]["mode"] = "scripted"
        config["treeconfig"]["script"] = "function getSizingsOpening(ctx) { return []; }"
        
    return config

def package_hrcz(config, output_path):
    temp_json = "settings.json"
    with open(temp_json, "w") as f:
        json.dump(config, f, indent=2)
    with zipfile.ZipFile(output_path, "w") as z:
        z.write(temp_json)
    os.remove(temp_json)

def main():
    parser = argparse.ArgumentParser(description="HRC Hand Generator")
    parser.add_argument("--count", type=int, default=1)
    parser.add_argument("--outdir", type=str, default="output_hands")
    parser.add_argument("--script", type=str)
    parser.add_argument("--payouts", type=str)
    args = parser.parse_args()

    if not os.path.exists(args.outdir):
        os.makedirs(args.outdir)

    script_content = None
    if args.script and os.path.exists(args.script):
        with open(args.script, 'r') as f:
            script_content = f.read()

    prizes = {
        "1": 1420.0, "2": 940.0, "3": 675.0, "4": 485.0, "5": 360.0
    }
    if args.payouts and os.path.exists(args.payouts):
        prizes = load_team_payouts(args.payouts)

    blind_levels = [(30000, 60000, 7500)]

    for i in range(args.count):
        num_players = 8 
        sb, bb, ante = random.choice(blind_levels)
        stacks = [random.randint(500000, 5000000) for _ in range(num_players)]
        blinds = {"sb": sb, "bb": bb, "ante": ante}
        
        config = generate_hand_config(f"Hand {i+1}", stacks, blinds, prizes, script_content)
        
        output_path = os.path.join(args.outdir, f"hand_{i+1}.hrcz")
        package_hrcz(config, output_path)
        print(f"Generated {output_path}")

if __name__ == "__main__":
    main()
