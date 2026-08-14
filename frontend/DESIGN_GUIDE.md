# Style & Design System Guide: "What Should We Watch"

This document serves as the single source of truth for the visual design language, theme tokens, typography, component specifications, and interaction patterns for the **What Should We Watch** frontend application.

---

## 🎭 1. Design Philosophy

* **Cinema Ambiance**: A refined midnight atmosphere inspired by modern movie theaters and streaming platforms, rather than generic brightly colored themes.
* **Balanced Contrast & Restraint**: Avoid loud, multi-colored neon gradients across entire screens. Keep surfaces clean, matte, and readable with purposeful, high-contrast accent highlights.
* **Stage Isolation & Screen Balance**: Every phase of the game (Setup, Lobby, Search, Swiper, Winner) is strictly isolated to its own full screen view, centered both horizontally and vertically.
* **Tactile & Responsive**: High-touch mobile gesture physics for swiping with clear keyboard accessibility for desktop power-users.

---

## 🎨 2. Color System & Design Tokens

### Background Surfaces
| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `bg-base` | `#0A0D14` | Global app canvas background with subtle ambient depth |
| `bg-card` | `#131722` | Main card containers, swiping card background, panels |
| `bg-surface` | `#1A2030` | Interactive controls, inputs, secondary panels, chips |
| `bg-elevated` | `#222A3F` | Hover states, active buttons, elevated badges |

### Borders & Overlays
| Token | Value | Usage |
| :--- | :--- | :--- |
| `border-subtle` | `rgba(255, 255, 255, 0.08)` | Default card, modal, and button outlines |
| `border-highlight` | `rgba(139, 92, 246, 0.3)` | Focused inputs, active selections, primary borders |
| `card-gradient` | `linear-gradient(180deg, transparent 45%, rgba(10, 13, 20, 0.75) 75%, rgba(10, 13, 20, 0.98) 100%)` | Bottom legibility gradient overlay on movie cards |

### Brand & Feedback Accents
| Accent | Hex Value | Semantic Meaning / Component |
| :--- | :--- | :--- |
| **Brand Indigo** | `#6366F1` | Primary CTA buttons, active tabs, brand logo |
| **Brand Violet** | `#8B5CF6` | Secondary gradient accent on primary actions |
| **Pass / Nope** | `#F43F5E` | Pass / Nope action button, left-swipe stamp overlay |
| **Like** | `#10B981` | Like action button, right-swipe stamp overlay, ready status |
| **Superlike** | `#F59E0B` | Superlike action button (+2 pts), upward swipe stamp, host badge |
| **Info / Neutral**| `#94A3B8` | Skip / info buttons, metadata chips, secondary text |

### Typography Colors
| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `text-main` | `#F8FAFC` | Primary headings, movie titles, high-emphasis text |
| `text-secondary`| `#94A3B8` | Descriptions, labels, metadata, input placeholders |
| `text-muted` | `#64748B` | Subtle hints, timestamps, inactive icons |

---

## 🔤 3. Typography Hierarchy

* **Display Font (Headings & Badges)**: `Outfit` (Google Fonts), sans-serif, weights `700`, `800`, `900`.
* **Body Font (UI, Controls, Text)**: `Inter` (Google Fonts), sans-serif, weights `400`, `500`, `600`, `700`.

### Type Scale
| Element | Font Family | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `Outfit` | `2.25rem` (36px) | `800` | `1.2` |
| **Card Movie Title** | `Outfit` | `1.75rem` (28px) | `800` | `1.15` |
| **Section Header** | `Outfit` | `1.4rem` (22px) | `800` | `1.25` |
| **Modal Title** | `Outfit` | `1.5rem` (24px) | `800` | `1.2` |
| **Body / Overview** | `Inter` | `0.88rem` (14px) | `400` / `500` | `1.55` |
| **Meta / Chips** | `Inter` | `0.75rem` (12px) | `600` | `1.0` |
| **Stamps (LIKE/PASS)**| `Outfit` | `1.75rem` (28px) | `900` | `1.0` |

---

## 🧩 4. Component Specifications

