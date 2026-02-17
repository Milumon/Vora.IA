import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-6xl font-bold">Vora</h1>
        <p className="text-xl text-muted-foreground">
          Tu asistente de viajes con IA para explorar Perú
        </p>
        <div className="flex gap-4">
          <Link
            href="/chat"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Comenzar
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg border border-border px-6 py-3 hover:bg-accent"
          >
            Iniciar Sesión
          </Link>
        </div>
      </main>
    </div>
  );
}
