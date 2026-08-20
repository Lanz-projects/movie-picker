"use client";

import * as React from "react";
import { User, KeyRound, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface JoinRoomFormProps {
  onSubmit: (roomCode: string, displayName: string) => Promise<void>;
  isLoading?: boolean;
  initialRoomCode?: string;
}

export function JoinRoomForm({
  onSubmit,
  isLoading = false,
  initialRoomCode = "",
}: JoinRoomFormProps) {
  const sanitizedInitial = initialRoomCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const [roomCode, setRoomCode] = React.useState(sanitizedInitial);
  const [displayName, setDisplayName] = React.useState("");
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [nameError, setNameError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
    }
  }, [initialRoomCode]);

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uppercase = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setRoomCode(uppercase);
    if (codeError) setCodeError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!roomCode || roomCode.length !== 6) {
      setCodeError("Room code must be exactly 6 characters.");
      hasError = true;
    }

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setNameError("Please enter your nickname.");
      hasError = true;
    } else if (trimmedName.length < 2) {
      setNameError("Nickname must be at least 2 characters.");
      hasError = true;
    } else if (trimmedName.length > 20) {
      setNameError("Nickname must be 20 characters or less.");
      hasError = true;
    }

    if (hasError) return;

    setCodeError(null);
    setNameError(null);
    await onSubmit(roomCode, trimmedName);
  };

  return (
    <form onSubmit={handleSubmit} suppressHydrationWarning className="flex flex-col gap-5 w-full">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
          6-Character Room Code
        </label>
        <Input
          placeholder="e.g. MVE892"
          value={roomCode}
          onChange={handleRoomCodeChange}
          leftIcon={<KeyRound className="h-4 w-4 text-text-muted" />}
          error={codeError || undefined}
          disabled={isLoading}
          maxLength={6}
          className="font-mono uppercase tracking-widest text-base font-bold text-center sm:text-left"
          autoFocus={!sanitizedInitial}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
          Your Nickname
        </label>
        <Input
          placeholder="e.g. Alex"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            if (nameError) setNameError(null);
          }}
          leftIcon={<User className="h-4 w-4 text-text-muted" />}
          error={nameError || undefined}
          disabled={isLoading}
          maxLength={20}
          autoFocus={Boolean(sanitizedInitial)}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full mt-1 h-12 text-sm sm:text-base"
      >
        Join Cinema Room
        <ArrowRight className="h-4 w-4 ml-1.5" />
      </Button>
    </form>
  );
}
