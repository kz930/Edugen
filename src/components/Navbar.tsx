"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/create", label: "Create lesson" },
  { href: "/library", label: "Saved lessons" },
  { href: "/about", label: "How it works" },
];

export function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/lesson")) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </span>
          <span>Edugen</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                {l.label}
              </Button>
            </Link>
          ))}
        </nav>
        <Link href="/create">
          <Button size="sm">Create</Button>
        </Link>
      </div>
    </header>
  );
}
