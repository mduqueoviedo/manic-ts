// Sinclair ZX Spectrum color palette
// 8 standard colors with optional bright variants

export const SpectrumPalette = {
  black: '#000000',
  blue: '#0000d7',
  red: '#d70000',
  magenta: '#d700d7',
  green: '#00d700',
  cyan: '#00d7d7',
  yellow: '#d7d700',
  white: '#d7d7d7',

  // Bright variants (for visual distinction)
  brightBlue: '#0000ff',
  brightRed: '#ff0000',
  brightMagenta: '#ff00ff',
  brightGreen: '#00ff00',
  brightCyan: '#00ffff',
  brightYellow: '#ffff00',
  brightWhite: '#ffffff',
}

export type SpectrumColor = keyof typeof SpectrumPalette

export const colorToHex = (color: SpectrumColor): string => SpectrumPalette[color]
