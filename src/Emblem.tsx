import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop } from 'react-native-svg';
import { driveWheel, meshWith, outerRadius, pitchRadius, rootRadius, TAU, turnsUntilRepeat, type Gear } from './gearTrain';
import { PHASE_COLOURS } from './palette';
import { useReduceMotion } from './useReduceMotion';

// The Emblem is drawn in units spanning -110..110, y down.
const VIEW = 220;
const WIDTH_SHARE = 0.72;
/** Cut from the wallpaper by scripts/cut-emblem-frame.py; it spans the Emblem's -110..110. */
const FRAME = require('../assets/emblem-frame.png');
/** One turn of the taiji a minute: 6° a second. */
const TAIJI_TURN_MS = 60_000;
/** The taiji's radius, and its silver bezel's; the drive wheel's teeth show just outside the bezel. */
const TAIJI = { radius: 34.5, bezel: 37 };
/** The plate under the gears, shading to dark at the frame's inner edge and reaching just under it. */
const PLATE = { shadedTo: 77, radius: 80 };
const EDGE = '#1a1a1a';

type Tier = 'upper' | 'lower';
type Wheel = { gear: Gear; spokes: number; tier: Tier };

/**
 * The wallpaper's layout: a fine-toothed wheel under the taiji drives a ring of
 * gears at the wallpaper's positions; the small upper-left pair and the
 * upper-right pair are driven through their neighbours. A darker lower tier,
 * half hidden, meshes with the drive wheel's own lower tier, so it overlaps the
 * upper gears rather than colliding with them, and no plate shows between them.
 */
function wallpaperTrain() {
  const drive = driveWheel(48, 1.6);
  const left = meshWith(drive, 18, 180);
  const top = meshWith(drive, 24, -98);
  const upperLeft = meshWith(left, 14, -95);
  const upperRight = meshWith(top, 16, 0);
  const upper = (gear: Gear, spokes: number): Wheel => ({ gear, spokes, tier: 'upper' });
  const wheels: Wheel[] = [
    ...[-140, -32, 20, 68, 118, 162].map((angle): Wheel => ({ gear: meshWith(drive, 30, angle), spokes: 6, tier: 'lower' })),
    upper(top, 5),
    upper(meshWith(drive, 24, -5), 6),
    upper(meshWith(drive, 22, 45), 5),
    upper(meshWith(drive, 24, 94), 6),
    upper(meshWith(drive, 16, 141), 5),
    upper(left, 5),
    upper(upperLeft, 4),
    upper(meshWith(upperLeft, 12, -45), 4),
    upper(upperRight, 6),
    upper(meshWith(upperRight, 12, 25), 4),
  ];
  return { drive, wheels, repeatTurns: turnsUntilRepeat([drive, ...wheels.map((w) => w.gear)]) };
}

const TRAIN = wallpaperTrain();

/**
 * The turning mechanism above the setup cards: the wallpaper's own case over
 * drawn gears. The taiji turns clockwise in one even sweep and every gear
 * follows at its tooth ratio. It holds still under Reduce Motion or while not
 * `turning`, and lets touches through to the screen.
 */
