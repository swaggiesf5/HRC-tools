import json
import os
import random
import argparse

def load_team_structure(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    structure = data['structures'][0]
    return {
        "name": structure.get("name", "Custom Structure"),
        "chips": structure.get("chips", 15000000.0),
        "prizes": structure.get("prizes", {})
    }

def generate_hand_config(title, stacks, blinds, structure_data):
    """
    Generates a standard JSON hand config file for HRC.
    """
    total_chips_in_play = structure_data["chips"]
    chips_at_table = sum(stacks)
    
    # We distribute the remaining chips into 'otherstacks' so the math engine works
    remaining_chips = max(0, total_chips_in_play - chips_at_table)
    
    # Create a generic distribution for otherstacks (e.g. 50 players left)
    num_other_players = 50
    otherstacks = []
    if remaining_chips > 0:
        base_stack = remaining_chips / num_other_players
        # Just create an array of average stacks for simplicity
        otherstacks = [base_stack for _ in range(num_other_players)]

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
            "otherstacks": otherstacks,
            "id": "mtticm",
            "structure": {
                "name": structure_data["name"],
                "chips": total_chips_in_play,
                "prizes": structure_data["prizes"]
            }
        },
        "treeconfig": {
            "mode": "ui",
            "preflop": {
                "id": "preflop.settings.general",
                "settings": {
                    "ALLOWED_FLATS_PER_RAISE": [0, 1, 1, 0, 0],
                    "ALLOW_COLD_CALLS": True,
                    "ALLOW_FLATS_CLOSING_ACTION": True,
                    "ALLOW_SB_COMPLETE": False,
                    "PREFLOP_ADD_ALLIN_SPR": 7.0,
                    "PREFLOP_ALLIN_THRESHOLD": 40.0,
                    "SIZES_3BET_BB_VS_OTHER": "3.7x",
                    "SIZES_3BET_BB_VS_SB": "3.5x",
                    "SIZES_3BET_IP": "3.3x",
                    "SIZES_3BET_OOP": "4.2x",
                    "SIZES_3BET_SB_VS_BB": "4.0x",
                    "SIZES_3BET_SB_VS_OTHER": "4.0x",
                    "SIZES_4BET_IP": "2.3x",
                    "SIZES_4BET_OOP": "2.6x",
                    "SIZES_5BET_IP": "all-in",
                    "SIZES_5BET_OOP": "all-in",
                    "SIZES_OPEN_BB": "2.5bb",
                    "SIZES_OPEN_BB_VS_SB": "2.5bb",
                    "SIZES_OPEN_BU": "2.5bb",
                    "SIZES_OPEN_OTHERS": "2.5bb",
                    "SIZES_OPEN_SB": "3.0bb"
                }
            },
            "postflop": {
                "id": "postflop.settings.simple",
                "settings": {
                    "POSTFLOP_ADD_ALLIN_SPR": [3.0, 3.0],
                    "POSTFLOP_ALLOW_DONK": [False, False],
                    "POSTFLOP_GEO": [[60.0], [60.0]],
                    "POSTFLOP_MAX_BETS_PER_STREET": [2, 1]
                }
            }
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
        
    return config

def write_json(config, output_path):
    with open(output_path, "w") as f:
        json.dump(config, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description="HRC JSON Hand Config Generator")
    parser.add_argument("--count", type=int, default=1)
    parser.add_argument("--outdir", type=str, default="output_hands")
    parser.add_argument("--payouts", type=str, help="Path to the team payout JSON")
    args = parser.parse_args()

    if not os.path.exists(args.outdir):
        os.makedirs(args.outdir)

    # Default structure
    structure_data = {
        "name": "Default 15M",
        "chips": 15000000.0,
        "prizes": {
            "1": 1420.0, "2": 940.0, "3": 675.0, "4": 485.0, "5": 360.0
        }
    }
    
    if args.payouts and os.path.exists(args.payouts):
        structure_data = load_team_structure(args.payouts)

    blind_levels = [(30000, 60000, 7500)]

    for i in range(args.count):
        num_players = 8 
        sb, bb, ante = random.choice(blind_levels)
        stacks = [random.randint(500000, 2000000) for _ in range(num_players)]
        blinds = {"sb": sb, "bb": bb, "ante": ante}
        
        config = generate_hand_config(f"Hand {i+1}", stacks, blinds, structure_data)
        
        # Save as plain JSON config
        output_path = os.path.join(args.outdir, f"hand_{i+1}.json")
        write_json(config, output_path)
        print(f"Generated {output_path}")

if __name__ == "__main__":
    main()
