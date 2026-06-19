#!/usr/bin/env node

/**
 * HRC JSON Hand Config Generator
 *
 * Generates randomised hand configurations per spot for 300/1500 player MTT
 * configs, outputting clean integer stacks compatible with HoldemResources
 * Calculator's JSON import format.
 *
 * Usage:
 *   npm run generate -- --scenario 1500 --count 1
 *   npm run generate -- --scenario 300 --count 3 --spots 75pct ft_9max
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Payout structure loader
// ---------------------------------------------------------------------------

/**
 * Load payout structure from HRC JSON file in Data/ directory.
 */
function loadTeamStructure(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  const structure = data.structures[0];
  const rawPrizes = structure.prizes || {};
  const compressed = compressPrizes(rawPrizes);

  return {
    name: structure.name || "Custom Structure",
    chips: Math.round(Number(structure.chips || 15000000)),
    prizes: compressed,
  };
}

/**
 * Compress a full prize map into HRC's range-start format.
 *
 * HRC exports prizes with only the first position of each payout tier,
 * e.g. {"10": 100.0, "13": 80.0} means positions 10-12 pay 100, 13+ pay 80.
 * This function converts an expanded map (every position listed) into
 * that compressed form, ensuring the final position is always preserved.
 */
function compressPrizes(prizes) {
  const entries = Object.entries(prizes);
  if (entries.length === 0) return {};

  // Sort by position number
  entries.sort((a, b) => Number(a[0]) - Number(b[0]));

  const compressed = {};
  let prevValue = null;
  const lastIdx = entries.length - 1;

  for (let idx = 0; idx < entries.length; idx++) {
    const [posStr, value] = entries[idx];
    const ival = Math.round(Number(value));
    if (ival !== prevValue || idx === lastIdx) {
      compressed[posStr] = ival;
      prevValue = ival;
    }
  }

  return compressed;
}

// ---------------------------------------------------------------------------
// Spot definitions — derived directly from the team config documents
// ---------------------------------------------------------------------------

// Each spot has:
//   name            — folder-friendly label
//   sb, bb, ante    — blind structure
//   avgBbMin/Max    — stack generation range (in BB)
//   remaining       — total remaining players in the tournament at this spot
//   tableSize       — players at the table for this spot
//   script          — which betting script to reference ("low_icm" or "high_icm")
//   isFinalTable    — whether to use Malmuth-Harville equity model

const SPOTS_300 = [
  {
    name: "75pct",
    sb: 30000, bb: 60000, ante: 7500,
    avgBbMin: 15, avgBbMax: 60,
    remaining: 225, tableSize: 8,
    script: "low_icm", isFinalTable: false,
  },
  {
    name: "50pct",
    sb: 50000, bb: 100000, ante: 12500,
    avgBbMin: 10, avgBbMax: 50,
    remaining: 150, tableSize: 8,
    script: "low_icm", isFinalTable: false,
  },
  {
    name: "25pct",
    sb: 100000, bb: 200000, ante: 25000,
    avgBbMin: 10, avgBbMax: 50,
    remaining: 75, tableSize: 8,
    script: "low_icm", isFinalTable: false,
  },
  {
    name: "18pct",
    sb: 150000, bb: 300000, ante: 35000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 54, tableSize: 8,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "stone_bubble",
    sb: 175000, bb: 350000, ante: 45000,
    avgBbMin: 10, avgBbMax: 45,
    remaining: 46, tableSize: 8,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "10pct",
    sb: 250000, bb: 500000, ante: 60000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 30, tableSize: 8,
    script: "low_icm", isFinalTable: false,
  },
  {
    name: "final_3_table",
    sb: 500000, bb: 1000000, ante: 125000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 24, tableSize: 8,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "final_2_table_8max",
    sb: 1000000, bb: 2000000, ante: 250000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 16, tableSize: 8,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "final_2_table_7max",
    sb: 1000000, bb: 2000000, ante: 250000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 14, tableSize: 7,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "final_2_table_6max",
    sb: 1000000, bb: 2000000, ante: 250000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 12, tableSize: 6,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "final_2_table_5max",
    sb: 1000000, bb: 2000000, ante: 250000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 10, tableSize: 5,
    script: "high_icm", isFinalTable: false,
  },
  // --- Final Table spots (Malmuth-Harville ICM) ---
  {
    name: "ft_9max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 9, tableSize: 9,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_8max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 8, tableSize: 8,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_7max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 7, tableSize: 7,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_6max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 6, tableSize: 6,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_5max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 5, avgBbMax: 40,
    remaining: 5, tableSize: 5,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_4max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 5, avgBbMax: 40,
    remaining: 4, tableSize: 4,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_3max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 5, avgBbMax: 40,
    remaining: 3, tableSize: 3,
    script: "high_icm", isFinalTable: true,
  },
];

