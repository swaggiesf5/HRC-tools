/*
 * This script closely replicates the basic options of the UI setup.
 * 
 * Preflop sizing use the same syntax as in the UI, it's documented
 * in the ctx.sizingsPreflop API.
 *
 *Betting Script for HoldemResources Calculator	(3.2.1.202402131542) beta
 *Author: Annuit20
 *V1.38
 */

//===========================================================================================================================================
//FocusTree
//===========================================================================================================================================
const USE_FOCUS_TREE = false; // Set to false to deactivate the FocusTree functionality
const FOCUS_TREE_POSITION = 0; // BU= 0, CO= -1, HJ= -2 ...



//===========================================================================================================================================
// Start of Preflop configuration
//===========================================================================================================================================


//*******************************************************************************************************************************************
// Flatting rules
//*******************************************************************************************************************************************

// betcount : allowedflats
let ALLOWED_FLATS_PER_RAISE = {
	1: 0, // See PKO Limp settings below
	2: 2, //opens: 1 flat
	3: 1, //3-bets: 1 flat
	4: 1, //4-bets: 1 flat
	5: 0, //etc
	6: 0
};

let ALLOW_SB_COMPLETE = true;
let ALLOW_COLD_CALLS = false;
let ALLOW_FLATS_CLOSING_ACTION = true;
let PREFLOP_ALLIN_THRESHOLD = 0.4;
let PREFLOP_ADD_ALLIN_SPR = 5;

// PKO Limping
let ALLOW_LIMP_MAX_BB = 6; // Shortstack BB Size threshold for implementing limping
let MAX_LIMPERS_ALLOWED = 0;


//*******************************************************************************************************************************************
//Additionally Flatting rules for the FocusTree
//*******************************************************************************************************************************************
let MAX_LIMPERS_ALLOWED_FOCUS_TREE = 2;
let ALLOWED_FLATS_PER_RAISE_FOCUS_TREE= 3;
let ALLOW_COLD_CALLS_FOCUS_TREE = false;



//*******************************************************************************************************************************************
// Open Raise Sizing definitions for different positions and effective stack sizes
//*******************************************************************************************************************************************
let SIZES_OPEN = {
    'SBvsBB': {
        10: "2.0bb",
		15: "2.5bb",
		20: "3.0bb",
		30: "3.0bb",
        40: "3.0bb",
        60: "3.5bb",
        100: "3.5bb",
		'default': "4.0bb" 
    },
	'SBvsOthers': {
        10: "2.5bb + 1bb + 0.5bb",
		15: "2.5bb + 1bb + 0.5bb",
		20: "3.0bb + 1bb + 0.5bb",
		30: "3.0bb + 1bb + 0.5bb",
        40: "3.0bb + 1bb + 0.5bb",
        60: "3.5bb + 1bb + 0.5bb",
        100: "3.5bb + 1bb + 0.5bb",
		'default': "4.0bb + 1bb + 0.5bb" 
    },
	'BBvsOthers': {
        10: "2.5bb + 1bb + 0.5bb",
		15: "2.5bb + 1bb + 0.5bb",
		20: "3.0bb + 1bb + 0.5bb",
		30: "3.0bb + 1bb + 0.5bb",
        40: "3.0bb + 1bb + 0.5bb",
        60: "3.5bb + 1bb + 0.5bb",
        100: "3.5bb + 1bb + 0.5bb",
		'default': "4.0bb + 1bb + 0.5bb" 
    },
    'BBvsSB': {
        10: "2.5bb",
		15: "2.5bb",
		20: "3.0bb",
		30: "3.0bb",
        40: "3.0bb",
        60: "3.5bb",
        100: "3.5bb",
		'default': "4.0bb" 
    },
    'Other': {
        10: "2.0bb + 1bb + 0.5bb",
		15: "2.0bb + 1bb + 0.5bb",
		20: "2.0bb + 1bb + 0.5bb",
        30: "2.0bb + 1bb + 0.5bb",
        40: "2.0bb + 1bb + 0.5bb",
        60: "2.0bb + 1bb + 0.5bb",
        100: "2.1bb + 1bb + 0.5bb",
        'default': "2.3bb + 1bb + 0.5bb"
    }
};
let ADDITIONAL_ALLIN_STACK_THRESHOLD_BB = 1000;




