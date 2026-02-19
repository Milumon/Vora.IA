import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['es', 'en'];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale)) notFound();

  // Load all translation files
  const [common, home, auth, chat, itineraries, footer] = await Promise.all([
    import(`../../public/locales/${locale}/common.json`),
    import(`../../public/locales/${locale}/home.json`),
    import(`../../public/locales/${locale}/auth.json`),
    import(`../../public/locales/${locale}/chat.json`),
    import(`../../public/locales/${locale}/itineraries.json`),
    import(`../../public/locales/${locale}/footer.json`),
  ]);

  return {
    locale,
    messages: {
      common: common.default,
      home: home.default,
      auth: auth.default,
      chat: chat.default,
      itineraries: itineraries.default,
      footer: footer.default,
    },
  };
});
