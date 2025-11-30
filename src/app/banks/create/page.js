// src/app/banks/create/page.js
'use client'
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreateBank() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    balance: '0'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('حساب بانکی جدید با موفقیت ایجاد شد')
        router.push('/banks')
      } else {
        const error = await response.json()
        alert(`خطا: ${error.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('خطا در ایجاد حساب بانکی')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>افزودن حساب بانکی جدید</h1>
      </div>

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit} className="rtl">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>نام حساب *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    placeholder="مثال: بانک ملی - حساب جاری"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>شماره حساب</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                    placeholder="شماره حساب بانکی"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>موجودی اولیه</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => handleChange('balance', e.target.value)}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={loading}
              >
                {loading ? 'در حال ایجاد...' : 'ایجاد حساب بانکی'}
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => router.push('/banks')}
              >
                انصراف
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}