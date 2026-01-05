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
        <div className="absolute inset-0 bg-gradient-to-br from-orange-700/50 via-background/60 to-green-600/60 backdrop-blur-md" />
        <div className="absolute z-10 px-12">
          <h1 className="text-5xl font-bold text-primary mb-4">Brigade d'Enquêtes et de Visites</h1>
          <p className="text-xl font-bold text-white/90">
            Plateforme de grilles de notation entre les agents
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
<p className="text-muted-foreground text-center"> copyright © 2026 Bev Notation </p>
        </div>
          
      </div>
    </div>
  )
}
