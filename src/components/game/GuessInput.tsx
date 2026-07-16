"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface GuessInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function GuessInput({ value, onChange, onSubmit, disabled }: GuessInputProps) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Input
        type="text"
        placeholder="Название фильма..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Угадать
      </Button>
    </form>
  );
}
