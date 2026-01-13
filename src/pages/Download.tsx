import { Download as DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Download() {
  const handleDownload = () => {
    // Cria um link temporário para download
    const link = document.createElement('a')
    link.href = '/Drmindsetfitpro.zip'
    link.download = 'Drmindsetfitpro.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#1E6BFF] to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded-full flex items-center justify-center mb-4">
            <DownloadIcon className="w-8 h-8 text-[#1E6BFF] dark:text-[#1E6BFF]" />
          </div>
          <CardTitle className="text-2xl">Download do Projeto</CardTitle>
          <CardDescription>
            Baixe o backup completo do Drmindsetfitpro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold">📦 O que está incluído:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>✅ Todos os componentes e páginas</li>
              <li>✅ Base de dados de alimentos TACO</li>
              <li>✅ Configurações do projeto</li>
              <li>✅ Documentação completa</li>
              <li>✅ Assets e recursos públicos</li>
            </ul>
          </div>

          <Button
            onClick={handleDownload}
            className="w-full"
            size="lg"
          >
            <DownloadIcon className="mr-2 h-5 w-5" />
            Baixar Drmindsetfitpro.zip
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Arquivo pronto para GitHub, VS Code ou backup local
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