//*******************************************************************************************************************************************
// 3-Bet Sizing definitions for different scenarios based on effective stack sizes
//*******************************************************************************************************************************************
let SIZES_3BET = {
     'IP': {
        15: "2.0x + 0.5bb, All-In",
		20: "2.25x + 0.5bb, All-In",
        25: "2.5x + 0.5bb, All-In",
        30: "2.75x + 0.5bb, All-In",
        35: "3.0x + 0.5bb, All-In",
        40: "3.25x + 0.5bb, All-In",
        60: "3.5x + 1.0bb, All-In",
        80: "3.5x + 1.0bb, All-In",
        100: "3.75x + 1.0bb, All-In",
        'default': "4.0x + 1.0bb, All-In"
    },
    'SBvsBB': {
        15: "2.25x, All-In",
		20: "2.25x, All-In",
        25: "2.5x, All-In",
        30: "2.75x, All-In",
        35: "2.75x, All-In",
        40: "3.0x, All-In",
        60: "3.0x, All-In",
        80: "3.25x, All-In",
        100: "3.5x, All-In",
        'default': "3.75x, All-In"
    },
    'SBvsOthers': {
        15: "2.25x + 0.5bb, All-In",
		20: "2.5x + 0.5bb, All-In",
        25: "3.0x + 0.5bb, All-In",
        30: "3.25x + 0.5bb, All-In",
        35: "3.5x + 0.5bb, All-In",
        40: "3.75x + 0.5bb, All-In",
        60: "4.0x + 1.0bb, All-In",
        80: "4.0x + 1.0bb, All-In",
        100: "4.25x + 1.0bb, All-In",
        'default': "4.5x + 1.0bb, All-In"
    },
    'BBvsSB': {
        15: "2.0x, All-In",
		20: "2.0x, All-In",
        25: "2.25x, All-In",
        30: "2.5x, All-In",
        35: "2.5x, All-In",
        40: "2.75x, All-In",
        60: "2.75x, All-In",
        80: "3.0x, All-In",
        100: "3.25x, All-In",
        'default': "3.5x, All-In"
    },
    'BBvsOthers': {
		15: "2.5x + 0.5bb, All-In",
		20: "2.75x + 0.5bb, All-In",
        25: "3.5x + 0.5bb, All-In",
        30: "3.75x + 0.5bb, All-In",
        35: "4.0x + 0.5bb, All-In",
        40: "4.25x + 0.5bb, All-In",
        60: "4.5x + 1.0bb, All-In",
        80: "4.5x + 1.0bb, All-In",
        100: "4.75x + 1.0bb, All-In",
        'default': "5.0x + 1.0bb, All-In"
    }
};



//*******************************************************************************************************************************************
// 4-Bet Sizing definitions for different effective stack sizes
//*******************************************************************************************************************************************
let SIZES_4BET_IP = {
    40: "2.0x, All-In",
    100: "2.1x, All-In",
    'default': "2.2x, All-In"
};


let SIZES_4BET_OOP = {
    40: "2.1x, All-In",
    100: "2.2x, All-In",
    'default': "2.3x, All-In"
};



//*******************************************************************************************************************************************
// 5-Bet
//*******************************************************************************************************************************************
let SIZES_POT_5BET_IP = "All-In";
let SIZES_POT_5BET_OOP = "All-In";





//===========================================================================================================================================
// Start of Postflop configuration
//===========================================================================================================================================


//*******************************************************************************************************************************************
// Primary geometric betting hint, this works like the UI setting
//*******************************************************************************************************************************************
let POSTFLOP_PRIMARY_HINT_HEADS_UP = [0.66];
let POSTFLOP_PRIMARY_HINT_MULTIWAY = [0.66];
let POSTFLOP_DONK_BET_SIZE = 0.33;

