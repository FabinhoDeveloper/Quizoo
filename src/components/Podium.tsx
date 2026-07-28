import { Avatar } from './Avatar'
import type { LeaderRow } from '../lib/game'

/** Pódio dos 3 primeiros — responsivo (usa flex-1, nunca estoura no celular). */
export function Podium({ rows }: { rows: LeaderRow[] }) {
  const top = rows.slice(0, 3)
  const order = [1, 0, 2] // 2º, 1º, 3º (centro é o campeão)
  const heights = ['h-20 sm:h-24', 'h-28 sm:h-36', 'h-16 sm:h-20']
  const barColors = ['#03b0fc', '#feb703', '#fe4881']
  const medals = ['🥈', '🥇', '🥉']
  const delays = [0.15, 0, 0.3]

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3 w-full max-w-[440px] mx-auto">
      {order.map((idx, i) =>
        top[idx] ? (
          <div key={top[idx].playerId} className="flex flex-col items-center flex-1 min-w-0 max-w-[130px]">
            <div className="quizoo-pop" style={{ animationDelay: `${delays[i] + 0.2}s` }}>
              <Avatar avatar={top[idx].avatar} name={top[idx].nickname} size={i === 1 ? 54 : 42} />
            </div>
            <span className="text-2xl sm:text-3xl -mt-2 leading-none">{medals[i]}</span>
            <span className="font-display font-semibold text-[12px] sm:text-[15px] text-heading truncate max-w-full px-1 mt-0.5">
              {top[idx].nickname}
            </span>
            <span className="text-purple font-bold text-[12px] sm:text-[14px] mb-1">{top[idx].score}</span>
            <div
              className={`w-full ${heights[i]} rounded-t-xl origin-bottom`}
              style={{
                background: barColors[i],
                animation: `quizoo-grow 0.6s cubic-bezier(0.34,1.56,0.64,1) ${delays[i]}s both`,
              }}
            />
          </div>
        ) : (
          <div key={i} className="flex-1 min-w-0 max-w-[130px]" />
        ),
      )}
    </div>
  )
}
