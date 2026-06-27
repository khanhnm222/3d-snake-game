export interface SnakeTheme {
  label: string
  /** Three alternating body shades — dark / mid / bright */
  body:  [string, string, string]
  spine: string
  belly: string
  /** Swatch preview color shown in the picker */
  swatch: string
}

export const SNAKE_THEMES: SnakeTheme[] = [
  {
    label:  'Rừng',
    body:   ['#2d8a2d', '#357e35', '#3a9e3a'],
    spine:  '#1a5c1a',
    belly:  '#8cd67a',
    swatch: '#3a9e3a',
  },
  {
    label:  'Đại Dương',
    body:   ['#2060a8', '#1a5898', '#2870bc'],
    spine:  '#103060',
    belly:  '#70b0f0',
    swatch: '#2870bc',
  },
  {
    label:  'Sa Mạc',
    body:   ['#b87e24', '#a87018', '#cc9030'],
    spine:  '#7a4e08',
    belly:  '#e8c878',
    swatch: '#cc9030',
  },
  {
    label:  'Đỏ',
    body:   ['#a82424', '#982020', '#bc2e2e'],
    spine:  '#6a1010',
    belly:  '#f07070',
    swatch: '#bc2e2e',
  },
  {
    label:  'Tím',
    body:   ['#7820a8', '#6c1898', '#882ebc'],
    spine:  '#480e68',
    belly:  '#c070f0',
    swatch: '#882ebc',
  },
  {
    label:  'Bóng Đêm',
    body:   ['#383838', '#2e2e2e', '#444444'],
    spine:  '#181818',
    belly:  '#888888',
    swatch: '#444444',
  },
  {
    label:  'Vàng',
    body:   ['#b88c20', '#a87c18', '#cc9e2e'],
    spine:  '#786008',
    belly:  '#f0d860',
    swatch: '#cc9e2e',
  },
  {
    label:  'Băng',
    body:   ['#4888b8', '#4080a8', '#5898cc'],
    spine:  '#285880',
    belly:  '#b0d8f4',
    swatch: '#5898cc',
  },
]