// Additional options for flop sizings
let POSTFLOP_ADD_FLOP_BET_POT = [];
let POSTFLOP_ADD_FLOP_CBET_POT = [];

// Some additional Postflop Settings
let POSTFLOP_ALLOW_DONK = false;
let POSTFLOP_ALLOW_DONK_PREV_AGGRESSION = true;
let ALLOWED_DONK_PLAYERS_COUNT = 2;

let POSTFLOP_ADD_ALLIN_SPR = 3;



//*******************************************************************************************************************************************
//Additionally Postflop settings for the FocusTree
//*******************************************************************************************************************************************
let POSTFLOP_PRIMARY_HINT_HEADS_UP_FOCUS_TREE = [0.3, 0.7];
let POSTFLOP_PRIMARY_HINT_MULTIWAY_FOCUS_TREE = [0.5];
let POSTFLOP_DONK_BET_SIZE_FOCUS_TREE = 0.33;

// Additional options for flop sizings
let POSTFLOP_ADD_FLOP_BET_POT_FOCUS_TREE = [];
let POSTFLOP_ADD_FLOP_CBET_POT_FOCUS_TREE = [];

// Some additional Postflop Settings
let POSTFLOP_ALLOW_DONK_FOCUS_TREE = true;
let POSTFLOP_ALLOW_DONK_PREV_AGGRESSION_FOCUS_TREE = true;
let ALLOWED_DONK_PLAYERS_COUNT_FOCUS_TREE = 2;



//*******************************************************************************************************************************************
// This defines the last street of "regular" betting, starting a forced check-down on next street
//*******************************************************************************************************************************************
let POSTFLOP_FORCE_CHECKDOWN_AFTER = {
    2: RIVER, // 2-way pots
    3: RIVER, // 3-way, etc
    4: TURN,
    5: FLOP
}

//===========================================================================================================================================
// End of Config
//===========================================================================================================================================





//===========================================================================================================================================
//===========================================================================================================================================
// FUNCTIONS
//===========================================================================================================================================
//===========================================================================================================================================


//*******************************************************************************************************************************************
//Preflop
//*******************************************************************************************************************************************
function getSizingsPreflop(ctx) {
    let bets = 1 + ctx.getBetCount();
    let sizings = [];
    switch (bets) {
        case 2: //opening
            sizings = getSizingsOpening(ctx); break;
        case 3: //3-bets
            sizings = getSizings3Bets(ctx); break;
        case 4: //4-bets
            sizings = getSizings4Bets(ctx); break;
        case 5: //5-bets
            sizings = getSizings5Bets(ctx); break;
        default: //6-bets+
            return ctx.sizingAllIn();
    }

    if (ctx.getStackPotRatio() <= PREFLOP_ADD_ALLIN_SPR)
        sizings.push(ctx.sizingAllIn());

    return applyAllinThreshold(ctx, sizings);
}

function applyAllinThreshold(ctx, sizings) {
    let sizeallin = ctx.sizingAllIn();
    let activechips = ctx.getPotState().getChipsActive(ctx.getActivePlayer());
    let thresholdchips = activechips + (sizeallin - activechips) * PREFLOP_ALLIN_THRESHOLD;
    return sizings.map(s => s >= thresholdchips ? sizeallin : s);
}



