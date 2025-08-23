"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/auth-context";
import { logOut } from "@/services/auth";
import { useRouter } from "next/navigation";
import { User, LogIn, LogOut, History, Home } from "lucide-react";

export function AppHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex justify-between h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div>
            <img src="/favicon.ico" alt="TypeWise Logo" className="h-10 w-10" />
          </div>
          <span className="font-bold sm:inline-block">TypeWise</span>
        </Link>

        <div className="flex items-center justify-end space-x-2">
          {user ? (
            <>
              <nav className="flex items-center gap-4 text-sm flex-1">
                <Link
                  href="/"
                  className="text-foreground/60 transition-colors hover:text-foreground/80"
                >
                  <Home className="h-4 w-4 inline-block md:hidden" />{" "}
                  <span className="hidden md:inline-block">Home</span>
                </Link>
                <Link
                  href="/history"
                  className="text-foreground/60 transition-colors hover:text-foreground/80"
                >
                  <History className="h-4 w-4 inline-block md:hidden" />{" "}
                  <span className="hidden md:inline-block">History</span>
                </Link>
              </nav>

              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">
                  <User className="h-4 w-4" /> Profile
                </Link>
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
