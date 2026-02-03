/**
 * Unicode character mappings for text transformations
 * Provides functions to transform text using various Unicode styles
 */

/**
 * Helper function to create character range map
 */
function createCharMap(
  sourceStart: number,
  targetStart: number,
  length: number
): Map<string, string> {
  const map = new Map<string, string>()
  for (let i = 0; i < length; i++) {
    const sourceChar = String.fromCodePoint(sourceStart + i)
    const targetChar = String.fromCodePoint(targetStart + i)
    map.set(sourceChar, targetChar)
  }
  return map
}

/**
 * Apply strikethrough using combining character
 * Uses Unicode Combining Long Stroke Overlay (U+0336)
 */
export function applyStrikethrough(text: string): string {
  return text
    .split('')
    .map((char) => char + '\u0336')
    .join('')
}

/**
 * Upside-down character mappings
 */
const upsideDownMap: Record<string, string> = {
  // Lowercase
  a: 'ɐ',
  b: 'q',
  c: 'ɔ',
  d: 'p',
  e: 'ǝ',
  f: 'ɟ',
  g: 'ƃ',
  h: 'ɥ',
  i: 'ᴉ',
  j: 'ɾ',
  k: 'ʞ',
  l: 'l',
  m: 'ɯ',
  n: 'u',
  o: 'o',
  p: 'd',
  q: 'b',
  r: 'ɹ',
  s: 's',
  t: 'ʇ',
  u: 'n',
  v: 'ʌ',
  w: 'ʍ',
  x: 'x',
  y: 'ʎ',
  z: 'z',
  // Uppercase
  A: '∀',
  B: 'q',
  C: 'Ɔ',
  D: 'p',
  E: 'Ǝ',
  F: 'Ⅎ',
  G: 'פ',
  H: 'H',
  I: 'I',
  J: 'ſ',
  K: 'ʞ',
  L: '˥',
  M: 'W',
  N: 'N',
  O: 'O',
  P: 'Ԁ',
  Q: 'Ό',
  R: 'ɹ',
  S: 'S',
  T: '┴',
  U: '∩',
  V: 'Λ',
  W: 'M',
  X: 'X',
  Y: '⅄',
  Z: 'Z',
  // Numbers
  '0': '0',
  '1': 'Ɩ',
  '2': 'ᄅ',
  '3': 'Ɛ',
  '4': 'ㄣ',
  '5': 'ϛ',
  '6': '9',
  '7': 'ㄥ',
  '8': '8',
  '9': '6',
  // Common punctuation
  '.': '˙',
  ',': "'",
  '?': '¿',
  '!': '¡',
  "'": ',',
  '"': '„',
  ';': '؛',
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '<': '>',
  '>': '<',
  '&': '⅋',
  _: '‾',
}

/**
 * Apply upside-down transformation
 * Reverses string and flips characters
 */
export function applyUpsideDown(text: string): string {
  return text
    .split('')
    .reverse()
    .map((char) => upsideDownMap[char] || char)
    .join('')
}

/**
 * Apply mirror (reverse text)
 * Simply reverses the string order
 */
export function applyMirror(text: string): string {
  return text.split('').reverse().join('')
}

/**
 * Mathematical Bold Unicode mapping (U+1D400 - U+1D433)
 */
const boldMap = new Map<string, string>([
  // Uppercase A-Z: U+0041-U+005A → U+1D400-U+1D419
  ...Array.from(createCharMap(0x41, 0x1d400, 26)),
  // Lowercase a-z: U+0061-U+007A → U+1D41A-U+1D433
  ...Array.from(createCharMap(0x61, 0x1d41a, 26)),
  // Numbers 0-9: U+0030-U+0039 → U+1D7CE-U+1D7D7
  ...Array.from(createCharMap(0x30, 0x1d7ce, 10)),
])

/**
 * Apply bold using Mathematical Bold Unicode
 */
export function applyBold(text: string): string {
  return text
    .split('')
    .map((char) => boldMap.get(char) || char)
    .join('')
}

/**
 * Mathematical Italic Unicode mapping (U+1D434 - U+1D467)
 */
const italicMap = new Map<string, string>([
  // Uppercase A-Z: U+0041-U+005A → U+1D434-U+1D44D (skip h at U+1D455)
  ...Array.from(createCharMap(0x41, 0x1d434, 26)),
  // Lowercase a-z: U+0061-U+007A → U+1D44E-U+1D467
  ...Array.from(createCharMap(0x61, 0x1d44e, 26)),
])

