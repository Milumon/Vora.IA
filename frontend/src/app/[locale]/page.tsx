'use client';

/**
 * Root Landing Page — /[locale]
 *
 * Full Vora landing page composition with all sections:
 *   1. HeroSection       — Chat input with minimalist mesh-gradient bg
 *   2. WhatIsVoraSection — What is Vora + mock itinerary card
 *   3. HowItWorksSection — 3-step route-timeline flow
 *   4. BenefitsSection   — 4 benefit cards + stats
 *   5. DestinationsSection — Countries + stat row
 *   6. CtaSection        — Final CTA
 */

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { HeroSection } from '@/components/landing/sections/HeroSection';
import { WhatIsVoraSection } from '@/components/landing/sections/WhatIsVoraSection';
import { HowItWorksSection } from '@/components/landing/sections/HowItWorksSection';
import { BenefitsSection } from '@/components/landing/sections/BenefitsSection';
import { DestinationsSection } from '@/components/landing/sections/DestinationsSection';
import { CtaSection } from '@/components/landing/sections/CtaSection';

export default function HomePage() {
  const router = useRouter();
  const locale = useLocale();
  const heroRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = useCallback(
    (message: string) => {
      // Navigation is handled by HeroSection (checks auth, saves message, redirects)
      // This is just a fallback if needed
      router.push(`/${locale}/chat`);
    },
    [router, locale],
  );

  const handleStartPlanning = useCallback(() => {
    // Focus the textarea in the hero section
    heroRef.current?.querySelector('textarea')?.focus();
  }, []);

  return (
    <main className="w-full min-h-screen">
      {/* Hero */}
      <div ref={heroRef}>
        <HeroSection onSendMessage={handleSendMessage} isLoading={false} />
      </div>

      {/* Section 1 — What is Vora */}
      <WhatIsVoraSection />

      {/* Section 2 — How it works */}
      <HowItWorksSection />

      {/* Section 3 — Benefits */}
      <BenefitsSection />

      {/* Section 4 — Destinations */}
      <DestinationsSection />

      {/* Section 5 — Final CTA */}
      <CtaSection onStartPlanning={handleStartPlanning} />
    </main>
  );
}
