/**
 * theme.ts
 * Central design-token file for the app.
 * All colours, spacing values, and component-level measurements live here
 * so that styles stay consistent across screens and are easy to update in one place.
 */

// --- Colour palette ---
// Matches the Figma "High-Fidelity Android UI Mockup" dark-green / gold design system.
export const colors = {
  background: "#0B3D2E",                    // Dark green — main screen background
  foreground: "#F5F0E8",                    // Cream — body text on dark backgrounds
  card: "#0F4D39",                          // Medium green — card / surface background
  muted: "#0F4D39",                         // Same as card; used for muted surfaces
  mutedForeground: "rgba(245, 240, 232, 0.6)", // 60 % cream — secondary / placeholder text
  primary: "#F5F0E8",                       // Cream — primary text colour
  accent: "#C9A84C",                        // Gold — buttons, active states, highlights
  border: "rgba(245, 240, 232, 0.1)",       // Subtle cream border on dark surfaces
  success: "#16a34a",                       // Green — success states
  destructive: "#d4183d",                   // Red — destructive actions (delete, error)
  subscription: "#1a5c46",                  // Slightly lighter green — expanded card background
} as const;

// --- Spacing scale ---
// 4-pt base grid. Keys map directly to Tailwind spacing utilities (e.g. spacing[5] === p-5 === 20px).
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  18: 72,
  20: 80,
  24: 96,
  30: 120,
} as const;

// --- Component measurements ---
// Pixel-level dimensions for shared UI components that need inline styles.
export const components = {
  // Bottom tab bar dimensions used by the custom TabIcon and Expo Router Tabs config.
  tabBar: {
    height: spacing[18],              // Total bar height (72px)
    horizontalInset: spacing[5],      // Side margin and bottom offset from screen edge (20px)
    radius: spacing[8],               // Corner radius of the bar (32px)
    iconFrame: spacing[7],            // Icon bounding-box size (28px)
    itemPaddingVertical: spacing[1],  // Vertical padding inside each tab item (4px)
  },
} as const;

// --- Unified theme export ---
// Convenience object that bundles all tokens; import `theme` when you need everything at once.
export const theme = {
  colors,
  spacing,
  components,
} as const;
