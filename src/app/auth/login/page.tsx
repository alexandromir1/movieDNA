import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Вход",
};

export default function LoginPage() {
  return (
    <Container className="flex justify-center py-16">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-xl font-bold">Войти</h1>
        <LoginForm />
      </Card>
    </Container>
  );
}
