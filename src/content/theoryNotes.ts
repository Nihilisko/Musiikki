// Short theory notes. Each one explains one idea, gives an example and links to the screen
// where it can be seen and played.

import type { Href } from 'expo-router';

export type TheoryNote = {
  id: string;
  title: string;
  /** The main idea in one sentence. */
  summary: string;
  paragraphs: string[];
  example?: string;
  link?: { label: string; href: Href };
};

export type TheorySection = { title: string; notes: TheoryNote[] };

export const THEORY_SECTIONS: TheorySection[] = [
  {
    title: 'Basics',
    notes: [
      {
        id: 'notes',
        title: 'Notes and semitones',
        summary: 'There are 12 different notes, and one fret is one semitone.',
        paragraphs: [
          'Music uses 12 notes: C, C♯/D♭, D, D♯/E♭, E, F, F♯/G♭, G, G♯/A♭, A, A♯/B♭, B. After B the names start again from C, one octave higher.',
          'Moving one fret up raises a note by one semitone. Twelve frets up is the same note an octave higher – that is why the 12th fret has a double dot.',
          'There is no sharp or flat between E and F, or between B and C: they are only one semitone apart.',
          'In Finnish, German and Nordic charts the note B is called H, and B♭ is called B.',
        ],
        example: 'Low E string: open E, 1st fret F, 3rd fret G, 5th fret A, 12th fret E again.',
        link: { label: 'See every note on the neck', href: { pathname: '/scales' } },
      },
      {
        id: 'intervals',
        title: 'Intervals',
        summary: 'An interval is the distance between two notes, counted in semitones.',
        paragraphs: [
          'Intervals have names that say how they sound: a minor 3rd (3 semitones) sounds sad, a major 3rd (4) bright, a perfect 5th (7) strong and open.',
          'The most useful ones: minor 2nd 1, major 2nd 2, minor 3rd 3, major 3rd 4, perfect 4th 5, tritone 6, perfect 5th 7, minor 6th 8, major 6th 9, minor 7th 10, major 7th 11, octave 12.',
          'Degrees like ♭3 or 5 in this app are intervals above the root: 1 is the root itself, ♭3 a minor 3rd above it.',
        ],
        example:
          'A power chord is just a root and a perfect 5th: A and E (5th fret low E, 7th fret A string).',
        link: {
          label: 'See the degrees of the major scale',
          href: { pathname: '/scales', params: { scale: 'Major (Ionian)', labels: 'degrees' } },
        },
      },
      {
        id: 'major-scale',
        title: 'The major scale',
        summary: 'The major scale is the pattern whole, whole, half, whole, whole, whole, half.',
        paragraphs: [
          'A whole step is two semitones (two frets), a half step one semitone. Start on any note, follow the pattern, and you get that note’s major scale.',
          'In C the pattern lands on the white keys of a piano: C D E F G A B C. In G it needs one sharp (F♯), in F one flat (B♭).',
          'Almost everything else – minor scales, modes, chords and keys – is described as changes to the major scale. That is why degrees are numbered from it.',
        ],
        example: 'G major: G (whole) A (whole) B (half) C (whole) D (whole) E (whole) F♯ (half) G.',
        link: {
          label: 'Play the major scale',
          href: { pathname: '/scales', params: { scale: 'Major (Ionian)', root: '7' } },
        },
      },
    ],
  },
  {
    title: 'Scales & modes',
    notes: [
      {
        id: 'minor-scale',
        title: 'The minor scale',
        summary: 'Natural minor lowers the 3rd, 6th and 7th of the major scale.',
        paragraphs: [
          'Degrees 1 2 ♭3 4 5 ♭6 ♭7. The ♭3 is what makes it sound minor.',
          'Every major key has a relative minor with the same notes, starting on its 6th degree: C major and A minor share all their notes.',
          'Harmonic minor raises the 7th back up (1 2 ♭3 4 5 ♭6 7). That makes the V chord major, which pulls home strongly – common in classical music and flamenco.',
        ],
        example: 'A minor: A B C D E F G – the same notes as C major, but A feels like home.',
        link: {
          label: 'Play the minor scale',
          href: { pathname: '/scales', params: { scale: 'Minor (Aeolian)', root: '9' } },
        },
      },
      {
        id: 'pentatonic',
        title: 'Pentatonic, blues and blue notes',
        summary: 'Pentatonic scales keep five notes and leave out the ones that clash.',
        paragraphs: [
          'Minor pentatonic: 1 ♭3 4 5 ♭7. Major pentatonic: 1 2 3 5 6. They leave out the half steps, so almost every note sounds good over the chords – the first scale most soloists learn.',
          'The blues scale adds the ♭5 to minor pentatonic. Blue notes (♭3, ♭5, ♭7) are the notes bent between major and minor that give blues its sound.',
          'On guitar the minor pentatonic is learned as five boxes that link up the neck.',
        ],
        example: 'A minor pentatonic box 1 at the 5th fret: the classic rock and blues shape.',
        link: {
          label: 'Play the minor blues scale',
          href: { pathname: '/scales', params: { scale: 'Minor blues', root: '9' } },
        },
      },
      {
        id: 'modes',
        title: 'The seven modes',
        summary: 'The modes use the notes of a major scale but start from a different note.',
        paragraphs: [
          'Start C major from D and you get D Dorian: the same notes, but D is home, and the sound changes.',
          'From brightest to darkest: Lydian (♯4, dreamy), Ionian (major), Mixolydian (♭7, rock and blues), Dorian (♭3 with a major 6, funky minor), Aeolian (natural minor), Phrygian (♭2, Spanish), Locrian (♭2 and ♭5, unstable).',
          'Think of each mode as a major or minor scale with one or two notes changed – that is the note that gives it its colour.',
        ],
        example: 'D Dorian: D E F G A B C. Compared with D minor, the B is natural instead of B♭.',
        link: {
          label: 'Play the Dorian mode',
          href: { pathname: '/scales', params: { scale: 'Dorian', root: '2' } },
        },
      },
    ],
  },
  {
    title: 'Chords',
    notes: [
      {
        id: 'triads',
        title: 'Building triads',
        summary: 'A triad is a root with a 3rd and a 5th stacked on top.',
        paragraphs: [
          'Major: 1 3 5 (major 3rd, then minor 3rd). Minor: 1 ♭3 5. Diminished: 1 ♭3 ♭5. Augmented: 1 3 ♯5.',
          'Sus chords replace the 3rd: sus2 (1 2 5) and sus4 (1 4 5). Without a 3rd they are neither major nor minor, and want to resolve.',
          'Every chord shape, however many strings it uses, is just these notes repeated in different octaves.',
        ],
        example: 'C major: C E G. C minor: C E♭ G. Only one note moves a semitone.',
        link: { label: 'See chord shapes', href: { pathname: '/chords' } },
      },
      {
        id: 'sevenths',
        title: 'Seventh chords',
        summary: 'A seventh chord adds a 7th on top of a triad.',
        paragraphs: [
          'Major 7 (1 3 5 7): soft and jazzy. Dominant 7 (1 3 5 ♭7): the bluesy chord that wants to go home. Minor 7 (1 ♭3 5 ♭7): smooth minor.',
          'Half-diminished (m7♭5) and diminished 7 (°7) are tense chords that lead strongly to the next one.',
          'In a major key the V chord is naturally a dominant 7 – that is why G7 leads so clearly to C.',
        ],
        example: 'G7 = G B D F. The B and F want to move to C and E – the notes of C major.',
        link: {
          label: 'See G7 shapes',
          href: { pathname: '/chords', params: { root: '7', type: '8' } },
        },
      },
      {
        id: 'inversions',
        title: 'Inversions',
        summary: 'An inversion puts a note other than the root in the bass.',
        paragraphs: [
          'Root position has the root lowest. 1st inversion has the 3rd lowest, 2nd inversion the 5th.',
          'Inversions let chords move smoothly: the bass can walk step by step (C – C/E – F) instead of jumping.',
          'On guitar, triads on three strings go up the neck in the order root position, 1st, 2nd inversion and round again.',
        ],
        example: 'C/E is C major with E in the bass.',
        link: { label: 'See triads and inversions', href: { pathname: '/triads' } },
      },
      {
        id: 'key-chords',
        title: 'Chords of a key and their jobs',
        summary: 'Each key has seven chords, and each chord has a job: rest, move or pull home.',
        paragraphs: [
          'In a major key: I ii iii IV V vi vii°. Capitals are major chords, small letters minor.',
          'Tonic chords (I, iii, vi) feel like home. Subdominant chords (ii, IV) move away. Dominant chords (V, vii°) build tension that wants to go back to I.',
          'Most songs are journeys between these three: home, away, tension, home.',
        ],
        example: 'In C: C Dm Em F G Am B°. C – F – G – C is home, away, tension, home.',
        link: { label: 'See the chords of any key', href: { pathname: '/key-chords' } },
      },
      {
        id: 'progressions',
        title: 'Common progressions',
        summary: 'A few chord progressions carry a huge number of songs.',
        paragraphs: [
          '12-bar blues: I I I I · IV IV I I · V IV I V. Pop: I – V – vi – IV. Jazz: ii – V – I. 50s: I – vi – IV – V.',
          'Because they are written in degrees, they work in every key: learn them once, play them anywhere.',
          'On the circle of fifths the chords of a progression sit next to each other, so the shapes are easy to see.',
        ],
        example: 'Pop progression in G: G – D – Em – C.',
        link: { label: 'Practise progressions', href: { pathname: '/circle' } },
      },
    ],
  },
  {
    title: 'Circle of fifths',
    notes: [
      {
        id: 'circle',
        title: 'The circle of fifths',
        summary: 'The 12 keys in a circle, each a 5th away from its neighbours.',
        paragraphs: [
          'Going clockwise from C, each key is a perfect 5th higher: C G D A E B F♯… Going the other way, each is a 4th higher: C F B♭ E♭…',
          'Keys next to each other share six of their seven notes, so they sound related – songs often move between neighbours.',
          'The key’s IV and V chords are its neighbours on the circle: for C they are F and G.',
        ],
        example: 'G is right of C, so G major has one note different from C major: F♯.',
        link: { label: 'Open the circle of fifths', href: { pathname: '/circle' } },
      },
      {
        id: 'key-signatures',
        title: 'Key signatures',
        summary: 'Each step clockwise adds a sharp; each step anticlockwise adds a flat.',
        paragraphs: [
          'C has no sharps or flats. G has one sharp (F♯), D two (F♯ C♯), A three, E four, B five.',
          'F has one flat (B♭), B♭ two (B♭ E♭), E♭ three, A♭ four, D♭ five.',
          'Sharps are added in the order F C G D A E B, flats in the opposite order B E A D G C F.',
        ],
        example: 'D major: two sharps, F♯ and C♯ – D E F♯ G A B C♯.',
        link: { label: 'See keys on the circle', href: { pathname: '/circle' } },
      },
      {
        id: 'relative',
        title: 'Relative keys and modulation',
        summary: 'Every major key has a minor key with the same notes, three semitones below.',
        paragraphs: [
          'C major and A minor are relative keys: the same notes and chords, but a different home. On the circle the minor key sits inside its relative major.',
          'Modulation means changing key in the middle of a song. The easiest moves are to a neighbour on the circle or to the relative minor or major, because most notes stay the same.',
          'Pop songs often lift the last chorus up a semitone or a whole step for extra energy.',
        ],
        example: 'G major ↔ E minor: G Am Bm C D Em F♯° are the chords of both.',
        link: { label: 'Compare major and minor', href: { pathname: '/key-chords' } },
      },
    ],
  },
];

export function findNote(id: string | undefined): TheoryNote | undefined {
  for (const section of THEORY_SECTIONS) {
    const note = section.notes.find((n) => n.id === id);
    if (note) return note;
  }
  return undefined;
}
