import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, Mail, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await signIn(formData.email, formData.password)

    if (signInError) {
      setError('Email ou senha incorretos. Tente novamente.')
      setLoading(false)
      return
    }

    toast({
      title: 'Login realizado!',
      description: 'Bem-vindo de volta ao DrMindSetfit',
    })

    navigate("/onboarding")
    setLoading(false)
  }

  return (
<div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center p-4">
      {/* HERO: logo MindsetFit ocupando o topo (fundo transparente) */}
      <div className="flex flex-col items-center justify-center pt-10 pb-8" data-ui="mindsetfit-login-hero">
        <img
          src="/brand/mindsetfit-wordmark.png"
          alt="MindsetFit"
          className="mx-auto w-auto bg-transparent h-20 sm:h-24 md:h-28 lg:h-32"
          draggable={false}
        />
      </div>

<div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#1E6BFF] to-[#00B7FF] mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neon mb-2"></h1>
          <p className="text-gray-400">Entre na sua conta</p>
        </div>

        <Card className="glass-effect neon-border">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-neon">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-center">
              Acesse sua conta para continuar seu progresso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-black/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-black/20"
                />
              </div>

              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#1E6BFF] hover:text-[#1E6BFF] transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full glow-blue h-12">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              <div className="text-center text-sm text-gray-400">
                Não tem uma conta?{' '}
                <Link to="/signup" className="text-[#1E6BFF] hover:text-[#1E6BFF] font-semibold">
                  Criar conta grátis
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade
        </p>
      </div>
    </div>
  )
}
