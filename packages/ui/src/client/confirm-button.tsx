'use client';
import type { MouseEvent } from 'react';
import { Button, type ButtonProps } from '../components/button';

export interface ConfirmButtonProps extends ButtonProps {
  confirmText: string;
}

export function ConfirmButton({ confirmText, onClick, ...props }: ConfirmButtonProps) {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmText)) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  }
  return <Button onClick={handleClick} {...props} />;
}
