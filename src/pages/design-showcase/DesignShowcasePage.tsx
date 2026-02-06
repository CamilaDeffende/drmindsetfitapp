/**
 * Página de Showcase do Design Premium
 * Demonstra todos os novos estilos e animações
 */

export function DesignShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-mesh p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12 mf-anim-fadeup">
          <h1 className="text-6xl font-bold text-gradient-premium mb-4">
            DrMindSetFit Premium
          </h1>
          <p className="text-xl text-gray-400">
            Design System de Classe Mundial
          </p>
        </div>

        {/* Gradientes de Texto */}
        <div className="glass-card rounded-3xl p-8 mf-anim-fadeup delay-100">
          <h2 className="text-3xl font-bold text-white mb-6">Gradientes de Texto</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">
                Gradient
              </div>
              <p className="text-sm text-gray-400">text-gradient</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient-premium mf-anim-gradient mb-2">
                Premium
              </div>
              <p className="text-sm text-gray-400">text-gradient-premium</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-neon-glow mb-2">
                Neon Glow
              </div>
              <p className="text-sm text-gray-400">text-neon-glow</p>
            </div>
          </div>
        </div>

        {/* Botões Premium */}
        <div className="glass-card rounded-3xl p-8 mf-anim-fadeup delay-200">
          <h2 className="text-3xl font-bold text-white mb-6">Botões Premium</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-premium px-8 py-4 rounded-xl text-white font-semibold">
              Botão Animado
            </button>
            <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover-lift">
              Hover Lift
            </button>
            <button className="px-8 py-4 rounded-xl glass-card text-white font-semibold transition-smooth hover:scale-105">
              Glass Button
            </button>
          </div>
        </div>

        {/* Cards com Glassmorphism */}
        <div className="grid md:grid-cols-3 gap-6 mf-anim-fadeup delay-300">
          <div className="glass-card rounded-3xl p-6 hover-lift">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-4 mf-anim-float"></div>
            <h3 className="text-xl font-bold text-white mb-2">Glass Card</h3>
            <p className="text-gray-400 text-sm">
              Efeito glassmorphism premium com backdrop blur
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 hover-lift neon-border-animated">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl mb-4 mf-anim-float"></div>
            <h3 className="text-xl font-bold text-white mb-2">Neon Border</h3>
            <p className="text-gray-400 text-sm">
              Borda neon animada com gradiente
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 hover-lift glow-blue-intense">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mb-4 mf-anim-float"></div>
            <h3 className="text-xl font-bold text-white mb-2">Glow Intense</h3>
            <p className="text-gray-400 text-sm">
              Brilho neon intenso multicamada
            </p>
          </div>
        </div>

        {/* Animações */}
        <div className="glass-card rounded-3xl p-8 mf-anim-fadeup delay-100">
          <h2 className="text-3xl font-bold text-white mb-6">Animações</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-xl mx-auto mb-4 mf-anim-pulse-neon"></div>
              <p className="text-sm text-gray-400">Pulse Neon</p>
            </div>

            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-xl mx-auto mb-4 mf-anim-pulse-green"></div>
              <p className="text-sm text-gray-400">Pulse Green</p>
            </div>

            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-xl mx-auto mb-4 mf-anim-bounce"></div>
              <p className="text-sm text-gray-400">Bounce</p>
            </div>

            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-cyan-500 rounded-xl mx-auto mb-4 mf-anim-spin-slow"></div>
              <p className="text-sm text-gray-400">Spin Slow</p>
            </div>
          </div>
        </div>

        {/* Sombras */}
        <div className="glass-card rounded-3xl p-8 mf-anim-fadeup delay-200">
          <h2 className="text-3xl font-bold text-white mb-6">Sombras Premium</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-2xl p-6 shadow-premium">
              <h3 className="text-white font-semibold mb-2">Premium</h3>
              <p className="text-gray-400 text-sm">Sombra multicamada suave</p>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 shadow-neon-blue">
              <h3 className="text-white font-semibold mb-2">Neon Blue</h3>
              <p className="text-gray-400 text-sm">Sombra neon azul</p>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 glow-green">
              <h3 className="text-white font-semibold mb-2">Glow Green</h3>
              <p className="text-gray-400 text-sm">Brilho verde</p>
            </div>
          </div>
        </div>

        {/* Métricas com Animações */}
        <div className="grid md:grid-cols-4 gap-4 mf-anim-fadeup delay-300">
          <div className="glass-card rounded-2xl p-6 hover-lift mf-anim-slide-left">
            <div className="text-4xl font-bold text-gradient-premium mb-2">
              1,250
            </div>
            <p className="text-gray-400 text-sm">Treinos Completos</p>
          </div>

          <div className="glass-card rounded-2xl p-6 hover-lift mf-anim-slide-left delay-100">
            <div className="text-4xl font-bold text-gradient-premium mb-2">
              580km
            </div>
            <p className="text-gray-400 text-sm">Distância Total</p>
          </div>

          <div className="glass-card rounded-2xl p-6 hover-lift mf-anim-slide-left delay-200">
            <div className="text-4xl font-bold text-gradient-premium mb-2">
              42.5h
            </div>
            <p className="text-gray-400 text-sm">Tempo de Treino</p>
          </div>

          <div className="glass-card rounded-2xl p-6 hover-lift mf-anim-slide-left delay-300">
            <div className="text-4xl font-bold text-gradient-premium mb-2">
              98%
            </div>
            <p className="text-gray-400 text-sm">Taxa de Aderência</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-12 mf-anim-fadeup delay-500">
          <p className="text-gray-500 text-sm">
            Design Premium • DrMindSetFit 2026
          </p>
        </div>
      </div>
    </div>
  );
}
