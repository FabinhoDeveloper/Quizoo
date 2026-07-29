// Temas de fundo do quiz (aplicados nas telas de host e jogador).
// Gradientes "mesh" mais ricos (não genéricos) e claros o bastante pra manter
// o texto escuro legível. O criador também pode enviar a PRÓPRIA imagem: nesse
// caso o valor do tema é uma URL http(s) e aplicamos com um véu suave por cima.

export interface Theme {
  id: string
  name: string
  bg: string
  swatch: string
}

export const THEMES: Theme[] = [
  { id: 'default', name: 'Padrão', bg: '#f3f1f8', swatch: '#f3f1f8' },
  {
    id: 'lavanda',
    name: 'Lavanda',
    bg: 'radial-gradient(at 15% 20%, #e6d5ff 0, transparent 50%), radial-gradient(at 85% 15%, #ffd9f0 0, transparent 45%), radial-gradient(at 70% 85%, #d8e2ff 0, transparent 50%), linear-gradient(160deg,#efe6ff,#faf6ff)',
    swatch: '#c9a9ff',
  },
  {
    id: 'oceano',
    name: 'Oceano',
    bg: 'radial-gradient(at 20% 20%, #c7ecff 0, transparent 50%), radial-gradient(at 80% 25%, #d6e6ff 0, transparent 45%), radial-gradient(at 60% 90%, #cffaf0 0, transparent 55%), linear-gradient(160deg,#e3f4ff,#f2fbff)',
    swatch: '#5cc4fb',
  },
  {
    id: 'menta',
    name: 'Menta',
    bg: 'radial-gradient(at 20% 25%, #c6f6e6 0, transparent 50%), radial-gradient(at 85% 30%, #d9f7c9 0, transparent 45%), radial-gradient(at 70% 88%, #c9f0ff 0, transparent 50%), linear-gradient(160deg,#dcf7ef,#f3fefb)',
    swatch: '#3fd9bd',
  },
  {
    id: 'pessego',
    name: 'Pêssego',
    bg: 'radial-gradient(at 18% 22%, #ffe0c2 0, transparent 50%), radial-gradient(at 82% 20%, #ffd6da 0, transparent 45%), radial-gradient(at 65% 88%, #ffe9b8 0, transparent 50%), linear-gradient(160deg,#ffe9d6,#fff7ef)',
    swatch: '#ffb27a',
  },
  {
    id: 'rosa',
    name: 'Rosa',
    bg: 'radial-gradient(at 18% 20%, #ffd0e2 0, transparent 50%), radial-gradient(at 84% 22%, #e9d4ff 0, transparent 45%), radial-gradient(at 70% 88%, #ffe0cf 0, transparent 50%), linear-gradient(160deg,#ffe1ee,#fff5f9)',
    swatch: '#ff8fb4',
  },
  {
    id: 'sol',
    name: 'Sol',
    bg: 'radial-gradient(at 20% 20%, #ffe9a8 0, transparent 50%), radial-gradient(at 82% 25%, #ffd6b0 0, transparent 45%), radial-gradient(at 65% 90%, #fff0b8 0, transparent 55%), linear-gradient(160deg,#fff2cc,#fffaf0)',
    swatch: '#ffcf4d',
  },
  {
    id: 'galaxia',
    name: 'Galáxia',
    bg: 'radial-gradient(at 20% 20%, #d9c6ff 0, transparent 50%), radial-gradient(at 80% 25%, #c6dcff 0, transparent 45%), radial-gradient(at 55% 85%, #ffd6f2 0, transparent 55%), linear-gradient(160deg,#e7ddff,#eef1fb)',
    swatch: '#9a7bff',
  },
  {
    id: 'floresta',
    name: 'Floresta',
    bg: 'radial-gradient(at 22% 22%, #cdeecb 0, transparent 50%), radial-gradient(at 82% 28%, #e6f3bf 0, transparent 45%), radial-gradient(at 62% 88%, #c9eede 0, transparent 55%), linear-gradient(160deg,#ddf3d6,#f4fbf0)',
    swatch: '#5bc46a',
  },
]

/** É uma imagem enviada pelo usuário? (valor do tema é URL) */
export function isImageTheme(id?: string | null): boolean {
  return !!id && /^https?:\/\//.test(id)
}

/** Retorna o CSS de background do tema. Para imagens, aplica um véu claro por
 *  cima pra manter o texto legível. */
export function themeBg(id?: string | null): string {
  if (isImageTheme(id)) {
    return `linear-gradient(rgba(248,247,252,0.55), rgba(248,247,252,0.7)), url("${id}") center / cover no-repeat fixed`
  }
  return THEMES.find((t) => t.id === id)?.bg ?? THEMES[0].bg
}