//*******************************************************************************************************************************************
//Preflop Opening
//*******************************************************************************************************************************************
function getSizingsOpening(ctx) {
    let player = ctx.getActivePlayer();
    let state = ctx.getPotState();
    let playerIsSB = player === ctx.getPlayerIndexSmallBlind();
    let playerIsBB = player === ctx.getPlayerIndexBigBlind();
    let minStackSizeBB = Infinity;
	let playerStackSizeBB = (state.getChipsActive(player) + state.getChipsRemaining(player)) / ctx.getSizeBigBlind();
	
    for (let p = 0; p < ctx.getNumberOfPlayers(); p++) {
        if (!state.hasPlayerFolded(p)) {
            let stackSizeBB = (state.getChipsActive(p) + state.getChipsRemaining(p)) / ctx.getSizeBigBlind();
            minStackSizeBB = Math.min(minStackSizeBB, stackSizeBB);
        }
    }

    let effectiveStackSizeBB = minStackSizeBB;
    let sizings = [];
    let sizingKey;
    if (effectiveStackSizeBB <= 10) {
        sizingKey = 10;
    } else if (effectiveStackSizeBB <= 15) {
        sizingKey = 15;
    } else if (effectiveStackSizeBB <= 20) {
        sizingKey = 20;
    } else if (effectiveStackSizeBB <= 30) {
        sizingKey = 30;
    } else if (effectiveStackSizeBB <= 40) {
        sizingKey = 40;
    } else if (effectiveStackSizeBB <= 60) {
        sizingKey = 60;
    } else if (effectiveStackSizeBB <= 100) {
        sizingKey = 100;
    } else {
        sizingKey = 'default';
    }

    let sizing;
    if (playerIsSB) {
        if (ctx.getFlatCallCount() > 0) {
            sizing = SIZES_OPEN['SBvsOthers'][sizingKey];
        } else {
            sizing = SIZES_OPEN['SBvsBB'][sizingKey];
        }
    } else if (playerIsBB) {
        if (ctx.getFlatCallCount() > 0) {
            sizing = SIZES_OPEN['BBvsOthers'][sizingKey];
        } else {
            sizing = SIZES_OPEN['BBvsSB'][sizingKey];
        }
    } else {
        sizing = SIZES_OPEN['Other'][sizingKey];
    }

    sizings = sizings.concat(Array.from(ctx.sizingsPreflop(sizing)));

    if (playerStackSizeBB < ADDITIONAL_ALLIN_STACK_THRESHOLD_BB) {
        sizings.push(ctx.sizingAllIn());
    }

    return sizings;
}



//*******************************************************************************************************************************************
//Preflop 3B
//*******************************************************************************************************************************************
function getSizings3Bets(ctx) {
    let player = ctx.getActivePlayer();
    let raiser = ctx.getLastRaiseAction().getPlayer();
    let callers = ctx.getFlatCallCount();
    let playerStackSizeBB = (ctx.getPotState().getChipsActive(player) + ctx.getPotState().getChipsRemaining(player)) / ctx.getSizeBigBlind();
    let raiserStackSizeBB = (ctx.getPotState().getChipsActive(raiser) + ctx.getPotState().getChipsRemaining(raiser)) / ctx.getSizeBigBlind();
    let effectiveStackSizeBB = Math.min(playerStackSizeBB, raiserStackSizeBB);
    let scenarioKey;
    let sizingKey;
    let sizing;
    let SBSize = ctx.getSizeSmallBlind();
    let isSqueeze = callers > 0;

    let playerIsSB = player === ctx.getPlayerIndexSmallBlind();
    let playerIsBB = player === ctx.getPlayerIndexBigBlind();
    let raiserIsSB = raiser === ctx.getPlayerIndexSmallBlind();
    let raiserIsBB = raiser === ctx.getPlayerIndexBigBlind();


    if (playerIsSB) {
        scenarioKey = raiserIsBB ? 'SBvsBB' : 'SBvsOthers';
    } else if (playerIsBB) {
        scenarioKey = raiserIsSB ? 'BBvsSB' : 'BBvsOthers';
    } else {
        scenarioKey = 'IP';
    }


    if (effectiveStackSizeBB <= 15) {
        sizingKey = 15;
    } else if (effectiveStackSizeBB <= 20) {
        sizingKey = 20;
    } else if (effectiveStackSizeBB <= 25) {
        sizingKey = 25;
    } else if (effectiveStackSizeBB <= 30) {
        sizingKey = 30;
    } else if (effectiveStackSizeBB <= 35) {
        sizingKey = 35;
    } else if (effectiveStackSizeBB <= 40) {
        sizingKey = 40;
	} else if (effectiveStackSizeBB <= 60) {
        sizingKey = 60;
	} else if (effectiveStackSizeBB <= 80) {
        sizingKey = 80;
	} else if (effectiveStackSizeBB <= 100) {
        sizingKey = 100;
    } else {
        sizingKey = 'default';
    }

    sizing = SIZES_3BET[scenarioKey][sizingKey];

    if (isSqueeze && ["40"].includes(sizingKey.toString())) {
        if (!sizing.includes("All-In")) {
            sizing += ", All-In";
        }
    }
    
    let roundedSizings = Array.from(ctx.sizingsPreflop(sizing)).map(sizing => Math.round(sizing / SBSize) * SBSize);

    return roundedSizings;
}



