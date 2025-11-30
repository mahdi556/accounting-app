// src/components/ui/Table.jsx
'use client'
import { Table as BootstrapTable } from 'react-bootstrap'

export default function Table({ children, striped = true, bordered = true, hover = true, ...props }) {
  return (
    <BootstrapTable striped={striped} bordered={bordered} hover={hover} {...props}>
      {children}
    </BootstrapTable>
  )
}