import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Login() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-950 to-black px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        
        {/* LOGO */}
        <picture>
  <source srcSet="/brand/optimized/mindsetfit-wordmark.avif" type="image/avif" />
  <source srcSet="/brand/optimized/mindsetfit-wordmark.webp" type="image/webp" />
  <img src="/brand/mindsetfit-logo.svg" className="mx-auto w-40 drop-shadow-lg select-none" alt="MindsetFit" />
</picture>

        {/* USER INFO */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-white">
            Bem-vindo de volta 👋
          </h1>
          {user?.email && (
            <p className="text-sm text-gray-400">
              {user.email}
            </p>
          )}
        </div>

        {/* CONTINUE */}
        <Button
          onClick={() => navigate("/dashboard")}
          className="w-full h-12 text-base font-semibold glow-blue"
        >
          Continuar
        </Button>

        {/* LOGOUT */}
        <button
          onClick={signOut}
          className="text-xs text-gray-500 hover:text-gray-300 transition"
        >
          Sair
        </button>

      </div>
    </div>
  );
}
