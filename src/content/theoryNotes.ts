// Short theory notes. Each one explains one idea in small blocks (short text, lists, tables),
// gives an example and links to the screen where it can be seen and played.
// In text, **double stars** mark words to show in bold.

import type { Href } from 'expo-router';

export type NoteBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; header?: string[]; rows: string[][] };

export type TheoryNote = {
  id: string;
  title: string;
  /** The main idea in one sentence, shown first and highlighted. */
  summary: string;
  blocks: NoteBlock[];
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
        blocks: [
          { type: 'heading', text: 'The 12 notes' },
          { type: 'text', text: '**C · C♯/D♭ · D · D♯/E♭ · E · F**' },
          { type: 'text', text: '**F♯/G♭ · G · G♯/A♭ · A · A♯/B♭ · B**' },
          { type: 'text', text: 'After B the names start again from C, **one octave** higher.' },
          { type: 'heading', text: 'On the neck' },
          {
            type: 'list',
            items: [
              'One fret up = **one semitone** higher.',
              '12 frets up = the **same note**, an octave higher (the double dot).',
              '**E–F** and **B–C** are only one semitone apart: no sharp between them.',
            ],
          },
          { type: 'heading', text: 'Good to know' },
          {
            type: 'text',
            text: 'In Finnish, German and Nordic charts **H** means B, and **B** means B♭.',
          },
        ],
        example: 'Low E string: open E · 1st fret F · 3rd G · 5th A · 12th E again.',
        link: { label: 'See every note on the neck', href: { pathname: '/scales' } },
      },
      {
        id: 'intervals',
        title: 'Intervals',
        summary: 'An interval is the distance between two notes, counted in semitones.',
        blocks: [
          {
            type: 'text',
            text: 'Each interval has its own **sound**. These are the ones you meet every day:',
          },
          {
            type: 'table',
            header: ['Semitones', 'Interval', 'Degree', 'Sound'],
            rows: [
              ['1', 'Minor 2nd', '♭2', 'tense'],
              ['2', 'Major 2nd', '2', 'a step'],
              ['3', 'Minor 3rd', '♭3', 'sad, minor'],
              ['4', 'Major 3rd', '3', 'bright, major'],
              ['5', 'Perfect 4th', '4', 'open'],
              ['6', 'Tritone', '♭5', 'unstable'],
              ['7', 'Perfect 5th', '5', 'strong, open'],
              ['9', 'Major 6th', '6', 'sweet'],
              ['10', 'Minor 7th', '♭7', 'bluesy'],
              ['11', 'Major 7th', '7', 'dreamy'],
              ['12', 'Octave', '1', 'the same note'],
            ],
          },
          {
            type: 'text',
            text: 'The **degrees** in this app (1, ♭3, 5…) are intervals above the root.',
          },
        ],
        example: 'A power chord is just a root and a 5th: A and E.',
        link: {
          label: 'See the degrees of the major scale',
          href: { pathname: '/scales', params: { scale: 'Major (Ionian)', labels: 'degrees' } },
        },
      },
      {
        id: 'major-scale',
        title: 'The major scale',
        summary: 'The major scale follows one pattern of whole and half steps.',
        blocks: [
          { type: 'heading', text: 'The pattern' },
          { type: 'text', text: '**W  W  H  W  W  W  H**' },
          {
            type: 'list',
            items: ['**W** = whole step = 2 frets', '**H** = half step = 1 fret'],
          },
          {
            type: 'text',
            text: 'Start on any note and follow the pattern: you get that note’s **major scale**.',
          },
          { type: 'heading', text: 'Why it matters' },
          {
            type: 'text',
            text: 'Minor scales, modes, chords and keys are all described as **changes to the major scale**. That is why degrees are numbered from it.',
          },
        ],
        example: 'G major: G  A  B  C  D  E  F♯  G',
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
        blocks: [
          {
            type: 'table',
            header: ['Scale', 'Degrees'],
            rows: [
              ['Major', '1  2  3  4  5  6  7'],
              ['Natural minor', '1  2  ♭3  4  5  ♭6  ♭7'],
              ['Harmonic minor', '1  2  ♭3  4  5  ♭6  7'],
            ],
          },
          { type: 'text', text: 'The **♭3** is what makes it sound minor.' },
          { type: 'heading', text: 'Relative minor' },
          {
            type: 'text',
            text: 'Every major key has a minor key with **the same notes**, starting on its 6th degree. C major and A minor share all their notes.',
          },
          { type: 'heading', text: 'Harmonic minor' },
          {
            type: 'text',
            text: 'Raising the 7th makes the **V chord major**, which pulls home strongly. Common in classical music and flamenco.',
          },
        ],
        example: 'A minor: A B C D E F G – the notes of C major, but A is home.',
        link: {
          label: 'Play the minor scale',
          href: { pathname: '/scales', params: { scale: 'Minor (Aeolian)', root: '9' } },
        },
      },
      {
        id: 'pentatonic',
        title: 'Pentatonic, blues and blue notes',
        summary: 'Pentatonic scales keep five notes and leave out the ones that clash.',
        blocks: [
          {
            type: 'table',
            header: ['Scale', 'Degrees'],
            rows: [
              ['Minor pentatonic', '1  ♭3  4  5  ♭7'],
              ['Major pentatonic', '1  2  3  5  6'],
              ['Minor blues', '1  ♭3  4  ♭5  5  ♭7'],
            ],
          },
          {
            type: 'list',
            items: [
              'No half steps, so **almost every note sounds good** – the first scale most soloists learn.',
              '**Blue notes** (♭3, ♭5, ♭7) are bent between major and minor. They give blues its sound.',
              'On guitar the minor pentatonic is learned as **five boxes** up the neck.',
            ],
          },
        ],
        example: 'A minor pentatonic, box 1 at the 5th fret: the classic rock and blues shape.',
        link: {
          label: 'Play the minor blues scale',
          href: { pathname: '/scales', params: { scale: 'Minor blues', root: '9' } },
        },
      },
      {
        id: 'modes',
        title: 'The seven modes',
        summary: 'The modes use the notes of a major scale but start from a different note.',
        blocks: [
          {
            type: 'text',
            text: 'Play C major from D to D: the same notes, but **D is home** and the sound changes. That is **D Dorian**.',
          },
          { type: 'heading', text: 'From brightest to darkest' },
          {
            type: 'table',
            header: ['Mode', 'Change', 'Sound'],
            rows: [
              ['Lydian', '♯4', 'dreamy, floating'],
              ['Ionian', '–', 'plain major'],
              ['Mixolydian', '♭7', 'rock, blues'],
              ['Dorian', '♭3 ♭7', 'funky minor'],
              ['Aeolian', '♭3 ♭6 ♭7', 'natural minor'],
              ['Phrygian', '♭2', 'Spanish, dark'],
              ['Locrian', '♭2 ♭5', 'unstable'],
            ],
          },
          {
            type: 'text',
            text: 'The **changed note** is what gives each mode its colour – lean on it.',
          },
        ],
        example: 'D Dorian: D E F G A B C. Compared with D minor, B is natural instead of B♭.',
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
        blocks: [
          {
            type: 'table',
            header: ['Triad', 'Degrees', 'In C'],
            rows: [
              ['Major', '1  3  5', 'C E G'],
              ['Minor', '1  ♭3  5', 'C E♭ G'],
              ['Diminished', '1  ♭3  ♭5', 'C E♭ G♭'],
              ['Augmented', '1  3  ♯5', 'C E G♯'],
              ['Sus2', '1  2  5', 'C D G'],
              ['Sus4', '1  4  5', 'C F G'],
            ],
          },
          {
            type: 'list',
            items: [
              'Major and minor differ by **one note**, one semitone apart.',
              '**Sus** chords have no 3rd: neither major nor minor, they want to resolve.',
              'Every chord shape is these notes **repeated in different octaves**.',
            ],
          },
        ],
        example: 'C major: C E G. C minor: C E♭ G.',
        link: { label: 'See chord shapes', href: { pathname: '/chords' } },
      },
      {
        id: 'sevenths',
        title: 'Seventh chords',
        summary: 'A seventh chord adds a 7th on top of a triad.',
        blocks: [
          {
            type: 'table',
            header: ['Chord', 'Degrees', 'Sound'],
            rows: [
              ['maj7', '1  3  5  7', 'soft, jazzy'],
              ['7', '1  3  5  ♭7', 'bluesy, wants to go home'],
              ['m7', '1  ♭3  5  ♭7', 'smooth minor'],
              ['m7♭5', '1  ♭3  ♭5  ♭7', 'tense'],
              ['°7', '1  ♭3  ♭5  ♭♭7', 'very tense'],
            ],
          },
          {
            type: 'text',
            text: 'In a major key the **V chord is naturally a dominant 7**. That is why G7 leads so clearly to C.',
          },
        ],
        example: 'G7 = G B D F. B and F want to move to C and E.',
        link: {
          label: 'See G7 shapes',
          href: { pathname: '/chords', params: { root: '7', type: '8' } },
        },
      },
      {
        id: 'inversions',
        title: 'Inversions',
        summary: 'An inversion puts a note other than the root in the bass.',
        blocks: [
          {
            type: 'table',
            header: ['Name', 'Lowest note', 'C major'],
            rows: [
              ['Root position', 'root', 'C E G'],
              ['1st inversion', '3rd', 'E G C'],
              ['2nd inversion', '5th', 'G C E'],
            ],
          },
          {
            type: 'list',
            items: [
              'Inversions let the **bass walk step by step** (C – C/E – F) instead of jumping.',
              'On three strings the shapes go up the neck **root, 1st, 2nd** and round again.',
            ],
          },
        ],
        example: 'C/E = C major with E in the bass.',
        link: { label: 'See triads and inversions', href: { pathname: '/triads' } },
      },
      {
        id: 'key-chords',
        title: 'Chords of a key and their jobs',
        summary: 'Each key has seven chords, and each chord has a job.',
        blocks: [
          {
            type: 'text',
            text: 'In a major key: **I  ii  iii  IV  V  vi  vii°** – capitals major, small letters minor.',
          },
          {
            type: 'table',
            header: ['Job', 'Chords', 'Feels like'],
            rows: [
              ['Tonic', 'I  iii  vi', 'home, rest'],
              ['Subdominant', 'ii  IV', 'moving away'],
              ['Dominant', 'V  vii°', 'tension, wants home'],
            ],
          },
          { type: 'text', text: 'Most songs travel **home → away → tension → home**.' },
        ],
        example: 'In C: C Dm Em F G Am B°. C – F – G – C is home, away, tension, home.',
        link: { label: 'See the chords of any key', href: { pathname: '/key-chords' } },
      },
      {
        id: 'progressions',
        title: 'Common progressions',
        summary: 'A few chord progressions carry a huge number of songs.',
        blocks: [
          {
            type: 'table',
            header: ['Name', 'Degrees', 'In G'],
            rows: [
              ['Pop', 'I – V – vi – IV', 'G D Em C'],
              ['Jazz', 'ii – V – I', 'Am D G'],
              ['50s', 'I – vi – IV – V', 'G Em C D'],
              ['12-bar blues', 'I I I I · IV IV I I · V IV I V', 'G … C … D'],
            ],
          },
          {
            type: 'text',
            text: 'Written in degrees, they work **in every key**: learn once, play anywhere.',
          },
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
        blocks: [
          {
            type: 'list',
            items: [
              '**Clockwise:** each key a 5th higher – C G D A E B F♯…',
              '**Anticlockwise:** each key a 4th higher – C F B♭ E♭ A♭…',
              'Neighbours share **six of seven notes**, so they sound related.',
              'A key’s **IV and V** are its neighbours: for C, F and G.',
            ],
          },
        ],
        example: 'G is right of C: G major differs from C major by one note, F♯.',
        link: { label: 'Open the circle of fifths', href: { pathname: '/circle' } },
      },
      {
        id: 'key-signatures',
        title: 'Key signatures',
        summary: 'Each step clockwise adds a sharp; each step anticlockwise adds a flat.',
        blocks: [
          {
            type: 'table',
            header: ['How many', 'With sharps ♯', 'With flats ♭'],
            rows: [
              ['0', 'C', 'C'],
              ['1', 'G', 'F'],
              ['2', 'D', 'B♭'],
              ['3', 'A', 'E♭'],
              ['4', 'E', 'A♭'],
              ['5', 'B', 'D♭'],
            ],
          },
          {
            type: 'list',
            items: [
              'Sharps are added in the order **F C G D A E B**.',
              'Flats in the opposite order **B E A D G C F**.',
            ],
          },
        ],
        example: 'D major: two sharps, F♯ and C♯ – D E F♯ G A B C♯.',
        link: { label: 'See keys on the circle', href: { pathname: '/circle' } },
      },
      {
        id: 'relative',
        title: 'Relative keys and modulation',
        summary: 'Every major key has a minor key with the same notes, three semitones below.',
        blocks: [
          { type: 'heading', text: 'Relative keys' },
          {
            type: 'text',
            text: 'C major and A minor: **same notes and chords**, different home. On the circle the minor key sits inside its major.',
          },
          { type: 'heading', text: 'Modulation' },
          {
            type: 'list',
            items: [
              'Modulation = **changing key** in the middle of a song.',
              'Easiest moves: to a **neighbour** on the circle, or to the **relative** key.',
              'Pop trick: lift the last chorus **up a semitone or a whole step**.',
            ],
          },
        ],
        example: 'G major ↔ E minor: G Am Bm C D Em F♯° belong to both.',
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
