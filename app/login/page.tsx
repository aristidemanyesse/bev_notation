import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Partie gauche : image et branding */}
      <div className="relative w-3/5 hidden md:flex items-center justify-center bg-gray-100 overflow-hidden">
        <Image
          src="/modern-office-workspace-professional-team-collabor.jpg"
          alt="Bureau moderne"
          fill
          className="object-cover "
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-700/30 via-background/30 to-green-600/30 backdrop-blur-xs" />
        <div className="absolute z-10 text-center px-12">
          <h1 className="text-5xl font-bold text-white mb-4">Bienvenue sur Bev Notation</h1>
          <p className="text-lg text-white/90">
            Gérez et suivez les évaluations de vos collaborateurs facilement
          </p>
        </div>
      </div>

      {/* Partie droite : formulaire */}
      <div className="w-full md:w-2/5 flex items-center justify-center bg-white p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
          </div>

          {/* Formulaire */}
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