export function Emblem({ turning }: { turning: boolean }) {
  const { width } = useWindowDimensions();
  const size = width * WIDTH_SHARE;
  const scale = size / VIEW;
  const reduceMotion = useReduceMotion();
  // How many times the taiji has turned: where it rested, plus how far it has swept since.
  const restedTurns = useRef(0);
  const rested = useRef(new Animated.Value(0)).current;
  const swept = useRef(new Animated.Value(0)).current;
  const turns = useRef(Animated.add(rested, swept)).current;
  // Where the last sweep stopped comes back from the native side later. A new
  // sweep waits for it, or resetting `swept` would stop the new sweep.
  const settled = useRef(Promise.resolve());

  // One long native animation, so the sweep never hitches. It runs until every
  // gear has come round whole, so starting over doesn't show. Until the Reduce
  // Motion setting is known, the Emblem holds still.
  useEffect(() => {
    if (reduceMotion !== false || !turning) return;
    let animation: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    settled.current.then(() => {
      if (cancelled) return;
      animation = Animated.loop(
        Animated.timing(swept, {
          toValue: TRAIN.repeatTurns,
          duration: TRAIN.repeatTurns * TAIJI_TURN_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
    });
    return () => {
      cancelled = true;
      if (!animation) return;
      animation.stop();
      // Should it start again, it sweeps on from where it stopped.
      settled.current = new Promise((resolve) =>
        swept.stopAnimation((value) => {
          restedTurns.current = (restedTurns.current + value) % TRAIN.repeatTurns;
          rested.setValue(restedTurns.current);
          swept.setValue(0);
          resolve();
        }),
      );
    };
  }, [reduceMotion, turning, rested, swept]);

  const rotation = (gear: Gear) => ({
    rotate: turns.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', `${gear.ratio * 360}deg`],
      extrapolate: 'extend',
    }),
  });

  const wheelStyle = (gear: Gear) => {
    const r = outerRadius(gear);
    return {
      position: 'absolute' as const,
      left: (gear.x - r + VIEW / 2) * scale,
      top: (gear.y - r + VIEW / 2) * scale,
      width: 2 * r * scale,
      height: 2 * r * scale,
      transform: [rotation(gear)],
    };
  };

  return (
    <View style={[styles.emblem, { width: size, height: size }]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} viewBox={`${-VIEW / 2} ${-VIEW / 2} ${VIEW} ${VIEW}`}>
        <Defs>
          <RadialGradient id="plate" cx="0" cy="0" r={PLATE.shadedTo} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#707070" />
            <Stop offset="1" stopColor="#3c3c3c" />
          </RadialGradient>
        </Defs>
        <Circle r={PLATE.radius} fill="url(#plate)" />
      </Svg>
      {TRAIN.wheels.map((wheel, i) => (
        <Animated.View key={i} style={wheelStyle(wheel.gear)}>
          <WheelDrawing {...wheel} />
        </Animated.View>
      ))}
      <Animated.View style={wheelStyle(TRAIN.drive)}>
        <DriveWheelDrawing gear={TRAIN.drive} />
      </Animated.View>
      <Image source={FRAME} style={[styles.frame, { width: size, height: size }]} resizeMode="stretch" />
    </View>
  );
}

const rimRadius = (gear: Gear) => rootRadius(gear) - 1.4 * gear.module;
const hubRadius = (gear: Gear) => Math.max(2.2, 0.22 * pitchRadius(gear));

const point = (r: number, angle: number) => `${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`;
const circlePath = (r: number) => `M${r},0 A${r},${r} 0 1 0 ${-r},0 A${r},${r} 0 1 0 ${r},0 Z`;

/** The toothed outline about the gear's own centre, at rest. */
function toothPath(gear: Gear) {
  const pitch = TAU / gear.teeth;
  const tip = outerRadius(gear);
  const root = rootRadius(gear);
  const points: string[] = [];
  for (let k = 0; k < gear.teeth; k++) {
    const c = gear.toothAngle + k * pitch;
    points.push(point(root, c - 0.27 * pitch), point(tip, c - 0.15 * pitch), point(tip, c + 0.15 * pitch), point(root, c + 0.27 * pitch));
  }
  return `M${points.join(' L')} Z`;
}

function spokesPath(gear: Gear, spokes: number) {
  const parts: string[] = [];
  for (let k = 0; k < spokes; k++) {
    const angle = gear.toothAngle + (k * TAU) / spokes;
    parts.push(`M${point(hubRadius(gear), angle)} L${point(rimRadius(gear), angle)}`);
  }
  return parts.join(' ');
}

/** The taiji's black half, drawn over a white disc of radius `r`. */
function taijiBlackPath(r: number) {
  const h = r / 2;
  return `M0,${-r} A${r},${r} 0 0 1 0,${r} A${h},${h} 0 0 1 0,0 A${h},${h} 0 0 0 0,${-r} Z`;
}

const SILVER: Record<Tier, { turned: string[]; screw: string }> = {
  upper: { turned: ['#f4f4f4', '#d2d2d2', '#a8a8a8', '#e6e6e6', '#8a8a8a'], screw: '#dcdcdc' },
  /** In shadow under the upper gears. */
  lower: { turned: ['#9c9c9c', '#848484', '#6c6c6c', '#8e8e8e', '#555555'], screw: '#8a8a8a' },
};
const SILVER_OFFSETS = [0, 0.45, 0.75, 0.92, 1];

/** Silver turned about its own centre: concentric, so the light stays put as the part turns. */
function TurnedSilver({ id, tier }: { id: string; tier: Tier }) {
  return (
    <RadialGradient id={id} cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5" gradientUnits="objectBoundingBox">
      {SILVER[tier].turned.map((colour, i) => (
        <Stop key={i} offset={SILVER_OFFSETS[i]} stopColor={colour} />
      ))}
    </RadialGradient>
  );
}

/** Draws `children` in the gear's own units, centred on its axle. */
function GearSvg({ gear, tier, children }: { gear: Gear; tier: Tier; children: ReactNode }) {
  const r = outerRadius(gear);
  return (
    <Svg width="100%" height="100%" viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
      <Defs>
        <TurnedSilver id="silver" tier={tier} />
      </Defs>
      {children}
    </Svg>
  );
}

function WheelDrawing({ gear, spokes, tier }: Wheel) {
  const hub = hubRadius(gear);
  const screw = hub * 0.55;
  const slot = gear.toothAngle + Math.PI / 4;
  const spokeLines = spokesPath(gear, spokes);
  return (
    <GearSvg gear={gear} tier={tier}>
      <Path
        d={`${toothPath(gear)} ${circlePath(rimRadius(gear))}`}
        fill="url(#silver)"
        fillRule="evenodd"
        stroke={EDGE}
        strokeWidth={0.45}
        strokeLinejoin="round"
      />
      <Path d={spokeLines} stroke={EDGE} strokeWidth={gear.module * 1.5 + 0.9} strokeLinecap="round" />
      <Path d={spokeLines} stroke="#c9c9c9" strokeWidth={gear.module * 1.5} strokeLinecap="round" />
      <Circle r={hub} fill="url(#silver)" stroke={EDGE} strokeWidth={0.45} />
      <Circle r={screw} fill={SILVER[tier].screw} stroke={EDGE} strokeWidth={0.4} />
      <Line
        x1={-screw * Math.cos(slot)}
        y1={-screw * Math.sin(slot)}
        x2={screw * Math.cos(slot)}
        y2={screw * Math.sin(slot)}
        stroke={EDGE}
        strokeWidth={0.6}
      />
    </GearSvg>
  );
}

/** The drive wheel, with the taiji in its silver bezel; its halves are the White and Black phase colours. */
function DriveWheelDrawing({ gear }: { gear: Gear }) {
  const { radius, bezel } = TAIJI;
  const white = PHASE_COLOURS.white.background;
  const black = PHASE_COLOURS.black.background;
  return (
    <GearSvg gear={gear} tier="upper">
      <Path d={toothPath(gear)} fill="url(#silver)" stroke={EDGE} strokeWidth={0.45} strokeLinejoin="round" />
      <Circle r={bezel} fill="url(#silver)" stroke={EDGE} strokeWidth={0.5} />
      <Circle r={radius} fill={white} stroke={EDGE} strokeWidth={0.6} />
      <Path d={taijiBlackPath(radius)} fill={black} />
      <Circle cy={radius / 2} r={radius * 0.14} fill={white} />
      <Circle cy={-radius / 2} r={radius * 0.14} fill={black} />
    </GearSvg>
  );
}

const styles = StyleSheet.create({
  emblem: {
    alignSelf: 'center',
    marginBottom: 28,
  },
  // Sized explicitly: an Image left to fill takes its own pixel size.
  frame: { position: 'absolute', left: 0, top: 0 },
});
