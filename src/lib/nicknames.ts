// Apelidos automáticos divertidos (pt-BR), estilo Kahoot.
const ADJ = [
  'Veloz', 'Esperto', 'Turbo', 'Radiante', 'Feroz', 'Ninja', 'Mestre', 'Épico',
  'Astuto', 'Corajoso', 'Genial', 'Lendário', 'Ágil', 'Brilhante', 'Fominha', 'Craque',
]
const NOUN = [
  'Raposa', 'Tigre', 'Panda', 'Foguete', 'Dragão', 'Falcão', 'Lobo', 'Tubarão',
  'Coruja', 'Leão', 'Golfinho', 'Abelha', 'Polvo', 'Pinguim', 'Cometa', 'Trovão',
]

export function randomNickname(): string {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)]
  const n = NOUN[Math.floor(Math.random() * NOUN.length)]
  const num = Math.floor(Math.random() * 90 + 10)
  const base = `${a}${n}${num}`
  return base.slice(0, 20)
}