/**
 * Apply italic using Mathematical Italic Unicode
 */
export function applyItalic(text: string): string {
  return text
    .split('')
    .map((char) => italicMap.get(char) || char)
    .join('')
}

/**
 * Mathematical Bold Italic Unicode mapping (U+1D468 - U+1D49B)
 */
const boldItalicMap = new Map<string, string>([
  // Uppercase A-Z: U+0041-U+005A → U+1D468-U+1D481
  ...Array.from(createCharMap(0x41, 0x1d468, 26)),
  // Lowercase a-z: U+0061-U+007A → U+1D482-U+1D49B
  ...Array.from(createCharMap(0x61, 0x1d482, 26)),
])

/**
 * Apply bold-italic using Mathematical Bold Italic Unicode
 */
export function applyBoldItalic(text: string): string {
  return text
    .split('')
    .map((char) => boldItalicMap.get(char) || char)
    .join('')
}

/**
 * Mathematical Script Unicode mapping (U+1D49C - U+1D4CF)
 */
const scriptMap = new Map<string, string>([
  // Uppercase A-Z: U+0041-U+005A → U+1D49C-U+1D4B5
  ...Array.from(createCharMap(0x41, 0x1d49c, 26)),
  // Lowercase a-z: U+0061-U+007A → U+1D4B6-U+1D4CF
  ...Array.from(createCharMap(0x61, 0x1d4b6, 26)),
])

/**
 * Apply script (cursive) using Mathematical Script Unicode
 */
export function applyScript(text: string): string {
  return text
    .split('')
    .map((char) => scriptMap.get(char) || char)
    .join('')
}

/**
 * Circled Latin Letters (U+24B6 - U+24E9)
 */
const circledMap = new Map<string, string>([
  // Uppercase A-Z: U+0041-U+005A → U+24B6-U+24CF
  ...Array.from(createCharMap(0x41, 0x24b6, 26)),
  // Lowercase a-z: U+0061-U+007A → U+24D0-U+24E9
  ...Array.from(createCharMap(0x61, 0x24d0, 26)),
  // Numbers 0-9: U+0030-U+0039 → U+24EA + U+2460-U+2468
  ['0', '⓪'],
  ['1', '①'],
  ['2', '②'],
  ['3', '③'],
  ['4', '④'],
  ['5', '⑤'],
  ['6', '⑥'],
  ['7', '⑦'],
  ['8', '⑧'],
  ['9', '⑨'],
])

/**
 * Apply circled using Circled Latin Letters
 */
export function applyCircled(text: string): string {
  return text
    .split('')
    .map((char) => circledMap.get(char) || char)
    .join('')
}

/**
 * Negative Squared Latin Letters (U+1F170 - U+1F189 + custom)
 */
const squaredMap = new Map<string, string>([
  ['A', '🅰'],
  ['B', '🅱'],
  ['C', '🅲'],
  ['D', '🅳'],
  ['E', '🅴'],
  ['F', '🅵'],
  ['G', '🅶'],
  ['H', '🅷'],
  ['I', '🅸'],
  ['J', '🅹'],
  ['K', '🅺'],
  ['L', '🅻'],
  ['M', '🅼'],
  ['N', '🅽'],
  ['O', '🅾'],
  ['P', '🅿'],
  ['Q', '🆀'],
  ['R', '🆁'],
  ['S', '🆂'],
  ['T', '🆃'],
  ['U', '🆄'],
  ['V', '🆅'],
  ['W', '🆆'],
  ['X', '🆇'],
  ['Y', '🆈'],
  ['Z', '🆉'],
  // Lowercase uses same as uppercase
  ['a', '🅰'],
  ['b', '🅱'],
  ['c', '🅲'],
  ['d', '🅳'],
  ['e', '🅴'],
  ['f', '🅵'],
  ['g', '🅶'],
  ['h', '🅷'],
  ['i', '🅸'],
  ['j', '🅹'],
  ['k', '🅺'],
  ['l', '🅻'],
  ['m', '🅼'],
  ['n', '🅽'],
  ['o', '🅾'],
  ['p', '🅿'],
  ['q', '🆀'],
  ['r', '🆁'],
  ['s', '🆂'],
  ['t', '🆃'],
  ['u', '🆄'],
  ['v', '🆅'],
  ['w', '🆆'],
  ['x', '🆇'],
  ['y', '🆈'],
  ['z', '🆉'],
])

