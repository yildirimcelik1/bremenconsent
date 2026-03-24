

# Glassmorphism / Apple-Style Premium Redesign

Transform the entire UI into a modern glassmorphism aesthetic inspired by Apple's design language -- frosted glass cards, subtle gradients, smooth shadows, backdrop blur effects, and refined typography.

## Design Direction

- **Background**: Subtle gradient mesh (light purples/blues/teals) instead of flat gray
- **Cards**: Semi-transparent white with backdrop-blur (frosted glass effect), subtle white borders
- **Sidebar**: Dark translucent glass with blur effect
- **Inputs**: Frosted glass style with subtle transparency
- **Buttons**: Gradient accents with smooth hover transitions
- **Typography**: Inter font (Apple's web equivalent) with refined weights
- **Shadows**: Multi-layered soft shadows for depth
- **Border radius**: Increased to 0.75rem-1rem for rounder, softer feel
- **Status badges**: Frosted glass pills with colored accents
- **Login page**: Full-screen gradient background with centered glass card

## Files to Modify

### 1. `src/index.css` -- Core theme variables & global styles
- Change font from DM Sans to Inter
- Update CSS variables for glass-friendly colors (semi-transparent cards, softer borders)
- Add gradient background utility classes
- Add `.glass` utility class for reusable glassmorphism effect
- Add animated gradient mesh background for body/main areas
- Increase `--radius` to `0.75rem`

### 2. `tailwind.config.ts` -- Extended theme
- Add backdrop-blur utilities if needed
- Add custom gradient colors

### 3. `src/components/DashboardLayout.tsx` -- Layout shell
- Gradient mesh background on main container
- Sidebar: dark glass effect with backdrop-blur
- Header: frosted glass bar with border-bottom blur
- Add smooth transitions

### 4. `src/pages/Auth.tsx` -- Login page
- Full gradient background with animated mesh
- Glass card with backdrop-blur, semi-transparent white bg
- Refined icon container with gradient
- Softer input styling

### 5. `src/pages/AdminDashboard.tsx` -- Admin page
- Stats cards with glass effect
- Tables inside glass cards
- Subtle hover effects on rows

### 6. `src/pages/DesignerDashboard.tsx` -- Designer page
- Same glass card treatment as admin

### 7. `src/components/ui/card.tsx` -- Base Card component
- Default glass styling: `bg-white/60 backdrop-blur-xl border-white/20 shadow-lg`

### 8. `src/components/ui/button.tsx` -- Button variants
- Primary: gradient background (teal-to-blue or accent gradient)
- Outline: glass effect with subtle border
- Ghost: transparent with subtle hover glass

### 9. `src/components/ui/input.tsx` -- Input fields
- Semi-transparent background with backdrop blur
- Softer border color

### 10. `src/components/StatusBadge.tsx` -- Status pills
- Glass pill style with colored tint

### 11. `src/components/SignaturePad.tsx` -- Signature area
- Glass container for signature canvas

### 12. `src/components/forms/TattooConsentForm.tsx` & `PiercingConsentForm.tsx`
- Consent text boxes with glass effect instead of muted background

### 13. `src/components/ui/dialog.tsx` -- Modals
- Glass effect on dialog content with backdrop blur

### 14. `src/pages/ConsentFormPage.tsx` -- Type selector cards
- Glass hover effect on tattoo/piercing selection cards

## Visual Result
- Premium, polished look similar to macOS/iOS system panels
- Frosted glass cards floating over a soft gradient background
- Smooth micro-interactions and transitions
- Professional yet visually striking internal tool

