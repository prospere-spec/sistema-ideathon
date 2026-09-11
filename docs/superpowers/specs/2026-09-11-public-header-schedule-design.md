# Public Header And Schedule Design

## Purpose

Make the public ideathon header display the complete Revvolucao mark and keep the schedule available while visitors browse projects on desktop.

## Behavior

- The header renders the official logo asset at a responsive natural aspect ratio, without a clipping container.
- The logo width scales down on narrow viewports so it shares the header with the event status badge.
- The schedule card is sticky within the desktop two-column layout with a small viewport offset.
- Below the `lg` breakpoint, the schedule remains in normal document flow.

## Scope

Only `src/app/ideathons/[slug]/public-ideathon-page.tsx` changes. No API, data, or admin-shell behavior changes are required.
