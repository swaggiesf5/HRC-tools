import json
import os
import random
import argparse
import math

# ---------------------------------------------------------------------------
# Payout structure loader
# ---------------------------------------------------------------------------

def load_team_structure(file_path):
    """Load payout structure from HRC JSON file in Data/ directory."""
    with open(file_path, 'r') as f:
        data = json.load(f)
    structure = data['structures'][0]
    raw_prizes = structure.get("prizes", {})
    compressed = compress_prizes(raw_prizes)
    return {
        "name": structure.get("name", "Custom Structure"),
        "chips": int(round(float(structure.get("chips", 15000000.0)))),
        "prizes": compressed
    }


def compress_prizes(prizes):
    """
    Compress a full prize map into HRC's range-start format.

    HRC exports prizes with only the first position of each payout tier,
    e.g. {"10": 100.0, "13": 80.0} means positions 10-12 pay 100, 13+ pay 80.
    This function converts an expanded map (every position listed) into
    that compressed form, ensuring the final position is always preserved.
    """
    if not prizes:
        return {}

    # Sort by position number
    sorted_positions = sorted(prizes.items(), key=lambda x: int(x[0]))

    compressed = {}
    prev_value = None
    last_idx = len(sorted_positions) - 1

    for idx, (pos_str, value) in enumerate(sorted_positions):
        ival = int(round(float(value)))
        if ival != prev_value or idx == last_idx:
            compressed[pos_str] = ival
            prev_value = ival

    return compressed


# ---------------------------------------------------------------------------
# Spot definitions — derived directly from the team config documents
# ---------------------------------------------------------------------------

# Each spot has:
#   name            — folder-friendly label
#   sb, bb, ante    — blind structure
#   avg_bb_min/max  — stack generation range (in BB)
#   remaining       — total remaining players in the tournament at this spot
#   table_size      — players at the table for this spot
#   script          — which betting script to reference ("low_icm" or "high_icm")
#   is_final_table  — whether to use Malmuth-Harville equity model

SPOTS_300 = [
    {
        "name": "75pct",
        "sb": 30000, "bb": 60000, "ante": 7500,
        "avg_bb_min": 15, "avg_bb_max": 60,
        "remaining": 225, "table_size": 8,
        "script": "low_icm", "is_final_table": False,
    },
    {
        "name": "50pct",
        "sb": 50000, "bb": 100000, "ante": 12500,
        "avg_bb_min": 10, "avg_bb_max": 50,
        "remaining": 150, "table_size": 8,
        "script": "low_icm", "is_final_table": False,
    },
    {
        "name": "25pct",
        "sb": 100000, "bb": 200000, "ante": 25000,
        "avg_bb_min": 10, "avg_bb_max": 50,
        "remaining": 75, "table_size": 8,
        "script": "low_icm", "is_final_table": False,
    },
    {
        "name": "18pct",
        "sb": 150000, "bb": 300000, "ante": 35000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 54, "table_size": 8,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "stone_bubble",
        "sb": 175000, "bb": 350000, "ante": 45000,
        "avg_bb_min": 10, "avg_bb_max": 45,
        "remaining": 46, "table_size": 8,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "10pct",
        "sb": 250000, "bb": 500000, "ante": 60000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 30, "table_size": 8,
        "script": "low_icm", "is_final_table": False,
    },
    {
        "name": "final_3_table",
        "sb": 500000, "bb": 1000000, "ante": 125000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 24, "table_size": 8,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "final_2_table_8max",
        "sb": 1000000, "bb": 2000000, "ante": 250000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 16, "table_size": 8,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "final_2_table_7max",
        "sb": 1000000, "bb": 2000000, "ante": 250000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 14, "table_size": 7,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "final_2_table_6max",
        "sb": 1000000, "bb": 2000000, "ante": 250000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 12, "table_size": 6,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "final_2_table_5max",
        "sb": 1000000, "bb": 2000000, "ante": 250000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 10, "table_size": 5,
        "script": "high_icm", "is_final_table": False,
    },
    # --- Final Table spots (Malmuth-Harville ICM) ---
    {
        "name": "ft_9max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 9, "table_size": 9,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_8max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 8, "table_size": 8,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_7max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 7, "table_size": 7,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_6max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 6, "table_size": 6,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_5max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 5, "avg_bb_max": 40,
        "remaining": 5, "table_size": 5,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_4max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 5, "avg_bb_max": 40,
        "remaining": 4, "table_size": 4,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_3max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 5, "avg_bb_max": 40,
        "remaining": 3, "table_size": 3,
        "script": "high_icm", "is_final_table": True,
    },
]

