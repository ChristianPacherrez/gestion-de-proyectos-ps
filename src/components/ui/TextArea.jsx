/**
 * TextArea — bridge component
 *
 * API mirrors Untitled UI's TextArea component.
 * onChange receives the value string directly (React Aria compatible).
 *
 * Props
 *   label?       string
 *   hint?        string
 *   placeholder? string
 *   value        string
 *   onChange     (value: string) => void
 *   rows?        number   (default 3)
 *   maxLength?   number
 *   isInvalid?   boolean
 *   isDisabled?  boolean
 *   isRequired?  boolean
 *   size?        "sm" | "md"
 */

import { useState } from 'react';
import { Label, HintText } from './Input';

// ─── Border helpers (shared logic with Input) ─────────────────────────────────
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

export function TextArea({
  label,
  hint,
  placeholder,
  value,
  onChange,
  rows       = 3,
  maxLength,
  isInvalid  = false,
  isDisabled = false,
  isRequired = false,
  size       = 'md',
  style:     extraStyle,
  onFocus:   onFocusProp,
  onBlur:    onBlurProp,
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);

  const id = rest.id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <Label htmlFor={id} isRequired={isRequired} isInvalid={isInvalid}>
          {label}
        </Label>
      )}

      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={isDisabled}
        required={isRequired}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={isInvalid || undefined}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={(e) => { setIsFocused(true);  onFocusProp?.(e); }}
        onBlur={(e)  => { setIsFocused(false); onBlurProp?.(e);  }}
        style={{
          width:           '100%',
          boxSizing:       'border-box',
          padding:         size === 'sm' ? '8px 12px' : '10px 14px',
          fontSize:        size === 'sm' ? '14px' : '16px',
          lineHeight:      '1.5',
          borderRadius:    '8px',
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
          resize:          'vertical',
          cursor:          isDisabled ? 'not-allowed' : 'text',
          opacity:         isDisabled ? 0.6 : 1,
          ...extraStyle,
        }}
        {...rest}
      />

      {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
    </div>
  );
}

export default TextArea;
