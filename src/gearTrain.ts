/**
 * The maths of a train of spur gears, independent of how they're drawn.
 * Coordinates are y down, as on screen, so a positive angle turns clockwise.
 */
export type Gear = {
  teeth: number;
  /** Pitch-circle diameter per tooth: meshing gears share it. */
  module: number;
  /** Centre. */
  x: number;
  y: number;
  /** The angle of a tooth's centre at rest, in radians. */
  toothAngle: number;
  /** Turns per turn of the drive wheel; negative turns the other way. */
  ratio: number;
};

export const TAU = 2 * Math.PI;

export const pitchRadius = (gear: Gear) => (gear.module * gear.teeth) / 2;
/** Where the tips of the teeth reach: one module past the pitch circle. */
export const outerRadius = (gear: Gear) => pitchRadius(gear) + gear.module;
/** Where the gaps between the teeth bottom out: a quarter-module deeper than the teeth stand, for clearance. */
export const rootRadius = (gear: Gear) => pitchRadius(gear) - 1.25 * gear.module;

/** The wheel that drives the train, centred on the origin. */
export function driveWheel(teeth: number, module: number): Gear {
  return { teeth, module, x: 0, y: 0, toothAngle: 0, ratio: 1 };
}

/** A gear meshing with `parent`, its centre `angleDegrees` round from the parent's. */
export function meshWith(parent: Gear, teeth: number, angleDegrees: number): Gear {
  const angle = (angleDegrees * Math.PI) / 180;
  const distance = (parent.module * (parent.teeth + teeth)) / 2;
  // Where the contact falls between the parent's teeth, as a fraction of a tooth pitch.
  // The gears' teeth run opposite ways round the contact, so this gear's gap goes
  // the same fraction back from its own tooth.
  const parentPitch = TAU / parent.teeth;
  const past = (angle - parent.toothAngle) / parentPitch;
  const fraction = past - Math.floor(past);
  return {
    teeth,
    module: parent.module,
    x: parent.x + distance * Math.cos(angle),
    y: parent.y + distance * Math.sin(angle),
    toothAngle: angle + Math.PI - (0.5 - fraction) * (TAU / teeth),
    ratio: (-parent.ratio * parent.teeth) / teeth,
  };
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * The fewest whole turns of the drive wheel that bring every gear back to where
 * it began, so turning can loop without a jump.
 */
export function turnsUntilRepeat(gears: Gear[]) {
  return gears.reduce((turns, gear) => {
    // A gear turns the drive wheel's teeth over its own, whatever lies between,
    // so its ratio times its teeth is whole.
    const driveTeeth = Math.round(Math.abs(gear.ratio) * gear.teeth);
    const turnsToComeRound = gear.teeth / gcd(driveTeeth, gear.teeth);
    return (turns * turnsToComeRound) / gcd(turns, turnsToComeRound);
  }, 1);
}