const SPOTS_1500 = [
  {
    name: "75pct",
    sb: 30000, bb: 60000, ante: 7500,
    avgBbMin: 15, avgBbMax: 60,
    remaining: 1125, tableSize: 8,
    script: "low_icm", isFinalTable: false,
  },
  {
    name: "50pct",
    sb: 50000, bb: 100000, ante: 12500,
    avgBbMin: 10, avgBbMax: 50,
    remaining: 750, tableSize: 8,
    script: "low_icm", isFinalTable: false,
  },
  {
    name: "25pct",
    sb: 100000, bb: 200000, ante: 25000,
    avgBbMin: 10, avgBbMax: 50,
    remaining: 375, tableSize: 8,
    script: "low_icm", isFinalTable: false,
  },
  {
    name: "18pct",
    sb: 150000, bb: 300000, ante: 35000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 270, tableSize: 8,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "stone_bubble",
    sb: 175000, bb: 350000, ante: 45000,
    avgBbMin: 10, avgBbMax: 45,
    remaining: 226, tableSize: 8,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "10pct",
    sb: 300000, bb: 600000, ante: 75000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 150, tableSize: 8,
    script: "low_icm", isFinalTable: false,
  },
  {
    name: "5pct",
    sb: 500000, bb: 1000000, ante: 125000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 75, tableSize: 8,
    script: "low_icm", isFinalTable: false,
  },
  {
    name: "final_3_table",
    sb: 1000000, bb: 2000000, ante: 250000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 24, tableSize: 8,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "final_2_table_8max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 16, tableSize: 8,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "final_2_table_7max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 14, tableSize: 7,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "final_2_table_6max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 12, tableSize: 6,
    script: "high_icm", isFinalTable: false,
  },
  {
    name: "final_2_table_5max",
    sb: 1500000, bb: 3000000, ante: 350000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 10, tableSize: 5,
    script: "high_icm", isFinalTable: false,
  },
  // --- Final Table spots (Malmuth-Harville ICM) ---
  {
    name: "ft_9max",
    sb: 5000000, bb: 10000000, ante: 1250000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 9, tableSize: 9,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_8max",
    sb: 5000000, bb: 10000000, ante: 1250000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 8, tableSize: 8,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_7max",
    sb: 5000000, bb: 10000000, ante: 1250000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 7, tableSize: 7,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_6max",
    sb: 5000000, bb: 10000000, ante: 1250000,
    avgBbMin: 8, avgBbMax: 45,
    remaining: 6, tableSize: 6,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_5max",
    sb: 5000000, bb: 10000000, ante: 1250000,
    avgBbMin: 5, avgBbMax: 40,
    remaining: 5, tableSize: 5,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_4max",
    sb: 5000000, bb: 10000000, ante: 1250000,
    avgBbMin: 5, avgBbMax: 40,
    remaining: 4, tableSize: 4,
    script: "high_icm", isFinalTable: true,
  },
  {
    name: "ft_3max",
    sb: 5000000, bb: 10000000, ante: 1250000,
    avgBbMin: 5, avgBbMax: 40,
    remaining: 3, tableSize: 3,
    script: "high_icm", isFinalTable: true,
  },
];

// ---------------------------------------------------------------------------
// Stack generation — stacks stay strictly within the defined BB range
// ---------------------------------------------------------------------------

