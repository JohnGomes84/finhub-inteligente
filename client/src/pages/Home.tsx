import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

/**
 * Home - Landing page que redireciona para dashboard se autenticado
 */

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Redirecionando para dashboard
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">FinHub Inteligente</h1>
        <p className="text-xl text-gray-600 mb-8">
          Plataforma completa de gestão financeira com conciliação bancária automatizada
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
            <span>Gestão de pagamentos e recebimentos</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
            <span>Conciliação bancária automática</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
            <span>Processamento inteligente de documentos</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
            <span>Dashboard com análise de fluxo de caixa</span>
          </div>
        </div>

        <a href={getLoginUrl()}>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
            Entrar com Manus
          </Button>
        </a>

        <p className="text-gray-500 mt-6 text-sm">
          Sua segurança é nossa prioridade. Autenticação segura com OAuth e criptografia de dados.
        </p>
      </div>
    </div>
  );
}
