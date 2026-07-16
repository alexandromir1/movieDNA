"use client";

import { signInWithOAuth } from "@/actions/auth";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  return (
    <div className="flex flex-col gap-3">
      <Button onClick={() => signInWithOAuth("google")}>Войти через Google</Button>
      <Button variant="secondary" onClick={() => signInWithOAuth("github")}>
        Войти через GitHub
      </Button>
    </div>
  );
}
