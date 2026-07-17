const answers = [
  { bg: '#03B0FC', shape: '▲', label: 'Vênus' },
  { bg: '#FE4881', shape: '◆', label: 'Marte', correct: true },
  { bg: '#01CFAB', shape: '●', label: 'Júpiter' },
  { bg: '#5A1F9E', shape: '■', label: 'Saturno' },
]

export function GameMockup() {
  return (
    <div className="relative">
      <div className="bg-purple border-4 border-ink rounded-[28px] p-[26px] shadow-[0_20px_44px_rgba(76,29,149,0.28)]">
        <div className="flex items-center justify-between mb-5">
          <span className="bg-white text-purple-dark font-display font-semibold text-sm px-[14px] py-[6px] rounded-full">
            Pergunta 3 / 10
          </span>
          <span className="w-[46px] h-[46px] rounded-full bg-yellow text-ink font-display font-semibold text-[22px] flex items-center justify-center border-[3px] border-ink">
            12
          </span>
        </div>

        <div className="bg-white rounded-[18px] px-[22px] py-[26px] text-center mb-[18px] font-display font-semibold text-[22px] text-heading leading-[1.25]">
          Qual planeta é conhecido como o Planeta Vermelho?
        </div>

        <div className="grid grid-cols-2 gap-3">
          {answers.map((answer) => (
            <div
              key={answer.label}
              className="rounded-2xl p-[15px] flex items-center gap-3 text-white relative"
              style={{ background: answer.bg }}
            >
              <span className="w-[26px] h-[26px] bg-white/30 rounded-md flex items-center justify-center text-sm flex-none">
                {answer.shape}
              </span>
              <span className="font-display font-semibold text-[15px]">{answer.label}</span>
              {answer.correct && (
                <span className="absolute -top-[10px] -right-[10px] w-[30px] h-[30px] bg-teal border-[3px] border-white rounded-full flex items-center justify-center text-white text-[15px] shadow-[0_3px_8px_rgba(0,0,0,0.2)]">
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-[26px] -left-[30px] bg-white border-[3px] border-ink rounded-[18px] px-[18px] py-[14px] shadow-[0_12px_24px_rgba(0,0,0,0.14)] max-[480px]:static max-[480px]:mt-3.5 max-[480px]:inline-block">
        <div className="font-extrabold text-[11px] tracking-[0.1em] text-muted-2 uppercase">Game PIN</div>
        <div className="font-display font-semibold text-3xl tracking-[0.08em] text-purple">42 07 91</div>
      </div>

      <div className="absolute -top-[22px] -right-[18px] bg-yellow border-[3px] border-ink rounded-2xl px-4 py-[10px] font-display font-semibold text-[15px] text-ink shadow-[0_8px_18px_rgba(0,0,0,0.14)] max-[480px]:static max-[480px]:mt-3.5 max-[480px]:inline-block max-[480px]:ml-3.5">
        🎉 128 jogando
      </div>
    </div>
  )
}