/**
 * Random integer in [min, max] inclusive.
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate stack distributions for a table.
 *
 * Each stack is drawn as an integer Big Blind from [avgBbMin, avgBbMax]
 * and converted to chips. Stacks are mathematically adjusted and rounded
 * to integer BBs to ensure they are clean multiples of BB (like the example)
 * and strictly respect tournament limits.
 */
function generateStacks(tableSize, bb, avgBbMin, avgBbMax, totalChips, remainingPlayers) {
  const bbUnscaled = bb / 100.0;
  const numOthers = Math.max(0, remainingPlayers - tableSize);

  // 1. Generate random raw BB stacks as integers in [avgBbMin, avgBbMax]
  let bbStacks = Array.from({ length: tableSize }, () => randInt(avgBbMin, avgBbMax));

  // 2. Check if the sum of table stacks + minimum other stacks exceeds totalChips
  const minOtherBb = avgBbMin;
  const totalBb = totalChips / bbUnscaled;
  const minOtherBbTotal = numOthers * minOtherBb;
  let maxTableBb = totalBb - minOtherBbTotal;

  if (maxTableBb < tableSize * avgBbMin) {
    maxTableBb = tableSize * avgBbMin;
  }

  let sumBbStacks = bbStacks.reduce((a, b) => a + b, 0);

  if (numOthers === 0) {
    // Final table: stacks must sum to totalBb exactly
    if (sumBbStacks !== totalBb) {
      const excessAllowed = totalBb - tableSize * avgBbMin;
      const excessGenerated = sumBbStacks - tableSize * avgBbMin;
      if (excessGenerated > 0 && excessAllowed >= 0) {
        const factor = excessAllowed / excessGenerated;
        bbStacks = bbStacks.map((s) => avgBbMin + (s - avgBbMin) * factor);
      } else {
        bbStacks = Array(tableSize).fill(totalBb / tableSize);
      }
    }
  } else {
    // Non-final table: scale down only if sum exceeds maxTableBb
    if (sumBbStacks > maxTableBb) {
      const excessAllowed = maxTableBb - tableSize * avgBbMin;
      const excessGenerated = sumBbStacks - tableSize * avgBbMin;
      if (excessGenerated > 0 && excessAllowed >= 0) {
        const factor = excessAllowed / excessGenerated;
        bbStacks = bbStacks.map((s) => avgBbMin + (s - avgBbMin) * factor);
      } else {
        bbStacks = Array(tableSize).fill(avgBbMin);
      }
    }
  }

  // Round BB stacks to integer BB units to guarantee clean, round stack chip counts
  bbStacks = bbStacks.map((s) => Math.round(s));

  // Ensure they are within range [avgBbMin, avgBbMax] (unless mathematically forced by totalBb)
  if (numOthers > 0) {
    bbStacks = bbStacks.map((s) => Math.max(avgBbMin, Math.min(avgBbMax, s)));
    const targetMax = Math.floor(maxTableBb);
    while (bbStacks.reduce((a, b) => a + b, 0) > targetMax) {
      const candidates = bbStacks
        .map((s, i) => (s > avgBbMin ? i : -1))
        .filter((i) => i !== -1);
      if (candidates.length === 0) break;
      // Pick the candidate with the largest stack
      let maxIdx = candidates[0];
      for (const c of candidates) {
        if (bbStacks[c] > bbStacks[maxIdx]) maxIdx = c;
      }
      bbStacks[maxIdx] -= 1;
    }
  } else {
    bbStacks = bbStacks.map((s) => Math.max(avgBbMin, s));
    const currentSum = bbStacks.reduce((a, b) => a + b, 0);
    const targetSum = Math.round(totalBb);
    const diff = targetSum - currentSum;
    if (diff !== 0) {
      // Find the index of the max stack
      let maxIdx = 0;
      for (let i = 1; i < bbStacks.length; i++) {
        if (bbStacks[i] > bbStacks[maxIdx]) maxIdx = i;
      }
      bbStacks[maxIdx] = Math.max(avgBbMin, bbStacks[maxIdx] + diff);
    }
  }

  // Convert BB stacks to final scaled chips (rounded to ints)
  const stacks = bbStacks.map((s) => Math.round(s * bb));
  return stacks;
}

