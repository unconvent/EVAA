# Design System & UI Standards

Purpose: Keep visuals consistent and efficient to build, with tokens that map directly to the codebase.

## Design Philosophy
- Focus on clarity and speed to value; reduce cognitive load.
- Use contrast and whitespace to guide attention; avoid clutter.
- Prefer systemized tokens and components over bespoke one-offs.

## Brand & Typography
- Name: BoilerKitt
- Fonts: Geist (sans), Geist Mono (mono)
- Tone: Friendly, confident, modern

## Design Style Guide
- Headlines: concise, outcome-oriented (benefit > feature).
- Body: 14–16px, generous line-height, muted where supportive.
- Buttons: clear hierarchy (primary vs secondary), strong labels.
- Forms: minimal fields, clear validation, helpful placeholders.
- Cards: consistent padding and elevation; keep copy scannable.

## Color Palette
- Accent primary: `--accent` (blue)
- Accent secondary: `--accent-secondary` (orange)
- Backgrounds: `#0c1325` / `#101527` / glass overlays
- Text: slate-100/200; muted: `var(--muted)`
 - Success: emerald-500/600 (subtle usage)
 - Warning: amber-500/600
 - Danger: red-500/600

## Spacing & Radii
- Base unit: 4px; common: 8/12/16/24/32
- Radii: 12px (cards), 24px (CTAs), round for avatars/pills

## Elevation
- Subtle inner rings for glass cards
- Shadows for CTAs and hero elements, avoid heavy drop-shadows on text

## Components
- Navbar: sticky, translucent on inner pages, solid on home
- CTA buttons: primary (`--accent`) and secondary variants, consistent sizes
- Cards: “glass-card” class with ring and gradient overlay
- Forms: compact inputs, clear affordances, visible focus

## States & Feedback
- Buttons: default, hover (brightness +5–10%), disabled (50–60% opacity), loading (spinner or text change)
- Inputs: focus ring (`ring-[var(--accent)]`), error text in red-500, success hints sparingly
- Alerts: short copy with a clear action when possible

## Responsiveness
- Breakpoints: mobile-first; ensure grids collapse 3→1 and 2→1
- Hero text scales 6xl→7xl on large screens

## Imagery
- Avatars carousel, logos marquee; lazy load where possible
- OG/Twitter images programmatically generated (`/opengraph-image`, `/twitter-image`)

## Iconography
- Lucide icons; keep sizes consistent (16/20 for inline, larger for hero)

## Motion
- Limited micro-interactions (hover brightness, slight translate/opacity)
- Respect `prefers-reduced-motion`

## Figma (placeholder)
- Maintain a shared file with: typography scale, color tokens, key components, page templates
