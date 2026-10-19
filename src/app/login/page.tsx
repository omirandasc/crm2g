import { FormularioLogin } from "./formulario-login";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string; aviso?: string }>;
}) {
  const { motivo, aviso } = await searchParams;
  return <FormularioLogin aviso={motivo ?? aviso} />;
}
