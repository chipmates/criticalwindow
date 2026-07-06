/**
 * All displayed prose of the printable paper kit. Kept out of the generator
 * so the words are reviewable in one place. House voice rules apply to every
 * string here: short sentences, no em dashes, human tone.
 *
 * Numbers in RULES_* constants are paper-scale v0 printed guesses. The board
 * thresholds move into data/parameters.json when the endings evaluator lands
 * (the paper kit build); the print script then reads them from data like everything else.
 */

export const KIT_TITLE = 'Critical Window';
export const KIT_SUBTITLE = 'paper prototype kit (working title, v0)';

export const COVER_NOTES = [
  'Print single-sided on plain A4. Cardstock helps for the two card pages but is optional.',
  'Cut the cards along the light gray lines. Cards are 60 by 85 mm.',
  'You need: two ten-sided dice in different colors, a pencil, one envelope, 30 to 45 minutes.',
  'The board sheet is your save file. Mark tracks with pencil, erase as they move.',
  'Sources are printed on every card. Every number in this game cites one. When you disagree with a number, that is a conversation we want: the repository takes issues.',
];

export const COMPONENTS_LIST = [
  '1 board sheet (tracks, race strip, turn track, flags)',
  '12 event cards in three era decks',
  '8 policy cards (they form the rack, all face up)',
  '1 reference card page (turn order and world tables)',
  '1 envelope page (hidden dice slip and lookup tables)',
  '2 rules pages',
];

// ---------------------------------------------------------------------------
// Rules sheet (2 pages)
// ---------------------------------------------------------------------------

export const RULES_INTRO =
  'You govern the United States from mid 2026 into the 2030s. Somewhere ahead of you is a ' +
  'threshold where AI systems become powerful enough to decide how this story ends. You do not ' +
  'know how hard it is to cross that line safely. Nobody does. That is the game.';

export const RULES_GOAL =
  'Steer to a good ending. There are five. Most first runs do not find the good ones. ' +
  'The game takes 10 turns, each about half a year, unless an ending arrives early.';

export const RULES_SETUP: string[] = [
  'Lay out the board, the three era decks (shuffle each), the policy rack, the reference card.',
  'Mark every track at the printed start value (the small triangle on each track).',
  'The envelope: roll d10 twice WITHOUT LOOKING at the results. Have a friend note the two digits on the slip, first digit is Alignment Difficulty, second is Takeoff Steepness. Seal it. Solo: use different-colored dice, roll both without looking and tip them straight in; the darker die is Alignment Difficulty, the lighter is Takeoff Steepness. Seal it. You govern without knowing what is inside.',
  'Check the flag row is all unchecked. Put a pencil mark on turn 1.',
];

export const RULES_TURN_PHASES: Array<{ name: string; text: string }> = [
  {
    name: '1. Upkeep',
    text: 'Resolve every card tucked under the current turn slot: apply its delayed line, then discard it (policies return to the rack instead). Grid limit: if Compute exceeds Energy by 7 or more, Compute drops by 1.',
  },
  {
    name: '2. Research allocation',
    text: 'Read your R&D points from the reference table (it depends on Compute plus Talent). Split them between Capability, Safety and Diffusion by writing the three numbers in the turn boxes. Convert with the reference tables immediately: Capability and Safety Insight move now. Diffusion converts during World Update.',
  },
  {
    name: '3. One policy',
    text: 'Play at most one policy card from the rack. Pay its cost (move the tracks), apply its effects, check its gate line first. If it has a delayed line, tuck it under the future turn slot. If it has a cooldown, it comes back when the marker reaches that slot. You may pass.',
  },
  {
    name: '4. Event',
    text: 'Draw one card from the current era deck (turn 1 to 3 early, 4 to 7 mid, 8 to 10 late). If its condition line does not hold, discard and draw the next. Read it aloud. Choose one option, apply it, tuck any delayed line under the future turn slot.',
  },
  {
    name: '5. World update',
    text: 'Run the reference card top to bottom: rival moves by posture, then posture check, then society, then election on turn 5, then ending check. This phase runs itself. Do not negotiate with it.',
  },
  {
    name: '6. Eval report (optional, free)',
    text: 'Look up your band width from the eval table. That width around your unknown true alignment is all your safety teams can tell you. A narrow band is the only comfort this game sells.',
  },
  {
    name: '7. Advance',
    text: 'Move the turn marker. On turn 10 the run ends and the envelope opens (Endgame, rules page 2).',
  },
];

export const RULES_ENDGAME_TITLE = 'Endgame: opening the envelope';

export const RULES_ENDGAME: string[] = [
  'The envelope opens at the end of turn 10, or immediately when a capability marker reaches 20.',
  'Read the two digits. Look them up in the preset table on the envelope page: they give Alignment Difficulty and a Steepness modifier.',
  'Your Alignment Score = Safety Insight, plus every Endgame modifier you noted in the modifier box during play, minus the Steepness modifier.',
  'If your Capability is 16 or higher (inside the fog zone): Alignment Score >= Difficulty means Flourishing. Alignment Score < Difficulty means Misaligned Catastrophe. You had the capability. The question was always whether you understood it.',
  'If your Capability is below 16: nobody crossed. Read the Unresolved 2030 note on the reference card. The window stayed open past this game.',
];

