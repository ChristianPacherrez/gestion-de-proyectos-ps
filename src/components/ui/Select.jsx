/**
 * Select — bridge component
 *
 * API mirrors Untitled UI's Select component.
 * onChange receives the value string directly (React Aria compatible).
 *
 * Props
 *   items     { value: string, label: string }[]
 *   value     string
 *   onChange  (value: string) => void
 *   label?    string
 *   hint?     string
 *   placeholder? string
 *   size?     "sm" | "md" | "lg"
 *   isRequired?  boolean
 *   isInvalid?   boolean
 *   isDisabled?  boolean
 */

import { useState } from 'react';
import { Label, HintText } from './Input';

// ─── Border helpers (shared logic with Input/TextArea) ────────────────────────
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

export function Select({
  items       = [],
  value,
  onChange,
  label,
  hint,
  placeholder,
  size        = 'md',
  isRequired  = false,
  isInvalid   = false,
  isDisabled  = false,
  style:      extraStyle,
  onFocus:    onFocusProp,
  onBlur:     onBlurProp,
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);

  const id = rest.id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  const padding = size === 'sm'
    ? '8px 32px 8px 12px'
    : size === 'lg'
      ? '12px 36px 12px 14px'
      : '10px 34px 10px 14px';

  const fontSize = size === 'sm' ? '14px' : '16px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <Label htmlFor={id} isRequired={isRequired} isInvalid={isInvalid}>
          {label}
        </Label>
      )}

      <div style={{ position: 'relative' }}>
        <select
          id={id}
          value={value ?? ''}
          disabled={isDisabled}
          required={isRequired}
          aria-invalid={isInvalid || undefined}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={(e) => { setIsFocused(true);  onFocusProp?.(e); }}
          onBlur={(e)  => { setIsFocused(false); onBlurProp?.(e);  }}
          style={{
            width:           '100%',
            appearance:      'none',
            boxSizing:       'border-box',
            padding,
            fontSize,
            lineHeight:      '24px',
            borderRadius:    '8px',
            // Specific border props only — never mix with the `border` shorthand
            borderWidth:     '1px',
            borderStyle:     'solid',
            borderColor:     borderColor(isInvalid, isFocused),
            backgroundColor: isDisabled ? '#f9fafb' : '#fff',
            color:           value ? '#101828' : '#667085',
            outline:         'none',
            transition:      'border-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow:       boxShadow(isFocused, isInvalid),
            fontFamily:      'inherit',
            cursor:          isDisabled ? 'not-allowed' : 'pointer',
            opacity:         isDisabled ? 0.6 : 1,
            ...extraStyle,
          }}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        {/* Chevron icon */}
        <span style={{
          position:      'absolute',
          right:         '12px',
          top:           '50%',
          transform:     'translateY(-50%)',
          pointerEvents: 'none',
          color:         '#667085',
          display:       'flex',
          alignItems:    'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
    </div>
  );
}

export default Select;
