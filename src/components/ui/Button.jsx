/**
 * Button — bridge component
 *
 * API mirrors Untitled UI's Button exactly.
 * Swap the import for the real component once Tailwind + react-aria are set up.
 *
 * Props
 *   color?    "primary" | "secondary" | "tertiary" | "link-color" | "link-gray"
 *             | "primary-destructive" | "secondary-destructive" | "tertiary-destructive"
 *   size?     "xs" | "sm" | "md" | "lg" | "xl"   (default "sm")
 *   isDisabled?  boolean
 *   isLoading?   boolean
 *   iconLeading?   ReactNode | FC
 *   iconTrailing?  ReactNode | FC
 *   type?     "button" | "submit" | "reset"
 *   + all native <button> props
 */

import { useState } from 'react';

// ─── Design tokens (matches Untitled UI palette) ──────────────────────────────

// All border values use the three specific properties (borderWidth + borderStyle + borderColor)
// instead of the `border` shorthand. This avoids React's "conflicting property" warning
// when shorthand and specific properties appear in the same style object across rerenders.
const COLORS = {
  primary: {
    base:  { backgroundColor: '#7f56d9', color: '#fff', borderWidth: '1px', borderStyle: 'solid', borderColor: '#6941c6', boxShadow: '0px 1px 2px rgba(0,0,0,0.05), inset 0px -1px 0px rgba(0,0,0,0.08)' },
    hover: { backgroundColor: '#6941c6', borderColor: '#53389e' },
    focus: { outline: '2px solid rgba(127,86,217,0.5)', outlineOffset: '2px' },
  },
  secondary: {
    base:  { backgroundColor: '#fff', color: '#344054', borderWidth: '1px', borderStyle: 'solid', borderColor: '#d0d5dd', boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' },
    hover: { backgroundColor: '#f9fafb', borderColor: '#d0d5dd' },
    focus: { outline: '2px solid rgba(127,86,217,0.4)', outlineOffset: '2px' },
  },
  tertiary: {
    base:  { backgroundColor: 'transparent', color: '#344054', borderWidth: '1px', borderStyle: 'solid', borderColor: 'transparent', boxShadow: 'none' },
    hover: { backgroundColor: '#f9fafb' },
    focus: { outline: '2px solid rgba(127,86,217,0.4)', outlineOffset: '2px' },
  },
  'link-color': {
    base:  { backgroundColor: 'transparent', color: '#6941c6', borderWidth: '1px', borderStyle: 'solid', borderColor: 'transparent', boxShadow: 'none', padding: '0', textDecoration: 'underline', textDecorationColor: 'transparent' },
    hover: { color: '#53389e', textDecorationColor: '#53389e' },
    focus: { outline: 'none' },
  },
  'link-gray': {
    base:  { backgroundColor: 'transparent', color: '#475467', borderWidth: '1px', borderStyle: 'solid', borderColor: 'transparent', boxShadow: 'none', padding: '0', textDecoration: 'underline', textDecorationColor: 'transparent' },
    hover: { color: '#344054', textDecorationColor: '#667085' },
    focus: { outline: 'none' },
  },
  'primary-destructive': {
    base:  { backgroundColor: '#d92d20', color: '#fff', borderWidth: '1px', borderStyle: 'solid', borderColor: '#b42318', boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' },
    hover: { backgroundColor: '#b42318' },
    focus: { outline: '2px solid rgba(217,45,32,0.4)', outlineOffset: '2px' },
  },
  'secondary-destructive': {
    base:  { backgroundColor: '#fff', color: '#d92d20', borderWidth: '1px', borderStyle: 'solid', borderColor: '#fda29b', boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' },
    hover: { backgroundColor: '#fff3f2', borderColor: '#fda29b' },
    focus: { outline: '2px solid rgba(217,45,32,0.3)', outlineOffset: '2px' },
  },
  'tertiary-destructive': {
    base:  { backgroundColor: 'transparent', color: '#d92d20', borderWidth: '1px', borderStyle: 'solid', borderColor: 'transparent', boxShadow: 'none' },
    hover: { backgroundColor: '#fff3f2' },
    focus: { outline: '2px solid rgba(217,45,32,0.3)', outlineOffset: '2px' },
  },
};

const SIZES = {
  xs: { padding: '6px 10px',  fontSize: '12px', fontWeight: 600, borderRadius: '8px', lineHeight: '18px', gap: '4px', iconSize: '14px' },
  sm: { padding: '8px 12px',  fontSize: '14px', fontWeight: 600, borderRadius: '8px', lineHeight: '20px', gap: '4px', iconSize: '16px' },
  md: { padding: '10px 14px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', lineHeight: '20px', gap: '6px', iconSize: '16px' },
  lg: { padding: '10px 16px', fontSize: '16px', fontWeight: 600, borderRadius: '8px', lineHeight: '24px', gap: '6px', iconSize: '18px' },
  xl: { padding: '12px 18px', fontSize: '16px', fontWeight: 600, borderRadius: '8px', lineHeight: '24px', gap: '6px', iconSize: '18px' },
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = '16px' }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      <style>{`@keyframes _btn_spin { to { transform: rotate(360deg); } }`}</style>
      <svg
        width={size} height={size} viewBox="0 0 20 20" fill="none"
        style={{ animation: '_btn_spin 0.65s linear infinite', flexShrink: 0 }}
      >
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"
          strokeDasharray="12.5 50" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Button({
  color    = 'primary',
  size     = 'sm',
  isDisabled,
  isLoading,
  iconLeading:  IconLeading,
  iconTrailing: IconTrailing,
  type     = 'button',
  onClick,
  style: extraStyle,
  children,
  ...rest
}) {
  const [hovered, setHovered] = useState(false);

  const scheme = COLORS[color] ?? COLORS.primary;
  const sizing = SIZES[size]   ?? SIZES.sm;

  const disabled = isDisabled || isLoading;

  const baseStyle = {
    display:         'inline-flex',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             sizing.gap,
    padding:         sizing.padding,
    fontSize:        sizing.fontSize,
    fontWeight:      sizing.fontWeight,
    lineHeight:      sizing.lineHeight,
    borderRadius:    sizing.borderRadius,
    fontFamily:      'inherit',
    cursor:          disabled ? 'not-allowed' : 'pointer',
    opacity:         disabled ? 0.5 : 1,
    transition:      'background-color 0.1s ease, border-color 0.1s ease, color 0.1s ease, opacity 0.1s ease',
    whiteSpace:      'nowrap',
    textDecoration:  'none',
    outline:         'none',
    ...scheme.base,
    ...(hovered && !disabled ? scheme.hover : {}),
    ...extraStyle,
  };

  function resolveIcon(Icon) {
    if (!Icon) return null;
    const s = sizing.iconSize;
    if (typeof Icon === 'function') {
      return <Icon style={{ width: s, height: s, flexShrink: 0 }} />;
    }
    return Icon;
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...rest}
    >
      {isLoading
        ? <Spinner size={sizing.iconSize} />
        : resolveIcon(IconLeading)}

      {children && (
        <span style={{ display: 'inline-block' }}>{children}</span>
      )}

      {!isLoading && resolveIcon(IconTrailing)}
    </button>
  );
}

export default Button;
