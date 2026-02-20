import { MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Vora.AI
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>© {currentYear} ViajesPeru.AI</span>
            <Separator orientation="vertical" className="h-4" />
            <a
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacidad
            </a>
            <Separator orientation="vertical" className="h-4" />
            <a
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Términos
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
