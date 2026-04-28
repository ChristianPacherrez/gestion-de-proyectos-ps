/**
 * src/components/ui — Untitled UI bridge layer
 *
 * These components mirror the Untitled UI API exactly.
 * When Tailwind v4 + react-aria-components are configured, replace
 * these imports with the real design-system ones:
 *
 *   // Before (bridge)
 *   import { Button } from '@/components/ui';
 *
 *   // After (real Untitled UI)
 *   import { Button } from '@/design-system/components/base/buttons/button';
 */

export { Button }                              from './Button';
export { Input, Label, HintText }              from './Input';
export { TextArea }                            from './TextArea';
export { Select }                              from './Select';
export { Badge, TaskStatusBadge, ProjectStatusBadge } from './Badge';
export { Modal }                               from './Modal';
export { PasswordInput }                       from './PasswordInput';
