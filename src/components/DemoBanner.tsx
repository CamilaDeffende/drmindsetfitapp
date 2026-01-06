import { isSupabaseConfigured } from '@/lib/supabase'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function DemoBanner() {
  // Não mostrar nada se Supabase estiver configurado
  if (isSupabaseConfigured) return null

  return (
    <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/30">
      <AlertCircle className="h-4 w-4 text-yellow-500" />
      <AlertDescription className="text-yellow-200">
        <strong>Modo DEMO:</strong> Os dados não estão sendo salvos. Para salvar seus dados na nuvem, configure o Supabase.
      </AlertDescription>
    </Alert>
  )
}