/**
 * Distribute chips NOT at the table across the other remaining players
 * using a descending harmonic distribution.
 *
 * HRC expects otherstacks sorted from largest to smallest, following a
 * smooth curve. Table stacks (scaled) are converted to unscaled tournament
 * units before subtracting from totalChips.
 */
function generateOtherstacks(tableStacks, totalChips, remainingPlayers, tableSize) {
  const numOthers = Math.max(0, remainingPlayers - tableSize);
  if (numOthers === 0) return [];

  // tableStacks is scaled by 100, convert to unscaled tournament units
  const chipsAtTableUnscaled = tableStacks.reduce((a, b) => a + b, 0) / 100.0;
  const remainingChips = Math.max(0, totalChips - chipsAtTableUnscaled);

  if (remainingChips === 0) {
    return Array(numOthers).fill(0);
  }

  // Harmonic weights: 1/10, 1/11, 1/12, ... — produces a gradual descending curve
  const harmonicWeights = Array.from({ length: numOthers }, (_, i) => 1.0 / (i + 10.0));
  const totalWeight = harmonicWeights.reduce((a, b) => a + b, 0);

  // Scale so the weights sum to remainingChips and round to integer whole numbers
  const otherstacks = harmonicWeights.map((w) =>
    Math.round((w / totalWeight) * remainingChips)
  );

  return otherstacks;
}

// ---------------------------------------------------------------------------
// Hand config builder
// ---------------------------------------------------------------------------

/**
 * Build a single HRC JSON hand config for a given spot.
 */
function buildHandConfig(spot, structureData, scriptDir) {
  const totalChips = structureData.chips;
  const { bb } = spot;

  // Generate stacks — strictly within the BB range from the config (adjusted for chips limits)
  const stacks = generateStacks(
    spot.tableSize, bb,
    spot.avgBbMin, spot.avgBbMax,
    totalChips, spot.remaining
  );

  const otherstacks = generateOtherstacks(
    stacks, totalChips,
    spot.remaining, spot.tableSize
  );

  // Equity model
  const eqId = spot.isFinalTable ? "malmuthharvil" : "mtticm";

  // Tree config — use script mode referencing the correct JS file
  const scriptName = spot.script === "high_icm" ? "high_icm_test.js" : "low_icm_test.js";
  // Normalize to forward slashes for HRC compatibility
  const scriptPath = path.join(scriptDir, scriptName).replace(/\\/g, "/");

  const config = {
    handdata: {
      stacks,
      blinds: [spot.bb, spot.sb, spot.ante],
      skipSb: false,
      movingBu: false,
      anteType: "REGULAR",
      straddleType: "OFF",
    },
    eqmodel: {
      otherstacks,
      id: eqId,
      structure: {
        name: structureData.name,
        chips: totalChips,
        prizes: structureData.prizes,
      },
    },
    treeconfig: {
      mode: "scripted",
      scriptfile: scriptPath,
    },
    engine: {
      type: "montecarlo",
      maxactive: 4,
      configuration: {
        abstractions: [
          { street: 0, buckets: 169 },
          {
            street: 1, buckets: 1024,
            id: "22804b04d3732210b3f28dbaee3a59fbe7ab7a573b679ee68c876760aba76b94",
          },
          {
            street: 2, buckets: 256,
            id: "661d702e82b930222bdd1e7cea3eef35f9306baaad628cec48713091b7e2e398",
          },
          {
            street: 3, buckets: 256,
            id: "41e796828302d1cb95d18663fc2e1eee65f2831c90b26339a814d285003785a1",
          },
        ],
      },
    },
  };

  return config;
}

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

