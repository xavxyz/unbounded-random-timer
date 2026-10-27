import { driveWheel, meshWith, turnsUntilRepeat, type Gear } from './gearTrain';

describe('gear train', () => {
  it('sets a meshing pair apart by the sum of their pitch radii', () => {
    // Module 2: a 48-tooth wheel has a pitch radius of 48, a 24-tooth one of 24.
    const drive = driveWheel(48, 2);
    const right = meshWith(drive, 24, 0);
    expect(right.x).toBeCloseTo(72);
    expect(right.y).toBeCloseTo(0);
    const below = meshWith(drive, 12, 90);
    expect(below.x).toBeCloseTo(0);
    expect(below.y).toBeCloseTo(60);
  });

  it('turns each gear down a chain the other way from the last, at the drive wheel’s teeth over its own', () => {
    const drive = driveWheel(48, 2);
    const second = meshWith(drive, 24, 0);
    const third = meshWith(second, 16, 90);
    const fourth = meshWith(third, 12, 180);
    expect(drive.ratio).toBe(1);
    expect(second.ratio).toBeCloseTo(-2);
    expect(third.ratio).toBeCloseTo(3);
    expect(fourth.ratio).toBeCloseTo(-4);
  });

  describe('teeth', () => {
    const degrees = (d: number) => (d * Math.PI) / 180;
    /**
     * Where `direction` falls between a gear's teeth once the drive wheel has turned
     * `driveTurned` radians, as a fraction of a tooth pitch: 0 is a tooth's centre, 0.5 a gap's.
     */
    const pitchFraction = (gear: Gear, direction: number, driveTurned = 0) => {
      const v = (direction - gear.toothAngle - gear.ratio * driveTurned) / ((2 * Math.PI) / gear.teeth);
      return v - Math.floor(v);
    };
    const expectFraction = (actual: number, expected: number) =>
      // 0 and 1 are the same place.
      expect(Math.min(Math.abs(actual - expected), 1 - Math.abs(actual - expected))).toBeCloseTo(0);

    it('puts a gap where the neighbour has a tooth', () => {
      const drive = driveWheel(48, 2);
      const right = meshWith(drive, 24, 0);
      expectFraction(pitchFraction(drive, 0), 0);
      expectFraction(pitchFraction(right, degrees(180)), 0.5);
    });

    it('puts the gap to match wherever the neighbour’s teeth fall at the contact', () => {
      // A 48-tooth wheel's pitch is 7.5°: at 10° round, the contact is a third of the way past a tooth.
      const drive = driveWheel(48, 2);
      const gear = meshWith(drive, 18, 10);
      expectFraction(pitchFraction(drive, degrees(10)), 1 / 3);
      // The neighbour's teeth run the other way round the contact: a tooth lies a third of a pitch
      // past the gap's centre on the drive wheel's side, so the gap sits a sixth past its own tooth.
      expectFraction(pitchFraction(gear, degrees(190)), 1 / 6);
    });

    it('keeps every tooth in its gap down a chain as the train turns', () => {
      const drive = driveWheel(48, 2);
      const second = meshWith(drive, 22, -37);
      const third = meshWith(second, 14, 61);
      for (const turned of [0, 0.3, 1.7, 12]) {
        const atDrive = pitchFraction(drive, degrees(-37), turned);
        expectFraction(atDrive + pitchFraction(second, degrees(143), turned), 0.5);
        const atSecond = pitchFraction(second, degrees(61), turned);
        expectFraction(atSecond + pitchFraction(third, degrees(241), turned), 0.5);
      }
    });
  });

  describe('turns until the train repeats', () => {
    it('is one turn when every gear divides the drive wheel', () => {
      const drive = driveWheel(48, 2);
      expect(turnsUntilRepeat([drive, meshWith(drive, 24, 0), meshWith(drive, 12, 90)])).toBe(1);
    });

    it('waits for every gear to come round whole', () => {
      // 22 teeth turn 24/11 times a turn, 18 teeth 8/3 times: both whole after 33 turns.
      const drive = driveWheel(48, 2);
      const gears = [drive, meshWith(drive, 22, 0), meshWith(drive, 18, 90)];
      expect(turnsUntilRepeat(gears)).toBe(33);
    });

    it('goes by the last gear’s teeth, not the chain’s', () => {
      // An idler doesn't change the ratio: 48 to 22 through a 7 still repeats after 11 turns.
      const drive = driveWheel(48, 2);
      expect(turnsUntilRepeat([drive, meshWith(meshWith(drive, 7, 0), 22, 0)])).toBe(11);
    });
  });
});
