/**
 * Input — bridge component
 *
 * API mirrors Untitled UI's Input component.
 * onChange receives the value string directly (React Aria compatible).
 *
 * Props
 *   label?       string
 *   hint?        string   — helper / error text below the input
 *   size?        "sm" | "md" | "lg"   (default "md")
 *   isInvalid?   boolean
 *   isDisabled?  boolean
 *   isRequired?  boolean
 *   icon?        ReactNode | FC
 *   placeholder? string
 *   value        string
 *   onChange     (value: string) => void
 *   type?        string   (default "text")
 *   maxLength?   number
 *   + all native <input> props
 */

import { forwardRef, useState } from 'react';

// ─── Sub-components ───────────────────────────────────────────────────────────

export function Label({ children, isRequired, isInvalid, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display:      'block',
        fontSize:     '14px',
        fontWeight:   500,
        lineHeight:   '20px',
        color:        isInvalid ? '#b42318' : '#344054',
        marginBottom: '0',
      }}
    >
      {children}
      {isRequired && (
        <span style={{ color: '#d92d20', marginLeft: '2px' }} aria-hidden="true">*</span>
      )}
    </label>
  );
}

export function HintText({ children, isInvalid }) {
  if (!children) return null;
  return (
    <p style={{
      margin:     '0',
      fontSize:   '14px',
      lineHeight: '20px',
      color:      isInvalid ? '#d92d20' : '#475467',
    }}>
      {children}
    </p>
  );
}

// ─── Size tokens ──────────────────────────────────────────────────────────────
const SIZES = {
  sm: { padding: '8px 12px',  paddingX: '12px', fontSize: '14px', lineHeight: '20px', borderRadius: '8px' },
  md: { padding: '10px 14px', paddingX: '14px', fontSize: '16px', lineHeight: '24px', borderRadius: '8px' },
  lg: { padding: '10px 14px', paddingX: '14px', fontSize: '16px', lineHeight: '24px', borderRadius: '8px' },
};

// ─── Border helpers — always specific props, never the shorthand ──────────────
function borderColor(isInvalid, isFocused) {
  if (isFocused) return isInvalid ? '#f97066' : '#9e77ed';
  return isInvalid ? '#fda29b' : '#d0d5dd';
}

function boxShadow(isFocused, isInvalid) {
  if (!isFocused) return '0px 1px 2px rgba(16,24,40,0.05)';
  return isInvalid
    ? '0 0 0 4px rgba(240,68,56,0.12)'
    : '0 0 0 4px rgba(158,119,237,0.12)';
}

// ─── Component ────────────────────────────────────────────────────────────────
export const Input = forwardRef(function Input(
  {
    label,
    hint,
    size       = 'md',
    isInvalid  = false,
    isDisabled = false,
    isRequired = false,
    icon:      Icon,
    placeholder,
    value,
    onChange,
    type       = 'text',
    maxLength,
    style:     extraStyle,
    // Extract focus/blur so we can compose them without losing consumer handlers
    onFocus:   onFocusProp,
    onBlur:    onBlurProp,
    ...rest
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);

  const sizing = SIZES[size] ?? SIZES.md;
  const id     = rest.id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <Label htmlFor={id} isRequired={isRequired} isInvalid={isInvalid}>
          {label}
        </Label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <span style={{
            position:      'absolute',
            left:          '12px',
            display:       'flex',
            alignItems:    'center',
            pointerEvents: 'none',
            color:         '#667085',
          }}>
            {typeof Icon === 'function' ? <Icon style={{ width: '16px', height: '16px' }} /> : Icon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={isDisabled}
          required={isRequired}
          maxLength={maxLength}
          aria-invalid={isInvalid || undefined}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={(e) => { setIsFocused(true);  onFocusProp?.(e); }}
          onBlur={(e)  => { setIsFocused(false); onBlurProp?.(e);  }}
          style={{
            width:           '100%',
            boxSizing:       'border-box',
            padding:         sizing.padding,
            paddingLeft:     Icon ? '38px' : sizing.paddingX,
            fontSize:        sizing.fontSize,
            lineHeight:      sizing.lineHeight,
            borderRadius:    sizing.borderRadius,
            // Specific border props only — never mix with the `border` shorthand
            borderWidth:     '1px',
            borderStyle:     'solid',
            borderColor:     borderColor(isInvalid, isFocused),
            backgroundColor: isDisabled ? '#f9fafb' : '#fff',
            color:           '#101828',
            outline:         'none',
            transition:      'border-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow:       boxShadow(isFocused, isInvalid),
            fontFamily:      'inherit',
            cursor:          isDisabled ? 'not-allowed' : (type === 'date' || type === 'time') ? 'pointer' : 'text',
            // Force the native date/time picker to always render in light mode.
            // Without this, macOS dark mode causes Chrome to render the widget
            // controls with near-invisible contrast (looks like a plain text field).
            colorScheme:     (type === 'date' || type === 'time') ? 'light' : undefined,
            opacity:         isDisabled ? 0.6 : 1,
            ...extraStyle,
          }}
          {...rest}
        />
      </div>

      {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
    </div>
  );
});

export default Input;