function writeJson(config, outputPath) {
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Recursively create directories (like Python's os.makedirs(exist_ok=True)).
 */
function mkdirp(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// ---------------------------------------------------------------------------
// CLI argument parser (minimal, no dependencies)
// ---------------------------------------------------------------------------

function parseArgs() {
  const argv = process.argv.slice(2);
  const args = {
    scenario: "1500",
    count: 1,
    outdir: "output_hands",
    spots: null,
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--scenario":
        args.scenario = argv[++i];
        if (args.scenario !== "300" && args.scenario !== "1500") {
          console.error(`ERROR: --scenario must be "300" or "1500", got "${args.scenario}"`);
          process.exit(1);
        }
        break;
      case "--count":
        args.count = parseInt(argv[++i], 10);
        if (isNaN(args.count) || args.count < 1) {
          console.error("ERROR: --count must be a positive integer");
          process.exit(1);
        }
        break;
      case "--outdir":
        args.outdir = argv[++i];
        break;
      case "--spots":
        args.spots = [];
        // Consume all following args that don't start with --
        while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
          args.spots.push(argv[++i]);
        }
        break;
      case "--help":
      case "-h":
        console.log(`
HRC JSON Hand Config Generator

Usage:
  npm run generate -- --scenario 1500 --count 1
  npm run generate -- --scenario 300 --count 3 --spots 75pct ft_9max

Options:
  --scenario  "300" or "1500" (default: "1500")
  --count     Number of hands per spot (default: 1)
  --outdir    Root output directory (default: "output_hands")
  --spots     Space-separated list of spots to generate (default: all)
  --help      Show this help message
`);
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${argv[i]}`);
        process.exit(1);
    }
  }

  return args;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs();

  // Resolve paths relative to the project root (one level up from src/)
  const scriptDirSelf = __dirname;
  const projectRoot = path.dirname(scriptDirSelf);
  const dataDir = path.join(projectRoot, "Data");
  const outdir = path.join(projectRoot, args.outdir);

  // Load payout structure
  let payoutFile;
  let spots;
  if (args.scenario === "300") {
    payoutFile = path.join(dataDir, "mtt_300_players.json");
    spots = SPOTS_300;
  } else {
    payoutFile = path.join(dataDir, "mtt_1500_payout.json");
    spots = SPOTS_1500;
  }

  if (!fs.existsSync(payoutFile)) {
    console.error(`ERROR: Payout file not found: ${payoutFile}`);
    process.exit(1);
  }

  const structureData = loadTeamStructure(payoutFile);
  console.log(
    `Loaded structure: ${structureData.name}  |  Chips: ${structureData.chips.toLocaleString()}`
  );

  // Filter spots if requested
  if (args.spots && args.spots.length > 0) {
    const requested = new Set(args.spots.map((s) => s.toLowerCase()));
    spots = spots.filter((s) => requested.has(s.name.toLowerCase()));
    if (spots.length === 0) {
      const allSpots = args.scenario === "300" ? SPOTS_300 : SPOTS_1500;
      console.error(
        `ERROR: No matching spots found. Available: ${allSpots.map((s) => s.name).join(", ")}`
      );
      process.exit(1);
    }
  }

  // Generate hands
  let totalGenerated = 0;
  for (const spot of spots) {
    const spotDir = path.join(outdir, `${args.scenario}p`, spot.name);
    mkdirp(spotDir);

    for (let i = 0; i < args.count; i++) {
      const config = buildHandConfig(spot, structureData, dataDir);
      const filename = `hand_${i + 1}.json`;
      const outputPath = path.join(spotDir, filename);
      writeJson(config, outputPath);
      totalGenerated++;
    }

    const eqLabel = spot.isFinalTable ? "Malmuth-Harville" : "Multi-Table ICM";
    console.log(
      `  [${spot.name.padStart(25)}]  ` +
      `${args.count} hand(s)  |  ` +
      `blinds ${spot.sb}/${spot.bb} ante ${spot.ante}  |  ` +
      `${spot.tableSize}-max  |  ` +
      `${spot.remaining} remaining  |  ` +
      `${spot.script}  |  ` +
      `${eqLabel}`
    );
  }

  console.log(`\nDone — ${totalGenerated} hand(s) generated in ${outdir}/${args.scenario}p/`);
}

main();
