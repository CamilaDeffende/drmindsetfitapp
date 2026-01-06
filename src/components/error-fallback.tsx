import { useState, ErrorInfo } from 'react';
import { AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
}

export function ErrorFallback({ error, errorInfo }: ErrorFallbackProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const errorText = `Esse erro de preview foi gerado, revise e corrija:

${error.toString()}

Component Stack:
${errorInfo?.componentStack || 'N/A'}`;

    try {
      // Tentar copiar diretamente primeiro (funciona em standalone)
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Se falhar (iframe), usar postMessage para pai copiar
      try {
        window.parent.postMessage({
          type: 'copy-error',
          text: errorText
        }, '*');
        
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (postMessageErr) {
        // Fallback final: textarea + execCommand
        try {
          const textArea = document.createElement('textarea');
          textArea.value = errorText;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch (fallbackErr) {
          console.error('Failed to copy:', fallbackErr);
          alert('Não foi possível copiar automaticamente. Copie o texto manualmente.');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ops, pequeno erro encontrado</AlertTitle>
            <AlertDescription>
              Algo deu errado durante a renderização. Copie o erro abaixo e envie para a Lasy corrigir.
            </AlertDescription>
          </Alert>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Detalhes do erro:</p>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs max-h-64 overflow-y-auto border">
                <code>{error.toString()}</code>
              </pre>
            </div>

            {errorInfo?.componentStack && (
              <div>
                <p className="text-sm font-medium mb-2">Stack do componente:</p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs max-h-48 overflow-y-auto border">
                  <code>{errorInfo.componentStack}</code>
                </pre>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <p className="text-sm text-muted-foreground text-center">
            Clique abaixo para copiar e envie para a Lasy corrigir.
          </p>
          <Button 
            onClick={handleCopy}
            className="w-full"
            variant={copied ? "outline" : "default"}
          >
            {copied ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Erro
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

