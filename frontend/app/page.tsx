"use client";

import * as React from "react";
import {
  Sparkles,
  Search,
  Heart,
  X,
  Star,
  FastForward,
  Info,
  Crown,
  CheckCircle2,
  Film,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StageContainer } from "@/components/layout/StageContainer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky Cinema Header Navigation */}
      <Header
        roomCode="MVE8"
        nickname="Lanz (You)"
        isHost={true}
        memberCount={4}
        isConnected={true}
      />

      {/* Main Stage Viewport Showcase */}
      <StageContainer
        stageTitle="Cinema Design System Showcase"
        stageSubtitle="Foundational design tokens, typography, atomic components, and interaction physics."
        maxWidth="xl"
      >
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
          {/* Card 1: Buttons & Swiper Actions */}
          <Card variant="card" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-brand-violet" />
              <h2 className="font-display text-lg font-bold text-text-main">
                Buttons & Swiper Actions
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Button variant="primary" size="md">
                Primary Gradient CTA
              </Button>
              <Button variant="secondary" size="md">
                Secondary Surface
              </Button>
              <Button variant="danger" size="md">
                Destructive
              </Button>
              <Button variant="ghost" size="md">
                Ghost Action
              </Button>
            </div>

            {/* Circular Swiper Controls from Section 4.2 */}
            <div className="rounded-xl border border-border-subtle bg-bg-surface/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                Section 4.2: Circular Swiper Controls
              </p>
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <Button variant="actionPass" title="Pass (Left Swipe)">
                  <X className="h-6 w-6 stroke-[2.5]" />
                </Button>
                <Button variant="actionSkip" title="Skip">
                  <FastForward className="h-5 w-5" />
                </Button>
                <Button variant="actionSuperlike" title="Superlike (Up Swipe)">
                  <Star className="h-8 w-8 fill-brand-amber/20 stroke-[2.2]" />
                </Button>
                <Button variant="actionLike" title="Like (Right Swipe)">
                  <Heart className="h-6 w-6 fill-brand-emerald/20 stroke-[2.5]" />
                </Button>
                <Button variant="actionInfo" title="Movie Info">
                  <Info className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Card 2: Badges & Stamps */}
          <Card variant="card" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-brand-amber" />
              <h2 className="font-display text-lg font-bold text-text-main">
                Badges & Tinder Stamps
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Badge variant="host">
                <Crown className="h-3 w-3" />
                Host
              </Badge>
              <Badge variant="ready">
                <CheckCircle2 className="h-3 w-3" />
                Ready (4/4)
              </Badge>
              <Badge variant="unanimous">100% Unanimous Match</Badge>
              <Badge variant="score">+2 Superlike</Badge>
              <Badge variant="genre">Sci-Fi</Badge>
              <Badge variant="genre">Christopher Nolan</Badge>
            </div>

            {/* Stamp Overlays */}
            <div className="rounded-xl border border-border-subtle bg-bg-surface/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                Section 4.1: Live Stamp Overlays
              </p>
              <div className="flex flex-wrap items-center justify-around gap-4 py-2">
                <div className="stamp-like px-4 py-1 text-lg rounded-md">LIKE</div>
                <div className="stamp-pass px-4 py-1 text-lg rounded-md">PASS</div>
                <div className="stamp-superlike px-4 py-1 text-lg rounded-md">SUPERLIKE</div>
              </div>
            </div>
          </Card>

          {/* Card 3: Inputs & Controls */}
          <Card variant="card" className="p-6 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Film className="h-5 w-5 text-brand-cyan" />
              <h2 className="font-display text-lg font-bold text-text-main">
                Inputs & Search Controls
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                placeholder="Search TMDB movies (e.g. Inception, Dune)..."
                leftIcon={<Search className="h-4 w-4" />}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <Input
                placeholder="Enter 4-letter Room Code"
                defaultValue="MVE8"
                maxLength={4}
                className="uppercase tracking-widest font-mono font-bold"
              />
            </div>
          </Card>
        </div>
      </StageContainer>
    </div>
  );
}
