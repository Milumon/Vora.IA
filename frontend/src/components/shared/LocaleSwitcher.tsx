'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

const locales = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === 'es' ? 'en' : 'es';
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  const currentLocaleName = locales.find((l) => l.code === locale)?.name || 'ES';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className="gap-2"
      aria-label="Switch language"
    >
      <Languages className="h-4 w-4" />
      <span className="text-sm font-medium">{currentLocaleName}</span>
    </Button>
  );
}
