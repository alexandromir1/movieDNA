import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="mb-2 text-4xl font-bold">404</h1>
      <p className="mb-6 text-zinc-500">Страница не найдена</p>
      <Link href="/">
        <Button>На главную</Button>
      </Link>
    </Container>
  );
}
