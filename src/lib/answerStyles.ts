// Estilo das 4 alternativas (cor + forma), como nos jogos de quiz ao vivo.
// A forma garante acessibilidade: a cor nunca é a única pista.
export const answerStyles = [
  { shape: '▲', bg: '#03b0fc', shadow: '#0284c7' },
  { shape: '◆', bg: '#fe4881', shadow: '#c81e56' },
  { shape: '●', bg: '#01cfab', shadow: '#01a488' },
  { shape: '■', bg: '#8e46f0', shadow: '#5a1f9e' },
] as const

export function answerStyle(index: number) {
  return answerStyles[index % answerStyles.length]
}
