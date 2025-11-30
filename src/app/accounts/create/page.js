// src/app/accounts/create/page.js
'use client'
import { Container, Card } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import AccountForm from '@components/forms/AccountForm'

export default function CreateAccount() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/accounts')
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>ایجاد حساب جدید</h1>
      </div>

      <Card>
        <Card.Body>
          <AccountForm onSuccess={handleSuccess} />
        </Card.Body>
      </Card>
    </Container>
  )
}