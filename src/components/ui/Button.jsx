// src/components/ui/Button.jsx
'use client'
import { Button as BootstrapButton } from 'react-bootstrap'

export default function Button({ children, variant = 'primary', ...props }) {
  return (
    <BootstrapButton variant={variant} {...props}>
      {children}
    </BootstrapButton>
  )
}