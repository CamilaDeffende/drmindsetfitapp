import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar, Dumbbell, TrendingUp } from 'lucide-react'
import type { DivisaoTreino, DivisaoTreinoConfig } from '@/types'

interface DivisaoTreinoSelectorProps {
  onSelect: (config: DivisaoTreinoConfig) => void
}

const DIVISOES_DISPONIVEIS: Record<DivisaoTreino, { nome: string; descricao: string; diasMinimos: number; diasRecomendados: number }> = {
  'ABC': {
    nome: 'ABC (3x na semana)',
    descricao: 'Treino A (Peito/Tríceps), B (Costas/Bíceps), C (Pernas/Ombros)',
    diasMinimos: 3,
    diasRecomendados: 3
  },
  'ABCDE': {
    nome: 'ABCDE (5x na semana)',
    descricao: 'A (Peito), B (Costas), C (Pernas), D (Ombros), E (Braços)',
    diasMinimos: 5,
    diasRecomendados: 5
  },
  'FullBody': {
    nome: 'Full Body',
    descricao: 'Corpo inteiro em cada treino - ideal para iniciantes',
    diasMinimos: 2,
    diasRecomendados: 3
  },
  'UpperLower': {
    nome: 'Upper/Lower',
    descricao: 'Dividido em membros superiores e inferiores',
    diasMinimos: 4,
    diasRecomendados: 4
  },
  'PushPullLegs': {
    nome: 'Push/Pull/Legs',
    descricao: 'Empurrar, Puxar e Pernas - máxima eficiência',
    diasMinimos: 3,
    diasRecomendados: 6
  }
}

const DIAS_SEMANA = [
  { value: 'segunda', label: 'Segunda' },
  { value: 'terça', label: 'Terça' },
  { value: 'quarta', label: 'Quarta' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'sexta', label: 'Sexta' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
]

export function DivisaoTreinoSelector({ onSelect }: DivisaoTreinoSelectorProps) {
  const [divisaoSelecionada, setDivisaoSelecionada] = useState<DivisaoTreino>('ABC')
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(['segunda', 'quarta', 'sexta'])
  const [intensidade, setIntensidade] = useState<'leve' | 'moderada' | 'intensa'>('moderada')

  const divisaoInfo = DIVISOES_DISPONIVEIS[divisaoSelecionada]

  const handleDiaToggle = (dia: string) => {
    setDiasSelecionados(prev =>
      prev.includes(dia)
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    )
  }

  const handleConfirmar = () => {
    const config: DivisaoTreinoConfig = {
      tipo: divisaoSelecionada,
      frequencia: diasSelecionados.length,
      diasSelecionados,
      intensidade
    }
    onSelect(config)
  }

  const diasValidos = diasSelecionados.length >= divisaoInfo.diasMinimos

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Escolha sua Divisão de Treino
          </CardTitle>
          <CardDescription>
            Selecione o modelo que melhor se adapta à sua rotina e disponibilidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={divisaoSelecionada} onValueChange={(value) => setDivisaoSelecionada(value as DivisaoTreino)}>
            {Object.entries(DIVISOES_DISPONIVEIS).map(([key, info]) => (
              <div key={key} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value={key} id={key} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={key} className="cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{info.nome}</span>
                      <Badge variant="outline">{info.diasRecomendados}x/semana</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{info.descricao}</p>
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dias da Semana
          </CardTitle>
          <CardDescription>
            Selecione os dias em que você vai treinar (mínimo {divisaoInfo.diasMinimos} dias)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DIAS_SEMANA.map(dia => (
              <div key={dia.value} className="flex items-center space-x-2">
                <Checkbox
                  id={dia.value}
                  checked={diasSelecionados.includes(dia.value)}
                  onCheckedChange={() => handleDiaToggle(dia.value)}
                />
                <Label htmlFor={dia.value} className="cursor-pointer font-normal">
                  {dia.label}
                </Label>
              </div>
            ))}
          </div>
          {diasSelecionados.length > 0 && (
            <div className="mt-4 p-3 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">{diasSelecionados.length} dias selecionados:</span>{' '}
                {diasSelecionados.map(d => DIAS_SEMANA.find(ds => ds.value === d)?.label).join(', ')}
              </p>
            </div>
          )}
          {!diasValidos && diasSelecionados.length > 0 && (
            <p className="mt-2 text-sm text-destructive">
              Selecione pelo menos {divisaoInfo.diasMinimos} dias para esta divisão
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Intensidade do Treino
          </CardTitle>
          <CardDescription>
            Defina o nível de intensidade baseado no seu condicionamento físico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={intensidade} onValueChange={(value) => setIntensidade(value as 'leve' | 'moderada' | 'intensa')}>
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <RadioGroupItem value="leve" id="leve" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="leve" className="cursor-pointer">
                  <div className="font-semibold mb-1">Leve</div>
                  <p className="text-sm text-muted-foreground">
                    Menos volume, cargas moderadas, foco em execução perfeita
                  </p>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <RadioGroupItem value="moderada" id="moderada" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="moderada" className="cursor-pointer">
                  <div className="font-semibold mb-1">Moderada</div>
                  <p className="text-sm text-muted-foreground">
                    Equilíbrio entre volume e intensidade, ideal para maioria
                  </p>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <RadioGroupItem value="intensa" id="intensa" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="intensa" className="cursor-pointer">
                  <div className="font-semibold mb-1">Intensa</div>
                  <p className="text-sm text-muted-foreground">
                    Alto volume, cargas elevadas, máxima hipertrofia e performance
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Button
        onClick={handleConfirmar}
        disabled={!diasValidos}
        size="lg"
        className="w-full bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0"
      >
        Gerar Treino Personalizado
      </Button>
    </div>
  )
}
