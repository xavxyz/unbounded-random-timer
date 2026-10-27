import type { Phase } from './phase';

export type Colours = {
  background: string;
  /** For the round number, the elapsed time and the hint. */
  ink: string;
  statusBar: 'dark' | 'light';
};

/** The idle screen, which becomes the setup screen: the wallpaper's own near-black, so the Emblem's frame disappears into it. */
export const SETUP_COLOURS: Colours = {
  background: '#202020',
  ink: 'rgba(255,255,255,0.9)',
  statusBar: 'light',
};

export const PHASE_COLOURS: Record<Phase, Colours> = {
  white: { background: '#FFFFFF', ink: 'rgba(0,0,0,0.9)', statusBar: 'dark' },
  black: { background: '#000000', ink: 'rgba(255,255,255,0.9)', statusBar: 'light' },
};

/** How long the screen takes to move to new colours. */
export const COLOUR_FADE_MS = 1000;
