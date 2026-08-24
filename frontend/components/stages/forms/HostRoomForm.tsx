"use client";

import * as React from "react";
import { User, Sparkles, Minus, Plus, Users, Film } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface HostRoomFormProps {
  onSubmit: (hostName: string, maxUsers: number, maxSuggestions: number) => Promise<void>;
  isLoading?: boolean;
}

export function HostRoomForm({ onSubmit, isLoading = false }: HostRoomFormProps) {
  const [hostName, setHostName] = React.useState("");
  const [maxUsers, setMaxUsers] = React.useState<number | string>(10);
  const [maxSuggestions, setMaxSuggestions] = React.useState<number | string>(5);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handleMaxUsersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text === "") {
      setMaxUsers("");
      return;
    }
    const val = parseInt(text, 10);
    if (!isNaN(val)) {
      setMaxUsers(Math.min(20, Math.max(1, val)));
    }
  };

  const handleMaxSuggestionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text === "") {
      setMaxSuggestions("");
      return;
    }
    const val = parseInt(text, 10);
    if (!isNaN(val)) {
      setMaxSuggestions(Math.min(10, Math.max(1, val)));
    }
  };

  const handleMaxUsersBlur = () => {
    const val = typeof maxUsers === "string" ? parseInt(maxUsers, 10) : maxUsers;
    if (isNaN(val) || val < 2) {
      setMaxUsers(2);
    } else if (val > 20) {
      setMaxUsers(20);
    } else {
      setMaxUsers(val);
    }
  };

  const handleMaxSuggestionsBlur = () => {
    const val = typeof maxSuggestions === "string" ? parseInt(maxSuggestions, 10) : maxSuggestions;
    if (isNaN(val) || val < 1) {
      setMaxSuggestions(1);
    } else if (val > 10) {
      setMaxSuggestions(10);
    } else {
      setMaxSuggestions(val);
    }
  };

  const currentMaxUsers = typeof maxUsers === "number" ? maxUsers : parseInt(maxUsers, 10) || 10;
  const currentMaxSuggestions =
    typeof maxSuggestions === "number" ? maxSuggestions : parseInt(maxSuggestions, 10) || 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = hostName.trim();
    if (!trimmed) {
      setValidationError("Please enter your nickname.");
      return;
    }
    if (trimmed.length < 2) {
      setValidationError("Nickname must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 20) {
      setValidationError("Nickname must be 20 characters or less.");
      return;
    }

    setValidationError(null);
    await onSubmit(trimmed, currentMaxUsers, currentMaxSuggestions);
  };

  return (
    <form onSubmit={handleSubmit} suppressHydrationWarning className="flex flex-col gap-4 w-full">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
          Your Nickname
        </label>
        <Input
          placeholder="e.g. Lanz, Sarah"
          value={hostName}
          onChange={(e) => {
            setHostName(e.target.value);
            if (validationError) setValidationError(null);
          }}
          leftIcon={<User className="h-4 w-4 text-text-muted" />}
          error={validationError || undefined}
          disabled={isLoading}
          maxLength={20}
          autoFocus
        />
      </div>

      {/* Steppers with Direct Editable Number Inputs */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface/30 px-4 py-2.5 flex flex-col divide-y divide-border-subtle/50">
        {/* Max Players Stepper + Editable Input */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <Users className="h-3.5 w-3.5 text-brand-cyan" />
            <span>Max Players</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2">
            <button
              type="button"
              aria-label="Decrease max players"
              onClick={() => setMaxUsers((prev) => Math.max(2, (Number(prev) || 10) - 1))}
              disabled={isLoading || currentMaxUsers <= 2}
              className="flex min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] items-center justify-center rounded-lg bg-bg-surface border border-border-subtle text-text-muted hover:text-white hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-90"
            >
              <Minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Max players input"
              value={maxUsers}
              onChange={handleMaxUsersChange}
              onBlur={handleMaxUsersBlur}
              min={2}
              max={20}
              disabled={isLoading}
              suppressHydrationWarning
              className="w-12 h-10 sm:h-8 text-center text-sm sm:text-xs font-bold text-text-main bg-bg-surface border border-border-subtle rounded-lg focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all cursor-text"
            />
            <button
              type="button"
              aria-label="Increase max players"
              onClick={() => setMaxUsers((prev) => Math.min(20, (Number(prev) || 10) + 1))}
              disabled={isLoading || currentMaxUsers >= 20}
              className="flex min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] items-center justify-center rounded-lg bg-bg-surface border border-border-subtle text-text-muted hover:text-white hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-90"
            >
              <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
        </div>

        {/* Movies per Player Stepper + Editable Input */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <Film className="h-3.5 w-3.5 text-brand-violet" />
            <span>Movies per Player</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2">
            <button
              type="button"
              aria-label="Decrease movies per player"
              onClick={() => setMaxSuggestions((prev) => Math.max(1, (Number(prev) || 5) - 1))}
              disabled={isLoading || currentMaxSuggestions <= 1}
              className="flex min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] items-center justify-center rounded-lg bg-bg-surface border border-border-subtle text-text-muted hover:text-white hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-90"
            >
              <Minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Movies per player input"
              value={maxSuggestions}
              onChange={handleMaxSuggestionsChange}
              onBlur={handleMaxSuggestionsBlur}
              min={1}
              max={10}
              disabled={isLoading}
              suppressHydrationWarning
              className="w-12 h-10 sm:h-8 text-center text-sm sm:text-xs font-bold text-text-main bg-bg-surface border border-border-subtle rounded-lg focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all cursor-text"
            />
            <button
              type="button"
              aria-label="Increase movies per player"
              onClick={() => setMaxSuggestions((prev) => Math.min(10, (Number(prev) || 5) + 1))}
              disabled={isLoading || currentMaxSuggestions >= 10}
              className="flex min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] items-center justify-center rounded-lg bg-bg-surface border border-border-subtle text-text-muted hover:text-white hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-90"
            >
              <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full mt-1 h-12 text-sm sm:text-base"
      >
        <Sparkles className="h-4 w-4 mr-1.5" />
        Create Cinema Room
      </Button>
    </form>
  );
}
