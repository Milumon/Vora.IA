import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const t = useTranslations('home');
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <main className="flex flex-col items-center gap-8 text-center">
        <Image
          src="/images/Vora.webp"
          alt="Vora"
          width={120}
          height={120}
          className="rounded-2xl shadow-lg"
          priority
        />
        <h1 className="text-6xl font-bold">{t('title')}</h1>
        <p className="text-xl text-muted-foreground">
          {t('subtitle')}
        </p>
        <div className="flex gap-4">
          <Link
            href="/chat"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            {t('cta.start')}
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg border border-border px-6 py-3 hover:bg-accent"
          >
            {t('cta.login')}
          </Link>
        </div>
      </main>
    </div>
  );
}
