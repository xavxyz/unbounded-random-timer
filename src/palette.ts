import type { Phase } from './sessionClock';

export type Colours = {
  background: string;
  /** For the round number, the elapsed time and the hint. */
  ink: string;
  statusBar: 'dark' | 'light';
};

/** The idle screen, which becomes the setup screen. */
export const SETUP_GREY: Colours = {
  background: '#7A7A7A',
  ink: 'rgba(255,255,255,0.9)',
  statusBar: 'light',
};

export const PHASE_COLOURS: Record<Phase, Colours> = {
  white: { background: '#FFFFFF', ink: 'rgba(0,0,0,0.9)', statusBar: 'dark' },
  black: { background: '#000000', ink: 'rgba(255,255,255,0.9)', statusBar: 'light' },
};

/** How long the screen takes to move to new colours. */
export const COLOUR_FADE_MS = 1000;
