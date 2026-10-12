# Design System: PaTo (Patungan Otomatis)

## 1. Visual Theme & Atmosphere
An ultra-crisp, light-dominant financial utility designed for frictionless social bill-splitting. The aesthetic feels like a high-end Scandinavian fintech crossed with a tactile physical receipt — clean, airy, highly structured, yet modern and warm. 
- **Density:** 6/10 (Daily App Balanced — high scannability for itemized line items, currency, and participant chips).
- **Variance:** 6/10 (Offset Asymmetric — breaking rigid corporate structures with fluid item tags, receipt torn-edge cues, and asymmetrical summaries).
- **Motion:** 6/10 (Fluid Spring Physics — tactile button feedback, weighted modal sheets, and smooth balance tally counters).

## 2. Color Palette & Roles
- **Canvas Base:** `#F8FAFC` (Slate-50) — Dominant ultra-clean background surface (80% of visual weight).
- **Elevated Surface:** `#FFFFFF` (Pure White) — Card containers, bottom sheets, floating claim panels.
- **Surface Muted:** `#F1F5F9` (Slate-100) — Sub-containers, inactive chips, tabular alternating rows.
- **Border Structural:** `#E2E8F0` (Slate-200) — 1px crisp separation borders.
- **Border Subtle:** `rgba(226, 232, 240, 0.6)` — Soft internal dividers.
- **Primary Brand:** `#4477BB` (PaTo Cerulean) — Primary action buttons, active tab indicators, progress fills, verified checkmarks.
- **Secondary Tint:** `#7CA4D6` (Soft Cerulean) — Hover states, chip selection rings, subtle tint overlays (`rgba(124, 164, 214, 0.12)`).
- **Text Primary:** `#0F172A` (Slate-900) — High-contrast headlines, line items, monetary values (strictly no pure black `#000000`).
- **Text Secondary:** `#64748B` (Slate-500) — Metadata, quantity labels, helper timestamps.
- **Success Accent:** `#10B981` (Emerald-500) — Payment settled status, verified receipts.
- **Warning / Alert:** `#F59E0B` (Amber-500) — Pending review, OCR confidence review.

## 3. Typography Architecture
- **Display / Headlines:** `Plus Jakarta Sans` (Weights: 600 SemiBold, 700 Bold) — Tight tracking (-0.02em), modern geometric humanist curves.
- **Body / Interface:** `Plus Jakarta Sans` (Weights: 400 Regular, 500 Medium) — Relaxed leading (1.5), maximum 65 characters per line.
- **Numerical / Financial / Timestamps:** `JetBrains Mono` (Weights: 500 Medium, 600 SemiBold) — Tabular figures (`tnum`) for all Rupiah currency (IDR), receipt math, percentages, countdown timers.
- **Banned Typography:** `Inter` (strictly banned), generic system fonts, Times New Roman, or any serif font in calculation views.

## 4. Component Stylings
- **Buttons:** 
  - Primary: Solid `#4477BB` with white text, 12px border radius, subtle downward shadow (`0 2px 4px rgba(68, 119, 187, 0.15)`), active state tactile depression (`translate-y-px`).
  - Secondary / Outline: `#FFFFFF` fill with 1px border `#E2E8F0`, text `#0F172A`, active hover `#F8FAFC`.
  - Destructive: `#FEF2F2` background, `#DC2626` text, 1px border `#FEE2E2`.
- **Cards & Sheets:** 
  - Generously rounded corners (16px to 24px).
  - Clean 1px `#E2E8F0` border with diffused whisper elevation (`box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04)`).
  - No card-nesting deeper than 2 levels. Use hairline dividers for internal segmentation.
- **Input Fields:**
  - Crisp white surface `#FFFFFF`, 1px `#E2E8F0` border, 12px radius.
  - Focus state: 1px border `#4477BB` with 3px focus ring `rgba(68, 119, 187, 0.15)`.
  - Floating or top-aligned labels, inline error messages with clear visual cues.
- **Member Chips & Claim Pills:**
  - Default: Light pill `#F1F5F9`, text `#475569`, 8px radius.
  - Selected / Active Claim: Tinted `#EEF4FB`, 1.5px border `#4477BB`, text `#4477BB`, bold weight.
- **Currency & Calculation Displays:**
  - Prominent numbers in `JetBrains Mono`. Currency symbol ("Rp") rendered in 70% opacity and smaller font size.
- **Status Badges:**
  - Micro-capsule pills (height 24px), font size 12px, font-weight 600.
  - "Lunas" / Paid: Background `#ECFDF5`, text `#065F46`, border `#A7F3D0`.
  - "Menunggu" / Pending: Background `#FFFBEB`, text `#92400E`, border `#FDE68A`.

## 5. Layout & Spatial Principles
- **Grid Architecture:** 8px base grid system (`gap-2`, `gap-4`, `gap-6`).
- **Container Sizing:** Mobile viewport primary (390px - 430px container width for mobile, responsive max-width 640px centered on desktop).
- **Navigation:** Bottom-docked sticky summary bar on mobile for instant "Your Total Claim" visibility.
- **Header Structure:** Clean top bar featuring PaTo logo mark, active room code capsule, and sharing trigger.
- **Touch Targets:** Strict minimum 44px x 44px tap zone for all clickable items, toggles, and participant chips.
- **Zero Clutter:** Generous whitespace around numerical balances to prevent calculation anxiety.

## 6. Motion Philosophy & Micro-Interactions
- **Spring Parameters:** `stiffness: 260, damping: 24` for pop-ins and bottom sheets.
- **Currency Roll:** Animated counting up/down when items are toggled on or off.
- **Receipt Scan Micro-state:** Linear scanner beam animation over the uploaded receipt preview.
- **Tactile Haptic Feel:** Micro-scale transitions (`scale(0.97)`) on card tap and button trigger.

## 7. Explicit Anti-Patterns (Strictly Banned)
- NO emojis anywhere in the UI (use clean SVG icons or typographic initials instead).
- NO `Inter` font.
- NO pure black `#000000` text or backgrounds.
- NO neon glows, cyber gradients, or dark purple gradients.
- NO equal 3-column feature grids on mobile.
- NO marketing buzzwords ("Seamless", "Revolutionary", "AI-Powered Magic"). Use direct, honest copy ("Bagi Tagihan Tanpa Ribet", "Transparan & Akurat").
- NO circular indeterminate spinners. Use skeletal shimmering placeholders matching item card heights.
- NO modal blocking without clear dismiss handles.
