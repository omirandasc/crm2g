"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AlternarTema() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = React.useState(false);
  React.useEffect(() => setMontado(true), []);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Alternar tema claro/escuro"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {montado && resolvedTheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
