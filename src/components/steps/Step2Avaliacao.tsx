import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  value?: any
  onChange?: (v: any) => void
  onNext?: () => void
  onBack?: () => void
}

export default function Step2Avaliacao({
  value,
  onChange,
  onNext,
  onBack
}: Props) {

  const [biotipo, setBiotipo] = useState(value?.biotipo ?? null)

  function handleSelect(type: string) {
    setBiotipo(type)

    onChange?.({
      ...value,
      biotipo: type
    })
  }

  const cards = [
    {
      id: "ectomorfo",
      title: "Ectomorfo",
      desc: "Tende a perder peso com facilidade",
      img: "/biotypes/ectomorfo.png",
      glow: "rgba(0,183,255,0.35)"
    },
    {
      id: "mesomorfo",
      title: "Mesomorfo",
      desc: "Atlético • ganha massa com facilidade",
      img: "/biotypes/mesomorfo.png",
      glow: "rgba(168,85,247,0.35)"
    },
    {
      id: "endomorfo",
      title: "Endomorfo",
      desc: "Tende a ganhar ou reter peso",
      img: "/biotypes/endomorfo.png",
      glow: "rgba(34,197,94,0.35)"
    }
  ]

  return (
    <div className="w-full text-white">

      {/* CARD CONTAINER */}
      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">

        <h2 className="text-[22px] font-semibold">
          Autoavaliação de biotipo
        </h2>

        <p className="text-white/50 text-sm mt-1 mb-6">
          Referência prática para individualizar calorias.
        </p>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4">

          {/* TOP ROW */}
          {cards.slice(0,2).map(card => {

            const active = biotipo === card.id

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleSelect(card.id)}
                className={`group relative overflow-hidden rounded-[22px] border transition-all duration-300
                ${active
                  ? "border-white/30 scale-[1.03]"
                  : "border-white/10 hover:border-white/20 hover:scale-[1.02]"
                }`}
                style={{
                  boxShadow: active ? `0 0 35px ${card.glow}` : undefined
                }}
              >

                {/* IMAGE */}
                <img
                  src={card.img}
                  className="w-full h-[170px] object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* GRADIENT */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* CHECK */}
                <div
                  className={`absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border transition-all
                  ${active
                    ? "border-emerald-400 bg-emerald-400 text-black"
                    : "border-white/30 bg-black/40"
                  }`}
                >
                  {active && <span className="text-[12px] font-bold">✓</span>}
                </div>

                {/* TEXT */}
                <div className="absolute bottom-0 left-0 p-4 text-left">

                  <div className="text-[16px] font-semibold">
                    {card.title}
                  </div>

                  <div className="text-[12px] text-white/60">
                    {card.desc}
                  </div>

                </div>

              </button>
            )
          })}

        </div>


        {/* BOTTOM CARD */}
        <div className="flex justify-center mt-4">

          {cards.slice(2).map(card => {

            const active = biotipo === card.id

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleSelect(card.id)}
                className={`group relative w-[60%] overflow-hidden rounded-[22px] border transition-all duration-300
                ${active
                  ? "border-white/30 scale-[1.03]"
                  : "border-white/10 hover:border-white/20 hover:scale-[1.02]"
                }`}
                style={{
                  boxShadow: active ? `0 0 35px ${card.glow}` : undefined
                }}
              >

                <img
                  src={card.img}
                  className="w-full h-[170px] object-cover transition-transform duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                <div
                  className={`absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border transition-all
                  ${active
                    ? "border-emerald-400 bg-emerald-400 text-black"
                    : "border-white/30 bg-black/40"
                  }`}
                >
                  {active && <span className="text-[12px] font-bold">✓</span>}
                </div>

                <div className="absolute bottom-0 left-0 p-4 text-left">

                  <div className="text-[16px] font-semibold">
                    {card.title}
                  </div>

                  <div className="text-[12px] text-white/60">
                    {card.desc}
                  </div>

                </div>

              </button>
            )
          })}

        </div>

        <p className="text-white/40 text-xs mt-6">
          O biotipo ajuda a calibrar a estratégia calórica do plano.
        </p>

      </section>

      {/* BUTTONS */}
      <div className="flex gap-3 mt-6">

        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="h-14 w-[120px] rounded-[20px] border-white/15 bg-black/20"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        )}

        <Button
          disabled={!biotipo}
          onClick={onNext}
          className="h-14 flex-1 rounded-[20px] border border-cyan-300/20 bg-gradient-to-r
          from-[#193B72]
          via-[#255AA8]
          to-[#7FE9D6]
          shadow-[0_10px_30px_rgba(0,149,255,0.18)]
          hover:brightness-110"
        >
          Continuar
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>

      </div>

    </div>
  )
}