SPOTS_1500 = [
    {
        "name": "75pct",
        "sb": 30000, "bb": 60000, "ante": 7500,
        "avg_bb_min": 15, "avg_bb_max": 60,
        "remaining": 1125, "table_size": 8,
        "script": "low_icm", "is_final_table": False,
    },
    {
        "name": "50pct",
        "sb": 50000, "bb": 100000, "ante": 12500,
        "avg_bb_min": 10, "avg_bb_max": 50,
        "remaining": 750, "table_size": 8,
        "script": "low_icm", "is_final_table": False,
    },
    {
        "name": "25pct",
        "sb": 100000, "bb": 200000, "ante": 25000,
        "avg_bb_min": 10, "avg_bb_max": 50,
        "remaining": 375, "table_size": 8,
        "script": "low_icm", "is_final_table": False,
    },
    {
        "name": "18pct",
        "sb": 150000, "bb": 300000, "ante": 35000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 270, "table_size": 8,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "stone_bubble",
        "sb": 175000, "bb": 350000, "ante": 45000,
        "avg_bb_min": 10, "avg_bb_max": 45,
        "remaining": 226, "table_size": 8,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "10pct",
        "sb": 300000, "bb": 600000, "ante": 75000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 150, "table_size": 8,
        "script": "low_icm", "is_final_table": False,
    },
    {
        "name": "5pct",
        "sb": 500000, "bb": 1000000, "ante": 125000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 75, "table_size": 8,
        "script": "low_icm", "is_final_table": False,
    },
    {
        "name": "final_3_table",
        "sb": 1000000, "bb": 2000000, "ante": 250000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 24, "table_size": 8,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "final_2_table_8max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 16, "table_size": 8,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "final_2_table_7max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 14, "table_size": 7,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "final_2_table_6max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 12, "table_size": 6,
        "script": "high_icm", "is_final_table": False,
    },
    {
        "name": "final_2_table_5max",
        "sb": 1500000, "bb": 3000000, "ante": 350000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 10, "table_size": 5,
        "script": "high_icm", "is_final_table": False,
    },
    # --- Final Table spots (Malmuth-Harville ICM) ---
    {
        "name": "ft_9max",
        "sb": 5000000, "bb": 10000000, "ante": 1250000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 9, "table_size": 9,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_8max",
        "sb": 5000000, "bb": 10000000, "ante": 1250000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 8, "table_size": 8,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_7max",
        "sb": 5000000, "bb": 10000000, "ante": 1250000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 7, "table_size": 7,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_6max",
        "sb": 5000000, "bb": 10000000, "ante": 1250000,
        "avg_bb_min": 8, "avg_bb_max": 45,
        "remaining": 6, "table_size": 6,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_5max",
        "sb": 5000000, "bb": 10000000, "ante": 1250000,
        "avg_bb_min": 5, "avg_bb_max": 40,
        "remaining": 5, "table_size": 5,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_4max",
        "sb": 5000000, "bb": 10000000, "ante": 1250000,
        "avg_bb_min": 5, "avg_bb_max": 40,
        "remaining": 4, "table_size": 4,
        "script": "high_icm", "is_final_table": True,
    },
    {
        "name": "ft_3max",
        "sb": 5000000, "bb": 10000000, "ante": 1250000,
        "avg_bb_min": 5, "avg_bb_max": 40,
        "remaining": 3, "table_size": 3,
        "script": "high_icm", "is_final_table": True,
    },
]


# ---------------------------------------------------------------------------
# Stack generation — stacks stay strictly within the defined BB range
# ---------------------------------------------------------------------------