/**
 * Apply squared using Negative Squared Latin Letters
 */
export function applySquared(text: string): string {
  return text
    .split('')
    .map((char) => squaredMap.get(char) || char)
    .join('')
}

/**
 * Mathematical Monospace Unicode mapping (U+1D670 - U+1D6A3)
 */
const monospaceMap = new Map<string, string>([
  // Uppercase A-Z: U+0041-U+005A → U+1D670-U+1D689
  ...Array.from(createCharMap(0x41, 0x1d670, 26)),
  // Lowercase a-z: U+0061-U+007A → U+1D68A-U+1D6A3
  ...Array.from(createCharMap(0x61, 0x1d68a, 26)),
  // Numbers 0-9: U+0030-U+0039 → U+1D7F6-U+1D7FF
  ...Array.from(createCharMap(0x30, 0x1d7f6, 10)),
])

/**
 * Apply monospace using Mathematical Monospace Unicode
 */
export function applyMonospace(text: string): string {
  return text
    .split('')
    .map((char) => monospaceMap.get(char) || char)
    .join('')
}

/**
 * Mathematical Double-Struck Unicode mapping (U+1D538 - U+1D56B)
 */
const doubleStruckMap = new Map<string, string>([
  // Uppercase A-Z: U+0041-U+005A → U+1D538-U+1D551
  ...Array.from(createCharMap(0x41, 0x1d538, 26)),
  // Lowercase a-z: U+0061-U+007A → U+1D552-U+1D56B
  ...Array.from(createCharMap(0x61, 0x1d552, 26)),
  // Numbers 0-9: U+0030-U+0039 → U+1D7D8-U+1D7E1
  ...Array.from(createCharMap(0x30, 0x1d7d8, 10)),
])

/**
 * Apply double-struck using Mathematical Double-Struck Unicode
 */
export function applyDoubleStruck(text: string): string {
  return text
    .split('')
    .map((char) => doubleStruckMap.get(char) || char)
    .join('')
}

/**
 * Fullwidth Forms Unicode mapping (U+FF01 - U+FF5E)
 */
const fullwidthMap = new Map<string, string>([
  // Uppercase A-Z: U+0041-U+005A → U+FF21-U+FF3A
  ...Array.from(createCharMap(0x41, 0xff21, 26)),
  // Lowercase a-z: U+0061-U+007A → U+FF41-U+FF5A
  ...Array.from(createCharMap(0x61, 0xff41, 26)),
  // Numbers 0-9: U+0030-U+0039 → U+FF10-U+FF19
  ...Array.from(createCharMap(0x30, 0xff10, 10)),
  // Space: U+0020 → U+3000
  [' ', '　'],
])

/**
 * Apply fullwidth using Fullwidth Forms Unicode
 */
export function applyFullwidth(text: string): string {
  return text
    .split('')
    .map((char) => fullwidthMap.get(char) || char)
    .join('')
}

/**
 * Small Caps Unicode mapping (limited support)
 */
const smallCapsMap: Record<string, string> = {
  // Lowercase to small caps
  a: 'ᴀ',
  b: 'ʙ',
  c: 'ᴄ',
  d: 'ᴅ',
  e: 'ᴇ',
  f: 'ꜰ',
  g: 'ɢ',
  h: 'ʜ',
  i: 'ɪ',
  j: 'ᴊ',
  k: 'ᴋ',
  l: 'ʟ',
  m: 'ᴍ',
  n: 'ɴ',
  o: 'ᴏ',
  p: 'ᴘ',
  q: 'ǫ',
  r: 'ʀ',
  s: 's',
  t: 'ᴛ',
  u: 'ᴜ',
  v: 'ᴠ',
  w: 'ᴡ',
  x: 'x',
  y: 'ʏ',
  z: 'ᴢ',
  // Uppercase remains uppercase
}

/**
 * Apply small caps using Small Caps Unicode
 * Uppercase letters remain unchanged, lowercase converted to small caps
 */
export function applySmallCaps(text: string): string {
  return text
    .split('')
    .map((char) => {
      // Convert uppercase to small caps equivalent
      if (char >= 'A' && char <= 'Z') {
        const lowerChar = char.toLowerCase()
        return smallCapsMap[lowerChar] || char
      }
      // Convert lowercase to small caps
      return smallCapsMap[char] || char
    })
    .join('')
}
