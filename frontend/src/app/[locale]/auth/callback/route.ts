import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to the root landing page so any pending message (saved in
  // localStorage before the user was forced to login) is restored in the
  // HeroSection input. The user can then confirm and press "Planifica mi viaje".
  const locale = requestUrl.pathname.split('/')[1] || 'es';
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
