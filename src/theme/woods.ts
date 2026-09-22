// Fretboard woods. Each wood has a base colour, two grain colours (a darker and a lighter
// streak) and the colours of the parts that must stay readable on it.

export type Wood = {
  id: string;
  name: string;
  /** Main colour of the fretboard. */
  base: string;
  /** Grain streaks drawn over the base: [darker, lighter]. */
  grain: [string, string];
  /** Inlay dots: pearl on dark woods, black on light ones. */
  dot: string;
  /** Strings and frets are metal, but a little darker on light woods so they still show. */
  metal: string;
};

// Dark woods get cream pearl dots; light woods get black dots, like real guitars.
const PEARL = '#e8d9b5';
const BLACK_DOT = '#1f1712';

export const WOODS: Wood[] = [
  {
    id: 'rosewood',
    name: 'Rosewood',
    base: '#4a2c1a',
    grain: ['#351d10', '#63402a'],
    dot: PEARL,
    metal: '#c9c9c9',
  },
  {
    id: 'maple',
    name: 'Maple',
    base: '#e2c38e',
    grain: ['#cda56c', '#f0d9ab'],
    dot: BLACK_DOT,
    metal: '#8e8a84',
  },
  {
    id: 'roasted-maple',
    name: 'Roasted maple',
    base: '#b5733b',
    grain: ['#955a2a', '#cb8c52'],
    dot: BLACK_DOT,
    metal: '#d8d4cc',
  },
  {
    id: 'pau-ferro',
    name: 'Pau ferro',
    base: '#6e4329',
    grain: ['#553220', '#8a5a3b'],
    dot: PEARL,
    metal: '#c9c9c9',
  },
  {
    id: 'white',
    name: 'White',
    base: '#eee8dc',
    grain: ['#e1d9ca', '#f8f5ee'],
    dot: BLACK_DOT,
    metal: '#8e8a84',
  },
];

export const DEFAULT_WOOD = WOODS[0];

export function woodById(id: string | null | undefined): Wood {
  return WOODS.find((w) => w.id === id) ?? DEFAULT_WOOD;
}