def generate_stacks(table_size, bb, avg_bb_min, avg_bb_max, total_chips, remaining_players):
    """
    Generate stack distributions for a table.

    Each stack is drawn as an integer Big Blind from [avg_bb_min, avg_bb_max]
    and converted to chips. Stacks are mathematically adjusted and rounded
    to integer BBs to ensure they are clean multiples of BB (like the example)
    and strictly respect tournament limits.
    """
    bb_unscaled = bb / 100.0
    num_others = max(0, remaining_players - table_size)
    
    # 1. First generate random raw BB stacks as floats representing integer BBs in [avg_bb_min, avg_bb_max]
    bb_stacks = [float(random.randint(avg_bb_min, avg_bb_max)) for _ in range(table_size)]
    
    # 2. Check if the sum of table stacks + minimum other stacks exceeds total_chips
    min_other_bb = avg_bb_min
    total_bb = total_chips / bb_unscaled
    min_other_bb_total = num_others * min_other_bb
    max_table_bb = total_bb - min_other_bb_total
    
    if max_table_bb < table_size * avg_bb_min:
        max_table_bb = table_size * avg_bb_min
        
    sum_bb_stacks = sum(bb_stacks)
    
    if num_others == 0:
        # Final table: stacks must sum to total_bb exactly.
        if sum_bb_stacks != total_bb:
            excess_allowed = total_bb - (table_size * avg_bb_min)
            excess_generated = sum_bb_stacks - (table_size * avg_bb_min)
            if excess_generated > 0 and excess_allowed >= 0:
                factor = excess_allowed / excess_generated
                bb_stacks = [avg_bb_min + (s - avg_bb_min) * factor for s in bb_stacks]
            else:
                bb_stacks = [total_bb / table_size] * table_size
    else:
        # Non-final table: scale down only if sum exceeds max_table_bb
        if sum_bb_stacks > max_table_bb:
            excess_allowed = max_table_bb - (table_size * avg_bb_min)
            excess_generated = sum_bb_stacks - (table_size * avg_bb_min)
            if excess_generated > 0 and excess_allowed >= 0:
                factor = excess_allowed / excess_generated
                bb_stacks = [avg_bb_min + (s - avg_bb_min) * factor for s in bb_stacks]
            else:
                bb_stacks = [avg_bb_min] * table_size
                
    # Round BB stacks to integer BB units to guarantee clean, round stack chip counts
    bb_stacks = [int(round(s)) for s in bb_stacks]
    
    # Ensure they are within range [avg_bb_min, avg_bb_max] (unless mathematically forced by total_bb)
    if num_others > 0:
        bb_stacks = [max(avg_bb_min, min(avg_bb_max, s)) for s in bb_stacks]
        target_max = int(max_table_bb)
        while sum(bb_stacks) > target_max:
            candidates = [i for i, s in enumerate(bb_stacks) if s > avg_bb_min]
            if not candidates:
                break
            idx = max(candidates, key=lambda i: bb_stacks[i])
            bb_stacks[idx] -= 1
    else:
        bb_stacks = [max(avg_bb_min, s) for s in bb_stacks]
        current_sum = sum(bb_stacks)
        target_sum = int(round(total_bb))
        diff = target_sum - current_sum
        if diff != 0:
            idx = bb_stacks.index(max(bb_stacks))
            bb_stacks[idx] = max(avg_bb_min, bb_stacks[idx] + diff)
            
    # Convert BB stacks to final scaled chips (rounded to ints)
    stacks = [int(s * bb) for s in bb_stacks]
    return stacks


def generate_otherstacks(table_stacks, total_chips, remaining_players, table_size):
    """
    Distribute chips NOT at the table across the other remaining players
    using a descending harmonic distribution.

    HRC expects otherstacks sorted from largest to smallest, following a
    smooth curve. Table stacks (scaled) are converted to unscaled tournament
    units before subtracting from total_chips.
    """
    num_others = max(0, remaining_players - table_size)
    if num_others == 0:
        return []

    # table_stacks is scaled by 100, convert to unscaled tournament units
    chips_at_table_unscaled = sum(table_stacks) / 100.0
    remaining_chips = max(0.0, total_chips - chips_at_table_unscaled)

    if remaining_chips == 0:
        return [0] * num_others

    # Harmonic weights: 1/10, 1/11, 1/12, ... — produces a gradual descending curve
    harmonic_weights = [1.0 / (i + 10.0) for i in range(num_others)]
    total_weight = sum(harmonic_weights)

    # Scale so the weights sum to remaining_chips and round to integer whole numbers
    otherstacks = [int(round((w / total_weight) * remaining_chips)) for w in harmonic_weights]

    return otherstacks


# ---------------------------------------------------------------------------
# Hand config builder
# ---------------------------------------------------------------------------

