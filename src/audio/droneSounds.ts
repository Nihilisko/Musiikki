// Drone tones C3 (MIDI 48) to F♯4 (66): soft organ tones made for the app. Each note has two
// versions with different partial phases; they are started in turn and fade into each other,
// so the sound never stops (a player's own looping leaves a small gap on some platforms).
// (require() needs a fixed path, so every file is listed.)

export const DRONE_SOUNDS: Record<number, [number, number]> = {
  48: [
    require('../../assets/sounds/drone/c3_a.wav'),
    require('../../assets/sounds/drone/c3_b.wav'),
  ],
  49: [
    require('../../assets/sounds/drone/cs3_a.wav'),
    require('../../assets/sounds/drone/cs3_b.wav'),
  ],
  50: [
    require('../../assets/sounds/drone/d3_a.wav'),
    require('../../assets/sounds/drone/d3_b.wav'),
  ],
  51: [
    require('../../assets/sounds/drone/ds3_a.wav'),
    require('../../assets/sounds/drone/ds3_b.wav'),
  ],
  52: [
    require('../../assets/sounds/drone/e3_a.wav'),
    require('../../assets/sounds/drone/e3_b.wav'),
  ],
  53: [
    require('../../assets/sounds/drone/f3_a.wav'),
    require('../../assets/sounds/drone/f3_b.wav'),
  ],
  54: [
    require('../../assets/sounds/drone/fs3_a.wav'),
    require('../../assets/sounds/drone/fs3_b.wav'),
  ],
  55: [
    require('../../assets/sounds/drone/g3_a.wav'),
    require('../../assets/sounds/drone/g3_b.wav'),
  ],
  56: [
    require('../../assets/sounds/drone/gs3_a.wav'),
    require('../../assets/sounds/drone/gs3_b.wav'),
  ],
  57: [
    require('../../assets/sounds/drone/a3_a.wav'),
    require('../../assets/sounds/drone/a3_b.wav'),
  ],
  58: [
    require('../../assets/sounds/drone/as3_a.wav'),
    require('../../assets/sounds/drone/as3_b.wav'),
  ],
  59: [
    require('../../assets/sounds/drone/b3_a.wav'),
    require('../../assets/sounds/drone/b3_b.wav'),
  ],
  60: [
    require('../../assets/sounds/drone/c4_a.wav'),
    require('../../assets/sounds/drone/c4_b.wav'),
  ],
  61: [
    require('../../assets/sounds/drone/cs4_a.wav'),
    require('../../assets/sounds/drone/cs4_b.wav'),
  ],
  62: [
    require('../../assets/sounds/drone/d4_a.wav'),
    require('../../assets/sounds/drone/d4_b.wav'),
  ],
  63: [
    require('../../assets/sounds/drone/ds4_a.wav'),
    require('../../assets/sounds/drone/ds4_b.wav'),
  ],
  64: [
    require('../../assets/sounds/drone/e4_a.wav'),
    require('../../assets/sounds/drone/e4_b.wav'),
  ],
  65: [
    require('../../assets/sounds/drone/f4_a.wav'),
    require('../../assets/sounds/drone/f4_b.wav'),
  ],
  66: [
    require('../../assets/sounds/drone/fs4_a.wav'),
    require('../../assets/sounds/drone/fs4_b.wav'),
  ],
};

/** The lowest drone note (C3). Roots are played from here up to B3. */
export const DRONE_LOW = 48;

/** A new version starts every DRONE_LOOP_MS; each file lasts that plus DRONE_OVERLAP_MS. */
export const DRONE_LOOP_MS = 3000;
export const DRONE_OVERLAP_MS = 800;
