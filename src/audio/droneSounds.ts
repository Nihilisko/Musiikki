// Drone tones C3 (MIDI 48) to F♯4 (66): soft organ loops made for the app. Each file holds a
// whole number of cycles of every partial, so it loops without a click.
// (require() needs a fixed path, so every file is listed.)

export const DRONE_SOUNDS: Record<number, number> = {
  48: require('../../assets/sounds/drone/c3.wav'),
  49: require('../../assets/sounds/drone/cs3.wav'),
  50: require('../../assets/sounds/drone/d3.wav'),
  51: require('../../assets/sounds/drone/ds3.wav'),
  52: require('../../assets/sounds/drone/e3.wav'),
  53: require('../../assets/sounds/drone/f3.wav'),
  54: require('../../assets/sounds/drone/fs3.wav'),
  55: require('../../assets/sounds/drone/g3.wav'),
  56: require('../../assets/sounds/drone/gs3.wav'),
  57: require('../../assets/sounds/drone/a3.wav'),
  58: require('../../assets/sounds/drone/as3.wav'),
  59: require('../../assets/sounds/drone/b3.wav'),
  60: require('../../assets/sounds/drone/c4.wav'),
  61: require('../../assets/sounds/drone/cs4.wav'),
  62: require('../../assets/sounds/drone/d4.wav'),
  63: require('../../assets/sounds/drone/ds4.wav'),
  64: require('../../assets/sounds/drone/e4.wav'),
  65: require('../../assets/sounds/drone/f4.wav'),
  66: require('../../assets/sounds/drone/fs4.wav'),
};

/** The lowest drone note (C3). Roots are played from here up to B3. */
export const DRONE_LOW = 48;
