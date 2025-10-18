import { Home } from "lucide-react";
import { Link } from "wouter";
import { Button } from "./ui/button";

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Главная
            </Button>
          </Link>
          {title && (
            <>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-xl font-semibold">{title}</h1>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