//*******************************************************************************************************************************************
//Preflop 4B
//*******************************************************************************************************************************************
function getSizings4Bets(ctx) {
    let player = ctx.getActivePlayer();
    let inPosition = ctx.isPlayerInPosition(player, ctx.getLastRaiseAction().getPlayer());
    let playerStackSizeBB = (ctx.getPotState().getChipsActive(player) + ctx.getPotState().getChipsRemaining(player)) / ctx.getSizeBigBlind();
    let raiserStackSizeBB = (ctx.getPotState().getChipsActive(ctx.getLastRaiseAction().getPlayer()) + ctx.getPotState().getChipsRemaining(ctx.getLastRaiseAction().getPlayer())) / ctx.getSizeBigBlind();
    let effectiveStackSizeBB = Math.min(playerStackSizeBB, raiserStackSizeBB);
	let SBSize = ctx.getSizeSmallBlind();
    let sizing;
    let sizingMap = inPosition ? SIZES_4BET_IP : SIZES_4BET_OOP;
    
    if (effectiveStackSizeBB <= 40)
	{
        sizing = sizingMap[40];
    }
	else if (effectiveStackSizeBB <= 100)
	{
        sizing = sizingMap[100];
    }
	else
	{
        sizing = sizingMap['default'];
    }

    let roundedSizings = Array.from(ctx.sizingsPreflop(sizing)).map(sizing => Math.round(sizing / SBSize) * SBSize);

    return roundedSizings;
}



//*******************************************************************************************************************************************
//Preflop 5B
//*******************************************************************************************************************************************
function getSizings5Bets(ctx) {
    let player = ctx.getActivePlayer();
    let inposition = ctx.isPlayerInPosition(player, ctx.getLastRaiseAction().getPlayer());
    return Array.from(ctx.sizingsPreflop(inposition ? SIZES_POT_5BET_IP : SIZES_POT_5BET_OOP));
}



//*******************************************************************************************************************************************
// Flat calling
//*******************************************************************************************************************************************
function canFlatCallPreflop(ctx) {
    if (isFocusTree(ctx)) {
        return canFlatCallPreflop_Special_Tree(ctx);
    } else {
        return canFlatCallPreflop_Standard_Tree(ctx);
    }
}



//*******************************************************************************************************************************************
// Flat calling StandardTree
//*******************************************************************************************************************************************
function canFlatCallPreflop_Standard_Tree(ctx) {
    let bets = ctx.getBetCount();
    let player = ctx.getActivePlayer();
    let currentFlats = ctx.getFlatCallCount();
	
    if (bets == 1 && ctx.getActivePlayer() == ctx.getPlayerIndexSmallBlind()) { 
        return true;
    }

    if (bets == 1 && ctx.getFlatCallCount() >= MAX_LIMPERS_ALLOWED) {
        return false;
    }

    let state = ctx.getPotState();
    for (let p = 0; p < ctx.getNumberOfPlayers(); p++) {
        if (!state.hasPlayerFolded(p)) {
            let effectiveStack = (state.getChipsActive(p) + state.getChipsRemaining(p)) / ctx.getSizeBigBlind();
            if (effectiveStack <= ALLOW_LIMP_MAX_BB) {
                return true;
            }
        }
    }

    if (ALLOWED_FLATS_PER_RAISE[bets] === undefined) {
        return false;
    }
	if (!ALLOW_COLD_CALLS && isColdCall(ctx, ctx.getActivePlayer()))
		return false;
	
	if (ALLOW_FLATS_CLOSING_ACTION && isClosingActionPreflop(ctx))
		return true;
	
    return ctx.getFlatCallCount() < ALLOWED_FLATS_PER_RAISE[bets];
}	



