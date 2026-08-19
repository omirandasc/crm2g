"use client";

import { LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { sair } from "@/app/login/actions";

function iniciais(nome?: string | null) {
  if (!nome) return "?";
  const partes = nome.trim().split(/\s+/);
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase();
}

export function MenuUsuario({
  nome,
  email,
  perfilRotulo,
}: {
  nome: string | null;
  email: string | null;
  perfilRotulo: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="gap-2.5 px-2">
            <Avatar className="size-7">
              <AvatarFallback className="bg-marca-100 text-marca-800 text-xs font-semibold">
                {iniciais(nome)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-left">
              <span className="block text-sm font-medium leading-tight">{nome}</span>
              <span className="block text-xs text-muted-foreground leading-tight">
                {perfilRotulo}
              </span>
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
        <DropdownMenuLabel>
          <span className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block truncate">{nome}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {email}
              </span>
            </span>
          </span>
        </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => sair()}>
          <LogOut className="size-4" />
          Sair da conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
