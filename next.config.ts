import type { NextConfig } from "next";

// Cabeçalhos de segurança (auditoria de 24/09/2026). Em produção só havia
// HSTS, herdado da Vercel.
// O React em modo de desenvolvimento usa eval() para montar as pilhas de erro;
// em produção nunca usa. Por isso a folga vale só no ambiente local.
const evalDev = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const cabecalhosSeguranca = [
  // Só o próprio site e o Supabase; nada de <iframe> de terceiros nem eval.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${evalDev}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://brasilapi.com.br https://viacep.com.br https://pncp.gov.br",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: cabecalhosSeguranca }];
  },
};

export default nextConfig;
