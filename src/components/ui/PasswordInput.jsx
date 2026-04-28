/**
 * PasswordInput — Untitled UI bridge component.
 *
 * Campo de contraseña con toggle mostrar/ocultar.
 * Mira el API de Input exactamente — misma estructura visual.
 *
 * Props
 *   label?       string
 *   hint?        string     — helper / error text below the input
 *   size?        "sm" | "md"  (default "md")
 *   isInvalid?   boolean
 *   isDisabled?  boolean
 *   isRequired?  boolean
 *   placeholder? string
 *   value        string
 *   onChange     (value: string) => void
 *   autoComplete? string    (default "current-password")
 *   + all native <input> props (except type — controlled internally)
 */

import { forwardRef, useState } from 'react';
import { Label, HintText }      from './Input';

// ─── Size tokens (same as Input) ──────────────────────────────────────────────
const SIZES = {
  sm: { padding: '8px 12px',  paddingX: '12px', fontSize: '14px', lineHeight: '20px', borderRadius: '8px' },
  md: { padding: '10px 14px', paddingX: '14px', fontSize: '16px', lineHeight: '24px', borderRadius: '8px' },
};

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

// ─── Eye icons ────────────────────────────────────────────────────────────────
function EyeOpen() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ─── PasswordInput ────────────────────────────────────────────────────────────
export const PasswordInput = forwardRef(function PasswordInput(
  {
    label,
    hint,
    size         = 'md',
    isInvalid    = false,
    isDisabled   = false,
    isRequired   = false,
    placeholder,
    value,
    onChange,
    autoComplete = 'current-password',
    onFocus:     onFocusProp,
    onBlur:      onBlurProp,
    style:       extraStyle,
    ...rest
  },
  ref,
) {
  const [show,    setShow]    = useState(false);
  const [focused, setFocused] = useState(false);

  const sizing = SIZES[size] ?? SIZES.md;
  const id     = rest.id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : 'password-field');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <Label htmlFor={id} isRequired={isRequired} isInvalid={isInvalid}>
          {label}
        </Label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={ref}
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          disabled={isDisabled}
          required={isRequired}
          autoComplete={autoComplete}
          aria-invalid={isInvalid || undefined}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={(e) => { setFocused(true);  onFocusProp?.(e); }}
          onBlur={(e)  => { setFocused(false); onBlurProp?.(e);  }}
          style={{
            width:           '100%',
            boxSizing:       'border-box',
            padding:         sizing.padding,
            paddingRight:    '44px',  // reserve space for the eye button
            fontSize:        sizing.fontSize,
            lineHeight:      sizing.lineHeight,
            borderRadius:    sizing.borderRadius,
            borderWidth:     '1px',
            borderStyle:     'solid',
            borderColor:     borderColor(isInvalid, focused),
            backgroundColor: isDisabled ? '#f9fafb' : '#fff',
            color:           '#101828',
            outline:         'none',
            transition:      'border-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow:       boxShadow(focused, isInvalid),
            fontFamily:      'inherit',
            cursor:          isDisabled ? 'not-allowed' : 'text',
            opacity:         isDisabled ? 0.6 : 1,
            ...extraStyle,
          }}
          {...rest}
        />

        {/* Show / hide toggle */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={{
            position:        'absolute',
            right:           '12px',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           '24px',
            height:          '24px',
            padding:         0,
            border:          'none',
            background:      'transparent',
            color:           '#98a2b3',
            cursor:          'pointer',
            borderRadius:    '4px',
            transition:      'color 0.12s ease',
            flexShrink:      0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#667085'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#98a2b3'; }}
        >
          {show ? <EyeOff /> : <EyeOpen />}
        </button>
      </div>

      {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
    </div>
  );
});

export default PasswordInput;
