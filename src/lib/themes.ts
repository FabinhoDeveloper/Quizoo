// Temas de fundo do quiz (aplicados nas telas de host e jogador).
// Gradientes suaves — mantêm o texto escuro e os cards brancos legíveis.

export interface Theme {
  id: string
  name: string
  bg: string // valor de background (CSS)
  swatch: string // cor pra mostrar no seletor
}

export const THEMES: Theme[] = [
  { id: 'default', name: 'Padrão', bg: '#fbfaf7', swatch: '#fbfaf7' },
  { id: 'lavanda', name: 'Lavanda', bg: 'linear-gradient(160deg, #efe4ff 0%, #fbf7ff 55%)', swatch: '#c9a9ff' },
  { id: 'oceano', name: 'Oceano', bg: 'linear-gradient(160deg, #d6efff 0%, #f2fbff 55%)', swatch: '#5cc4fb' },
  { id: 'menta', name: 'Menta', bg: 'linear-gradient(160deg, #d4f7ee 0%, #f3fefb 55%)', swatch: '#3fd9bd' },
  { id: 'pessego', name: 'Pêssego', bg: 'linear-gradient(160deg, #ffe6d2 0%, #fff6ef 55%)', swatch: '#ffb27a' },
  { id: 'rosa', name: 'Rosa', bg: 'linear-gradient(160deg, #ffe0ec 0%, #fff4f8 55%)', swatch: '#ff8fb4' },
  { id: 'sol', name: 'Sol', bg: 'linear-gradient(160deg, #fff0c9 0%, #fffaf0 55%)', swatch: '#ffcf4d' },
  { id: 'grafite', name: 'Grafite', bg: 'linear-gradient(160deg, #eceaf4 0%, #f7f6fb 55%)', swatch: '#b9b4cc' },
]

export function themeBg(id?: string | null): string {
  return THEMES.find((t) => t.id === id)?.bg ?? THEMES[0].bg
}
