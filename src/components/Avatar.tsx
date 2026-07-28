import { avatarBg, isPhoto } from '../lib/avatars'

/**
 * Mostra o avatar do jogador: foto enviada (URL) OU emoji num círculo colorido.
 * Se não houver avatar, usa a primeira letra do apelido.
 */
export function Avatar({
  avatar,
  name,
  size = 40,
}: {
  avatar?: string | null
  name?: string | null
  size?: number
}) {
  if (isPhoto(avatar)) {
    return (
      <img
        src={avatar as string}
        alt={name ?? 'avatar'}
        className="rounded-full object-cover shrink-0 border-2 border-white shadow-sm"
        style={{ width: size, height: size }}
      />
    )
  }
  const content = avatar || (name ? name.trim().charAt(0).toUpperCase() : '🙂')
  return (
    <div
      className="rounded-full grid place-items-center shrink-0 text-white border-2 border-white shadow-sm select-none"
      style={{ width: size, height: size, background: avatarBg(avatar || name), fontSize: size * 0.55 }}
    >
      {content}
    </div>
  )
}
