// src/app/cheques/create/page.js
'use client'
import { Container, Card } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import ChequeForm from '@components/forms/ChequeForm'

export default function CreateCheque() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/cheques')
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">ثبت چک جدید</h1>
          <p className="text-muted mb-0">ثبت چک‌های دریافتنی و پرداختنی با سند حسابداری خودکار</p>
        </div>
      </div>

      <Card>
        <Card.Body>
          <ChequeForm onSuccess={handleSuccess} />
        </Card.Body>
      </Card>
    </Container>
  )
}