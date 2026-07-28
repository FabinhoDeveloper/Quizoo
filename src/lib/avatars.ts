// Avatares prontos (emoji). O valor guardado no banco é o próprio emoji,
// OU uma URL http(s) quando o usuário envia a própria foto.

export const PRESET_AVATARS = [
  '🦊', '🐼', '🐵', '🦁', '🐸', '🐯', '🐨', '🐷',
  '🐙', '🐧', '🐝', '🐳', '🐬', '🦋', '🐢', '🦖',
] as const

const BG = ['#8e46f0', '#03b0fc', '#feb703', '#fe4881', '#01cfab', '#5a1f9e', '#f97316', '#22c55e']

export function isPhoto(avatar?: string | null): boolean {
  return !!avatar && /^https?:\/\//.test(avatar)
}

/** Cor de fundo determinística a partir do emoji/apelido. */
export function avatarBg(seed?: string | null): string {
  const s = seed ?? '?'
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return BG[h % BG.length]
}

export function randomAvatar(): string {
  return PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]
}
