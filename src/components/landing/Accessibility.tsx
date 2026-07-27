import { Button } from '../ui/Button'

const a11yTiles = [
  { icon: '◉', label: 'Alto contraste' },
  { icon: '◆', label: 'Cor + forma' },
  { icon: 'Aa', label: 'Tipo legível' },
  { icon: '✓', label: 'Daltonismo', iconColor: '#01CFAB' },
]

export function Accessibility() {
  return (
    <section id="acessibilidade" className="max-w-[1180px] mx-auto px-8 pt-[70px] pb-10">
      <div className="bg-ink rounded-[32px] px-[52px] py-[60px] max-[860px]:px-7 max-[860px]:py-11 text-white">
        <div className="grid grid-cols-2 max-[860px]:grid-cols-1 gap-12 items-center">
          <div>
            <div className="font-extrabold text-[13px] tracking-[0.14em] uppercase text-[#B79BF0] mb-3.5">
              Acessibilidade
            </div>
            <h2 className="font-display font-semibold text-[40px] leading-[1.1] mb-3.5 text-white">
              Feito para todos jogarem
            </h2>
            <p className="text-[16.5px] text-[#C3BCE0] leading-[1.6] mb-7 max-w-[440px]">
              Ninguém fica de fora. A cor nunca é a única pista: cada resposta tem forma e ícone próprios, e tudo foi
              testado para daltonismo.
            </p>
            <Button variant="ghostLight">Ver compromisso de acessibilidade</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {a11yTiles.map((tile) => (
              <div className="bg-white/[0.06] rounded-[18px] p-[22px]" key={tile.label}>
                <div className="text-2xl mb-2.5" style={{ color: tile.iconColor }}>
                  {tile.icon}
                </div>
                <div className="font-display font-semibold text-base">{tile.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