//*******************************************************************************************************************************************
// Flat calling FocusTree
//*******************************************************************************************************************************************
function canFlatCallPreflop_Special_Tree(ctx) {
    let bets = ctx.getBetCount();
    let player = ctx.getActivePlayer();
    let currentFlats = ctx.getFlatCallCount();
	
    if (bets == 1 && ctx.getFlatCallCount() >= MAX_LIMPERS_ALLOWED_FOCUS_TREE) {
        return false;
    }

    let state = ctx.getPotState();
    for (let p = 0; p < ctx.getNumberOfPlayers(); p++) {
        if (!state.hasPlayerFolded(p)) {
            let effectiveStack = (state.getChipsActive(p) + state.getChipsRemaining(p)) / ctx.getSizeBigBlind();
            if (effectiveStack <= ALLOW_LIMP_MAX_BB) {
                return true;
            }
        }
    }

	if (!ALLOW_COLD_CALLS_FOCUS_TREE && isColdCall(ctx, ctx.getActivePlayer()))
		return false;
	
	if (ALLOW_FLATS_CLOSING_ACTION && isClosingActionPreflop(ctx))
		return true;
	
    return ctx.getFlatCallCount() < ALLOWED_FLATS_PER_RAISE_FOCUS_TREE;
}



//*******************************************************************************************************************************************
//Postflop
//*******************************************************************************************************************************************
function getSizingsPostflop(ctx) {
    const player = ctx.getActivePlayer();
    const livePlayers = ctx.getPotState().countPlayersLive();

    if (isFocusTree(ctx)) {
        return getSizingsPostflopForFocusTree(ctx);
    } else {
        return getSizingsPostflopStandard(ctx);
    }
}


	
//*******************************************************************************************************************************************
// Postflop StandradTree 
//*******************************************************************************************************************************************
function getSizingsPostflopStandard(ctx) {
	let player = ctx.getActivePlayer();
	let livePlayers = ctx.getPotState().countPlayersLive();
	
	if (ctx.isDonkBet()) {
		if (!POSTFLOP_ALLOW_DONK) {
			if (!POSTFLOP_ALLOW_DONK_PREV_AGGRESSION || Array.from(ctx.getActionSequenceFull()).findIndex(pa => pa.getPlayer() == player && pa.getActionType() == RAISE) < 0)
				return [];
		}
        else if (livePlayers > ALLOWED_DONK_PLAYERS_COUNT) {
            return [];
        }
		else {
			return [ctx.sizingPot(POSTFLOP_DONK_BET_SIZE)]
		}
}	
	
    let sizings = (livePlayers == 2) ?
        POSTFLOP_PRIMARY_HINT_HEADS_UP.map(hint => ctx.sizingGeometricHint(hint)) :
        POSTFLOP_PRIMARY_HINT_MULTIWAY.map(hint => ctx.sizingGeometricHint(hint));

    if (ctx.getStreet() == FLOP && ctx.getBetCount() == 0) {
        sizings.push(...POSTFLOP_ADD_FLOP_BET_POT.map(s => ctx.sizingPot(s)));
        let raise = ctx.getLastRaiseAction();
        if (raise != null && raise.getPlayer() == player)
            sizings.push(...POSTFLOP_ADD_FLOP_CBET_POT.map(s => ctx.sizingPot(s)));
    }

    if (ctx.getStackPotRatio() <= POSTFLOP_ADD_ALLIN_SPR)
        sizings.push(ctx.sizingAllIn());

    return sizings;
}