### 4.1 Tinder Swipe Card (`SwipeCard`)
* **Container Dimensions**: `max-width: 480px`, `height: 540px` (desktop), `480px` (mobile).
* **Border Radius**: `24px` with `border: 1px solid var(--border-subtle)` and `box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.6)`.
* **Deck Stacking Depth**:
  * **Top Card**: `z-index: 2`, `transform: translate(0, 0) scale(1)`.
  * **Back Card 1**: `z-index: 1`, `transform: scale(0.95) translateY(14px)`, `opacity: 0.6`.
  * **Back Card 2**: `z-index: 0`, `transform: scale(0.9) translateY(28px)`, `opacity: 0.3`.
* **Stamps**:
  * **LIKE**: Border `3px solid #10B981`, Color `#10B981`, Rotate `14deg`, Right `25px`.
  * **PASS**: Border `3px solid #F43F5E`, Color `#F43F5E`, Rotate `-14deg`, Left `25px`.
  * **SUPERLIKE**: Border `3px solid #F59E0B`, Color `#F59E0B`, Centered top, Background `rgba(0,0,0,0.6)`.

### 4.2 Circular Action Buttons (`SwipeActions`)
* **Button Types**:
  * **Pass (❌)**: `56px × 56px`, Color `#F43F5E`, Hover Background `rgba(244, 63, 94, 0.15)`.
  * **Skip (⏭️)**: `48px × 48px`, Color `#64748B`, Hover Background `var(--bg-elevated)`.
  * **Superlike (⭐)**: `64px × 64px` (Hero Button), Color `#F59E0B`, Hover Background `rgba(245, 158, 11, 0.15)`.
  * **Like (💚)**: `56px × 56px`, Color `#10B981`, Hover Background `rgba(16, 185, 129, 0.15)`.
  * **Info (ℹ️)**: `48px × 48px`, Color `#94A3B8`, Hover Background `var(--bg-elevated)`.
* **Hover / Press Physics**: `transform: scale(1.12)` on hover, `transform: scale(0.94)` on active click.

### 4.3 Movie Search Grid & Selection Rack
* **Grid**: 4 columns on desktop (`grid-template-columns: repeat(4, 1fr)`), 2 columns on mobile.
* **Movie Poster Cards**: Radius `14px`, image height `200px`, hover elevation `transform: translateY(-3px)`.
* **Selection Rack**: Horizontal thumbnail drawer (`56px × 84px` chips) with quick remove (✕) badge and "Submit Deck" CTA.

### 4.4 Expanded Movie Details Sheet
* **Backdrop**: `rgba(0, 0, 0, 0.75)` with `backdrop-filter: blur(6px)`.
* **Sheet Container**: Max width `560px`, top radius `24px`, background `var(--bg-card)`.
* **Content Layout**: Poster + Title/Rating row, Synopsis section, Director & Cast chip tags, and a full-width "Back to Swiping" button.

### 4.5 Winner Reveal & Leaderboard
* **Winner Showcase Card**: Highlighted with `border: 1px solid var(--border-subtle)`, unanimous badge (`100% Unanimous Match`), total score pill, and duration metadata.
* **Ranked Overlap Leaderboard**: Clean row items displaying rank `#2`, thumbnail, title, match percentage, and points badge.

---

## ⚡ 5. Interaction & Motion Rules

* **Card Drag Physics**:
  * Rotation angle = `deltaX * 0.07 deg`.
  * Swipe threshold: `|deltaX| > 90px` or `deltaY < -80px`.
  * Return transition: `transform 0.25s ease-out`.
  * Throw-out exit animation: `transform 0.35s ease-in, opacity 0.3s`.
* **Keyboard Navigation**:
  * `←` Left Arrow: Pass
  * `→` Right Arrow: Like
  * `↑` Up Arrow: Superlike
  * `Space` / `↓`: Skip
  * `i` / `Enter`: Open Movie Details modal
  * `Escape`: Close Movie Details modal
* **Screen Transitions**: Strict stage isolation with `viewSlideIn` animation (`opacity: 0 -> 1`, `transform: translateY(8px) -> translateY(0)` over `0.3s cubic-bezier(0.16, 1, 0.3, 1)`).
