"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, GitPullRequest } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/allocations", label: "Allocations", icon: GitPullRequest },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 rounded"
          >
            Team Allocation Manager
          </Link>
          <nav className="hidden sm:flex space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 ${
                    isActive
                      ? "bg-indigo-600 text-white dark:bg-indigo-600"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <nav className="sm:hidden border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <div className="flex space-x-1 px-4 py-2 min-w-max">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 ${
                  isActive
                    ? "bg-indigo-600 text-white dark:bg-indigo-600"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
