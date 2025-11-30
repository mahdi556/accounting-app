// src/app/vouchers/create/page.js
'use client'
import { Container, Card } from 'react-bootstrap'
import VoucherForm from '@components/forms/VoucherForm'

export default function CreateVoucher() {
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>ثبت سند جدید</h1>
      </div>

      <Card>
        <Card.Body>
          <VoucherForm />
        </Card.Body>
      </Card>
    </Container>
  )
}