//*******************************************************************************************************************************************
// Postflop FocusTree
//*******************************************************************************************************************************************
function getSizingsPostflopForFocusTree(ctx) {
	let player = ctx.getActivePlayer();
	let livePlayers = ctx.getPotState().countPlayersLive();
	
	if (ctx.isDonkBet()) {
		if (!POSTFLOP_ALLOW_DONK_FOCUS_TREE) {
			if (!POSTFLOP_ALLOW_DONK_PREV_AGGRESSION_FOCUS_TREE || Array.from(ctx.getActionSequenceFull()).findIndex(pa => pa.getPlayer() == player && pa.getActionType() == RAISE) < 0)
				return [];
		}
        else if (livePlayers > ALLOWED_DONK_PLAYERS_COUNT_FOCUS_TREE) {
            return [];
        }
		else {
			return [ctx.sizingPot(POSTFLOP_DONK_BET_SIZE_FOCUS_TREE)]
		}
}	
  
    let sizings = (livePlayers == 2) ?
        POSTFLOP_PRIMARY_HINT_HEADS_UP_FOCUS_TREE.map(hint => ctx.sizingGeometricHint(hint)) :
        POSTFLOP_PRIMARY_HINT_MULTIWAY_FOCUS_TREE.map(hint => ctx.sizingGeometricHint(hint));

    if (ctx.getStreet() == FLOP && ctx.getBetCount() == 0) {
        sizings.push(...POSTFLOP_ADD_FLOP_BET_POT_FOCUS_TREE.map(s => ctx.sizingPot(s)));
        let raise = ctx.getLastRaiseAction();
        if (raise != null && raise.getPlayer() == player)
            sizings.push(...POSTFLOP_ADD_FLOP_CBET_POT_FOCUS_TREE.map(s => ctx.sizingPot(s)));
    }

    if (ctx.getStackPotRatio() <= POSTFLOP_ADD_ALLIN_SPR)
        sizings.push(ctx.sizingAllIn());

    return sizings;
}



//*******************************************************************************************************************************************
//ClosingAction
//*******************************************************************************************************************************************
function isClosingActionPreflop(ctx) {
    let player = ctx.getActivePlayer();

    if (ctx.getBetCount() == 1)
        return player == ctx.getPlayerIndexBigBlind();

    let maxactive = 0;
    let state = ctx.getPotState();
    let otherplayers = [];
    for (let p = 0; p < ctx.getNumberOfPlayers(); p++)
        if (!state.hasPlayerFolded(p) && p != player) {
            otherplayers.push(p);
            maxactive = Math.max(maxactive, state.getChipsActive(p));
        }

    for (let p of otherplayers)
        if (!state.isPlayerAllIn(p) && state.getChipsActive(p) < maxactive)
            return false;

    return true;
}



//*******************************************************************************************************************************************
//NextStreetBetting
//*******************************************************************************************************************************************
function hasNextStreetBetting(ctx) {
    let live = ctx.getPotState().countPlayersLive();
    if (POSTFLOP_FORCE_CHECKDOWN_AFTER[live] === undefined)
        return true; // Default to true if not specified
    return ctx.getStreet() < POSTFLOP_FORCE_CHECKDOWN_AFTER[live];
}



//*******************************************************************************************************************************************
//ColdCall
//*******************************************************************************************************************************************
function isColdCall(ctx) {
    if (ctx.getBetCount() <= 2)
        return false;
    for (let action of Array.from(ctx.getActionSequence()))
        if (action.getPlayer() == ctx.getActivePlayer())
            return false;
    return true;
}



//*******************************************************************************************************************************************
//FocusTree
//*******************************************************************************************************************************************
function isFocusTree(ctx) {
	if (!USE_FOCUS_TREE) {
        return false;
    }
    const specialTreePosition = (ctx.getPlayerIndexButton() + ctx.getNumberOfPlayers() + FOCUS_TREE_POSITION) % ctx.getNumberOfPlayers();
    return Array.from(ctx.getActionSequence(PREFLOP)).some(action =>
        action.getPlayer() === specialTreePosition && (action.getActionType() !== FOLD && action.getActionType() !== CALL));
}
