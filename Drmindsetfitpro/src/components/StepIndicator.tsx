import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

const steps = [
  { number: 1, title: 'Perfil' },
  { number: 2, title: 'Avaliação' },
  { number: 3, title: 'Metabolismo' },
  { number: 4, title: 'Nutrição' },
  { number: 5, title: 'Treino' },
  { number: 6, title: 'Saúde' },
  { number: 7, title: 'Evolução' },
  { number: 8, title: 'Relatório' }
]

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Linha de progresso */}
          <div className="absolute top-5 left-0 h-0.5 bg-gray-200 dark:bg-gray-800"
               style={{ width: '100%', zIndex: 0 }} />
          <div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`, zIndex: 1 }}
          />

          {steps.map((step) => {
            const isCompleted = currentStep > step.number
            const isCurrent = currentStep === step.number

            return (
              <div key={step.number} className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                    isCompleted && 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
                    isCurrent && 'bg-gradient-to-r from-blue-600 to-purple-600 text-white ring-4 ring-blue-200 dark:ring-blue-900',
                    !isCompleted && !isCurrent && 'bg-white dark:bg-gray-900 text-gray-400 border-2 border-gray-200 dark:border-gray-800'
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span className={cn(
                  'mt-2 text-xs font-medium transition-colors hidden sm:block',
                  (isCurrent || isCompleted) ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                )}>
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
