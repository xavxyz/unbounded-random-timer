/** The two phases of a round, each named after its background colour. */
export type Phase = 'white' | 'black';

/** The shortest and longest duration a phase can draw, in whole seconds. */
export type Bounds = { minSeconds: number; maxSeconds: number };
