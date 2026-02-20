import { RegisterForm } from '@/components/auth/RegisterForm';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 group">
          <MapPin className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Vora.AI
          </span>
        </Link>

        {/* Form */}
        <RegisterForm />
      </div>
    </div>
  );
}
