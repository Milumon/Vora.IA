'use client';

import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { CurrencyToggle } from '@/components/shared/CurrencyToggle';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { MessageSquare, FolderHeart, User, LogOut, LogIn, UserPlus } from 'lucide-react';

export function Header() {
  const t = useTranslations('common');
  const tCommon = useTranslations('common');
  const { user, signOut } = useAuth();
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.includes(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <Image
            src="/images/Vora.webp"
            alt="Vora"
            width={32}
            height={32}
            className="transition-transform group-hover:scale-110"
          />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
            Vora
          </span>
        </Link>

        {/* Navigation - Center */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant={isActive('/chat') ? 'default' : 'ghost'}
              asChild
              className="gap-2"
            >
              <Link href="/chat">
                <MessageSquare className="h-4 w-4" />
                {t('navigation.chat')}
              </Link>
            </Button>
            <Button
              variant={isActive('/itineraries') ? 'default' : 'ghost'}
              asChild
              className="gap-2"
            >
              <Link href="/itineraries">
                <FolderHeart className="h-4 w-4" />
                {t('navigation.myTrips')}
              </Link>
            </Button>
          </nav>
        )}

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              {/* Usuario logueado: avatar + nombre */}
              <Button variant="ghost" asChild className="gap-2 px-2">
                <Link href="/profile" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {userName ? userName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                    {userName || user.email}
                  </span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                aria-label={tCommon('auth.signOut')}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {/* Desktop: texto completo */}
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link href="/auth/login">{tCommon('auth.login')}</Link>
              </Button>
              <Button asChild className="hidden sm:flex">
                <Link href="/auth/register">{tCommon('auth.register')}</Link>
              </Button>

              {/* Mobile: solo iconos */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="sm:hidden"
                aria-label={tCommon('auth.login')}
              >
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="icon"
                asChild
                className="sm:hidden"
                aria-label={tCommon('auth.register')}
              >
                <Link href="/auth/register">
                  <UserPlus className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}

          <CurrencyToggle />
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile navigation */}
      {user && (
        <nav className="md:hidden border-t border-border-subtle">
          <div className="container mx-auto flex items-center justify-around px-4 py-2">
            <Button
              variant={isActive('/chat') ? 'default' : 'ghost'}
              size="sm"
              asChild
              className="gap-2"
            >
              <Link href="/chat">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">{t('navigation.chat')}</span>
              </Link>
            </Button>
            <Button
              variant={isActive('/itineraries') ? 'default' : 'ghost'}
              size="sm"
              asChild
              className="gap-2"
            >
              <Link href="/itineraries">
                <FolderHeart className="h-4 w-4" />
                <span className="text-xs">{t('navigation.myTrips')}</span>
              </Link>
            </Button>
            <Button
              variant={isActive('/profile') ? 'default' : 'ghost'}
              size="sm"
              asChild
              className="gap-2"
            >
              <Link href="/profile">
                <User className="h-4 w-4" />
                <span className="text-xs">{t('navigation.profile')}</span>
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
