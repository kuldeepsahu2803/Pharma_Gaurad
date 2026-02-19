# Frontend Design Guidelines: PharmaGuard AI

## 1. DESIGN PRINCIPLES
PharmaGuard AI is a clinical instrument. Every pixel must serve the clinician's decision-making process.

- **Clarity:** Risk status (Safe/Toxic/Adjust) must be readable in <1 second via redundant cues (color + icon + text).
- **Trust:** Use a clean, medical-grade aesthetic. Avoid playful shadows, gradients, or non-essential decorations.
- **Safety-First:** Warning and Error states must be prominent. Never obscure safety-critical data (Risk Labels, Severity).
- **Accessibility:** WCAG 2.1 AA compliance is mandatory. Risk colors must maintain a 4.5:1 contrast ratio against their respective backgrounds.

---

## 2. DESIGN TOKENS

### Color Palette
| Token | Category | Hex | Tailwind Class |
| :--- | :--- | :--- | :--- |
| **Primary** | Brand | `#0d9488` | `bg-teal-600` |
| **Safe** | Risk | `#10b981` | `text-emerald-500` |
| **Adjust** | Risk | `#f59e0b` | `text-amber-500` |
| **Toxic** | Risk | `#ef4444` | `text-red-500` |
| **Unknown** | Risk | `#9ca3af` | `text-gray-400` |
| **Background** | Neutrals | `#0F1117` | `bg-[#0F1117]` |
| **Surface** | Neutrals | `#1A1D27` | `bg-[#1A1D27]` |
| **Border** | Neutrals | `#2E3147` | `border-[#2E3147]` |

### Typography
- **Primary Font:** `Public Sans`, sans-serif (Standard clinical readability).
- **Mono Font:** `JetBrains Mono`, monospace (Used for rsIDs, diplotypes, and JSON payloads).
- **Weights:** 400 (Regular), 600 (Semibold), 900 (Black - used for Drug Titles).

### Spacing & Shadows
- **Base Unit:** `0.25rem` (4px).
- **Radii:** `0.75rem` (12px) for cards; `0.5rem` (8px) for buttons.
- **Shadows:** `shadow-2xl` for the result detail panel; `shadow-lg shadow-teal-500/10` for primary actions.

---

## 3. RISK BADGE COMPONENT
The core PS1 identity element. Must be implemented as a specialized chip.

```jsx
// Base Classes: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider"

// Safe State
<div className="text-[#22C55E] bg-green-950/40 border-green-800">
  <CheckCircle2 size={12} /> SAFE
</div>

// Adjust Dosage State
<div className="text-[#F59E0B] bg-amber-950/40 border-amber-800">
  <TriangleAlert size={12} /> ADJUST DOSAGE
</div>

// Toxic / Ineffective State
<div className="text-[#EF4444] bg-red-950/40 border-red-800">
  <OctagonX size={12} /> TOXIC
</div>
```

---

## 4. COMPONENT LIBRARY

### VCF Upload Zone
- **Idle:** `border-2 border-dashed border-[#2E3147] hover:border-[#4F8EF7] bg-transparent transition-all`
- **Drag-over:** `border-[#4F8EF7] bg-[#4F8EF7]/5 animate-pulse`
- **Loaded:** `border-emerald-500/50 bg-emerald-500/5`
- **Error:** `border-red-500/50 bg-red-500/5`

### Drug Selection Chip
- **Unselected:** `bg-[#1A1D27] border-[#2E3147] text-[#8B90A7] hover:border-[#F0F2F8]`
- **Selected:** `bg-[#4F8EF7]/10 border-[#4F8EF7] text-[#4F8EF7]`
- **Disabled:** `opacity-40 grayscale cursor-not-allowed`

### Drug Result Card
- **Layout:** Master-Detail (Left rail nav + Right detail panel).
- **Accent:** 4px left-border status strip colored by risk level.
- **Header:** Drug name (28px font-black) + Confidence score (JetBrains Mono).
- **Reasoning:** Watermarked AI background text for provenance.

### JSON Output Panel
- **Background:** `#0F1117`
- **Styling:**
  - Keys: `#4F8EF7` (Blue)
  - String Values: `#F59E0B` (Orange)
  - Booleans: `#EF4444` (Red/False) or `#22C55E` (Green/True)
  - Numbers: `#F0F2F8` (White)

---

## 5. CLINICIAN VS PATIENT MODE
The `viewMode` state transforms the UI's semantic density:

- **Clinician Mode (Default):**
  - Phenotypes: `PM`, `IM`, `NM`, `RM`, `URM`.
  - Evidence: Displays raw VCF line and `rsID` in the variants table.
  - Explanation: Direct, mechanism-focused medical language.
- **Patient Mode:**
  - Phenotypes: `Slow metabolizer`, `Normal metabolizer`, `Fast metabolizer`.
  - Evidence: Hides raw VCF lines; focuses on general clinical caveats.
  - Explanation: Simplified summaries (e.g., "Your body processes this drug differently than most people").

---

## 6. ACCESSIBILITY CHECKLIST
- [ ] **Contrast:** All text on background >= 4.5:1.
- [ ] **Redundancy:** Risk labels use icons (Circle, Triangle, Octagon) so color-blind clinicians can differentiate status.
- [ ] **Focus:** `focus-visible:outline-2 focus-visible:outline-[#4F8EF7] focus-visible:outline-offset-4`.
- [ ] **Screen Readers:** Use `aria-label` for all icon-only buttons (Reset, Copy, Download).

---

## 7. ANIMATION GUIDELINES
Follow the **"Clinical Settle"** easing: `cubic-bezier(0.4, 0, 0.2, 1)`.

- **Page Entrance:** `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}` (400ms).
- **Card Stagger:** Delay of `0.08s` per card to simulate data streaming.
- **Metabolic Timeline:** Sequential node reveal (150ms per node) using Framer Motion's `staggerChildren`.
- **Mode Toggle:** `mode="wait"` crossfade (200ms) to prevent layout jumping.

---

## 8. ICON SYSTEM (LUCIDE REACT)
- **Safe:** `ShieldCheck`
- **Warning:** `TriangleAlert`
- **Danger:** `OctagonX`
- **AI/Sparkles:** `Sparkles`
- **Genetics:** `Dna`
- **Mechanism:** `Activity`
- **Lab:** `FlaskConical`
