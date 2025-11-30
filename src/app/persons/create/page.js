// src/app/persons/create/page.js
'use client'
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreatePersonPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'customer',
    phone: '',
    address: ''
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // اعتبارسنجی
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'نام الزامی است'
    }
    if (!formData.type) {
      newErrors.type = 'نوع شخص الزامی است'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/persons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        alert('شخص جدید با موفقیت ایجاد شد')
        router.push('/persons')
      } else {
        const error = await response.json()
        alert(`خطا: ${error.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('خطا در ایجاد شخص')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // پاک کردن خطا هنگام تغییر فیلد
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleCancel = () => {
    if (window.confirm('آیا از انصراف اطمینان دارید؟ تغییرات ذخیره نخواهند شد.')) {
      router.push('/persons')
    }
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>افزودن شخص جدید</h1>
        <Button 
          variant="outline-secondary" 
          onClick={() => router.push('/persons')}
        >
          بازگشت به لیست
        </Button>
      </div>

      <Card>
        <Card.Header>
          <h5 className="mb-0">فرم ثبت شخص جدید</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit} className="rtl">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>نام کامل *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    isInvalid={!!errors.name}
                    required
                    placeholder="نام شخص یا شرکت"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>نوع شخص *</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    isInvalid={!!errors.type}
                    required
                  >
                    <option value="customer">مشتری</option>
                    <option value="supplier">تأمین کننده</option>
                    <option value="employee">پرسنل</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.type}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>شماره تلفن</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="09xxxxxxxxx"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>ایمیل (اختیاری)</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="example@domain.com"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>آدرس</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="آدرس کامل"
              />
            </Form.Group>

            <Alert variant="info" className="mb-4">
              <strong>راهنما:</strong>
              <ul className="mb-0 mt-2">
                <li>فیلدهای ستاره‌دار (*) اجباری هستند</li>
                <li>مشتری: شخصی که از شما خرید می‌کند</li>
                <li>تأمین کننده: شخصی که به شما کالا/خدمات می‌فروشد</li>
                <li>پرسنل: کارمندان و پرسنل شرکت</li>
              </ul>
            </Alert>

            <div className="d-flex gap-2 justify-content-end">
              <Button 
                type="button" 
                variant="outline-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                انصراف
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    در حال ایجاد...
                  </>
                ) : (
                  'ایجاد شخص'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}