def build_hand_config(spot, structure_data, script_dir):
    """
    Build a single HRC JSON hand config for a given spot.
    """
    total_chips = int(structure_data["chips"])
    bb = spot["bb"]
    table_size = spot["table_size"]

    # Generate stacks — strictly within the BB range from the config (adjusted for chips limits)
    stacks = generate_stacks(
        table_size, bb,
        spot["avg_bb_min"], spot["avg_bb_max"],
        total_chips, spot["remaining"]
    )

    otherstacks = generate_otherstacks(
        stacks, total_chips,
        spot["remaining"], table_size
    )

    # Equity model
    if spot["is_final_table"]:
        eq_id = "malmuthharvil"
    else:
        eq_id = "mtticm"

    # Tree config — use script mode referencing the correct JS file
    script_name = "high_icm_test.js" if spot["script"] == "high_icm" else "low_icm_test.js"
    script_path = os.path.join(script_dir, script_name)
    # Normalize to forward slashes for HRC compatibility
    script_path = script_path.replace("\\", "/")

    config = {
        "handdata": {
            "stacks": stacks,
            "blinds": [int(spot["bb"]), int(spot["sb"]), int(spot["ante"])],
            "skipSb": False,
            "movingBu": False,
            "anteType": "REGULAR",
            "straddleType": "OFF"
        },
        "eqmodel": {
            "otherstacks": otherstacks,
            "id": eq_id,
            "structure": {
                "name": structure_data["name"],
                "chips": total_chips,
                "prizes": structure_data["prizes"]
            }
        },
        "treeconfig": {
            "mode": "scripted",
            "scriptfile": script_path
        },
        "engine": {
            "type": "montecarlo",
            "maxactive": 4,
            "configuration": {
                "abstractions": [
                    {"street": 0, "buckets": 169},
                    {"street": 1, "buckets": 1024,
                    "id": "22804b04d3732210b3f28dbaee3a59fbe7ab7a573b679ee68c876760aba76b94"},
                    {"street": 2, "buckets": 256,
                    "id": "661d702e82b930222bdd1e7cea3eef35f9306baaad628cec48713091b7e2e398"},
                    {"street": 3, "buckets": 256,
                    "id": "41e796828302d1cb95d18663fc2e1eee65f2831c90b26339a814d285003785a1"}
                ]
            }
        }
    }

    return config


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def write_json(config, output_path):
    with open(output_path, "w") as f:
        json.dump(config, f, indent=2)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="HRC JSON Hand Config Generator — generates hands per spot for 300/1500 player MTT configs"
    )
    parser.add_argument(
        "--scenario", type=str, choices=["300", "1500"],
        default="1500",
        help="Which tournament size config to use (default: 1500)"
    )
    parser.add_argument(
        "--count", type=int, default=1,
        help="Number of hands to generate per spot (default: 1)"
    )
    parser.add_argument(
        "--outdir", type=str, default="output_hands",
        help="Root output directory (default: output_hands)"
    )
    parser.add_argument(
        "--spots", type=str, nargs="*", default=None,
        help="Generate only specific spots by name (e.g. --spots 75pct ft_9max). "
            "If omitted, generates all spots."
    )
    args = parser.parse_args()

    # Resolve paths relative to the project root (one level up from src/)
    script_dir_self = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir_self)
    data_dir = os.path.join(project_root, "Data")
    outdir = os.path.join(project_root, args.outdir)

    # Load payout structure
    if args.scenario == "300":
        payout_file = os.path.join(data_dir, "mtt_300_players.json")
        spots = SPOTS_300
    else:
        payout_file = os.path.join(data_dir, "mtt_1500_payout.json")
        spots = SPOTS_1500

    if not os.path.exists(payout_file):
        print(f"ERROR: Payout file not found: {payout_file}")
        return

    structure_data = load_team_structure(payout_file)
    print(f"Loaded structure: {structure_data['name']}  |  Chips: {structure_data['chips']:,.0f}")

    # Filter spots if requested
    if args.spots:
        requested = set(s.lower() for s in args.spots)
        spots = [s for s in spots if s["name"].lower() in requested]
        if not spots:
            print(f"ERROR: No matching spots found. Available: "
                f"{', '.join(s['name'] for s in (SPOTS_300 if args.scenario == '300' else SPOTS_1500))}")
            return

    # Generate hands
    total_generated = 0
    for spot in spots:
        spot_dir = os.path.join(outdir, f"{args.scenario}p", spot["name"])
        os.makedirs(spot_dir, exist_ok=True)

        for i in range(args.count):
            config = build_hand_config(spot, structure_data, data_dir)
            filename = f"hand_{i + 1}.json"
            output_path = os.path.join(spot_dir, filename)
            write_json(config, output_path)
            total_generated += 1

        eq_label = "Malmuth-Harville" if spot["is_final_table"] else "Multi-Table ICM"
        print(
            f"  [{spot['name']:>25s}]  "
            f"{args.count} hand(s)  |  "
            f"blinds {spot['sb']}/{spot['bb']} ante {spot['ante']}  |  "
            f"{spot['table_size']}-max  |  "
            f"{spot['remaining']} remaining  |  "
            f"{spot['script']}  |  "
            f"{eq_label}"
        )

    print(f"\nDone — {total_generated} hand(s) generated in {outdir}/{args.scenario}p/")


if __name__ == "__main__":
    main()
