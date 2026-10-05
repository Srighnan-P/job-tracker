"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, LaptopIcon } from "lucide-react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="flex h-8 w-24 items-center justify-center rounded-full border border-border bg-muted/40" />
    );
  }

  const modes = [
    { key: "light", label: "Light", icon: SunIcon },
    { key: "system", label: "System", icon: LaptopIcon },
    { key: "dark", label: "Dark", icon: MoonIcon },
  ] as const;

  return (
    <div
      role="group"
      aria-label="Theme switcher"
      className="inline-flex items-center rounded-full border border-border bg-muted/40 p-0.5 shadow-xs"
    >
      {modes.map(({ key, label, icon: Icon }) => {
        const isActive = theme === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            title={`${label} mode`}
            aria-label={`${label} mode`}
            aria-pressed={isActive}
            className={`relative flex size-7 items-center justify-center rounded-full transition-all cursor-pointer ${
              isActive
                ? "bg-background text-foreground shadow-xs font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
