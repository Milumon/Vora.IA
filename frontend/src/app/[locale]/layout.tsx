import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vora - Tu asistente de viajes con IA',
  description: 'Explora Perú con tu asistente de viajes con IA',
  icons: {
    icon: '/images/Vora.webp',
    shortcut: '/images/Vora.webp',
    apple: '/images/Vora.webp',
  },
};

const locales = ['es', 'en'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) {
    notFound();
  }

  let messages;
  try {
    // Load all translation files
    const [common, home, auth, chat, itineraries, footer] = await Promise.all([
      import(`../../../public/locales/${locale}/common.json`),
      import(`../../../public/locales/${locale}/home.json`),
      import(`../../../public/locales/${locale}/auth.json`),
      import(`../../../public/locales/${locale}/chat.json`),
      import(`../../../public/locales/${locale}/itineraries.json`),
      import(`../../../public/locales/${locale}/footer.json`),
    ]);

    messages = {
      common: common.default,
      home: home.default,
      auth: auth.default,
      chat: chat.default,
      itineraries: itineraries.default,
      footer: footer.default,
    };
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryProvider>
              <AuthProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  {/* <Footer /> */}
                </div>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