export const RULES_ENDINGS_EARLY: string[] = [
  'Societal Breakdown: the moment Unrest reaches 16, the run ends. The country broke before the AI question resolved.',
  'Outpaced: the moment Rival Capability reaches 20, the run ends. Open the envelope anyway to see the world they built.',
  'Negotiated Slowdown: if the Treaty Channel flag is set, Rival Trust is 14 or higher, and you play Compute Treaty Feeler again to sign, the race stops on your terms. Expensive, slower, alive.',
];

export const RULES_READING =
  'Reading a card: costs and gates sit on the top line. Effects move tracks by the printed amount. ' +
  'A line marked with an hourglass is delayed: tuck the card under the turn slot that many turns ' +
  'ahead and apply it then. Endgame lines go into the modifier box on the board the moment the card resolves.';

export const RULES_HONESTY =
  'Design note, worth reading once: every number here cites the sources printed on the cards. ' +
  'The dice inside the envelope are rolled inside ranges that real researchers argue about. ' +
  'If the run feels unfair, that is worth sitting with. It is not the cards.';

// ---------------------------------------------------------------------------
// Reference card: world tables (paper v0 constants)
// ---------------------------------------------------------------------------

export const REF_RIVAL_MOVES: Array<{ posture: string; text: string }> = [
  {
    posture: 'RACE',
    text: 'Rival Capability +2. Rival Trust -1.',
  },
  {
    posture: 'MIRROR',
    text: 'Rival Capability +1, and +1 more if your Capability rose by 2 or more this turn. Rival Trust +1 if you played a diplomacy-tagged card this turn.',
  },
  {
    posture: 'CAUTIOUS',
    text: 'Rival Capability +1. Rival Trust +1.',
  },
];

export const REF_POSTURE_CHECK: string[] = [
  'If Rival Trust >= 14 and the Treaty Channel flag is set: posture becomes CAUTIOUS.',
  'Else if your Capability leads Rival Capability by 4 or more: posture becomes RACE.',
  'Else if Rival Trust <= 5: posture becomes RACE.',
  'Else: posture becomes MIRROR.',
];

export const REF_SOCIETY: string[] = [
  'If Capability >= 8: Job Displacement +1. If Capability >= 14: another +1.',
  'Per 2 Diffusion points allocated this turn: choose Job Displacement -1 or Public Trust +1.',
  'If Job Displacement > Public Trust: Unrest +1. If Job Displacement >= 12: another +1.',
  'If Unrest >= 10: Public Trust -1.',
];

export const REF_ELECTION: string[] = [
  'Turn 5 only, after the society step.',
  'If Public Trust >= 8 and Unrest <= 8: Political Capital +2. The country renews your mandate.',
  'Otherwise: Political Capital -2. Govern angrier.',
];

export const REF_ENDING_CHECK: string[] = [
  'Unrest at 16 or more: Societal Breakdown, immediately.',
  'Rival Capability at 20: Outpaced, immediately.',
  'Your Capability at 20: the envelope opens now (Endgame rules).',
  'Treaty signed (see rules): Negotiated Slowdown.',
];

export const REF_UNRESOLVED =
  'No ending by turn 10 and nobody in the fog zone. The window did not close ' +
  'in this half decade. Look at your tracks: whichever is nearest its cliff is the story of the ' +
  '2030s you set up. Neither racing nor pausing won. The grind continues, and so does the choice.';

export const REF_CONVERSION_NOTES: string[] = [
  'Capability from allocation: 0 to 1 points +0, 2 to 5 points +1, 6 or more +2.',
  'Safety Insight from allocation: +1 per 2 points.',
  'Diffusion converts in the society step (see World Update).',
];

// ---------------------------------------------------------------------------
// Envelope page
// ---------------------------------------------------------------------------

export const ENVELOPE_TITLE = 'The Envelope';

export const ENVELOPE_INSTRUCTIONS: string[] = [
  'Cut out the slip below. At setup, roll d10 twice without anyone seeing the results.',
  'A second person writes the two digits on the slip and seals it. Solo: different-colored dice, unseen, darker = Alignment Difficulty.',
  'First digit: Alignment Difficulty. Second digit: Takeoff Steepness.',
  'The envelope stays sealed until the Endgame. Every decision you make before that is made under exactly the uncertainty the real world has.',
];

export const ENVELOPE_SLIP_LABELS = {
  difficulty: 'Alignment Difficulty digit (0-9):',
  steepness: 'Takeoff Steepness digit (0-9):',
  preset: 'World preset:',
};

export const ENVELOPE_TABLE_NOTE =
  'At Endgame, find your preset row. Your difficulty digit maps to the Difficulty your Alignment ' +
  'Score must reach. Your steepness digit maps to the modifier you subtract from the score. ' +
  'Different worldviews, different odds. All three tables are honest about their sources.';
