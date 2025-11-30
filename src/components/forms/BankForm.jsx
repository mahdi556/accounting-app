// src/components/forms/BankForm.jsx
'use client'
import { useState } from 'react'
import { Form, Button, Row, Col } from 'react-bootstrap'

export default function BankForm({ initialData = {}, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    accountNumber: initialData.accountNumber || '',
    balance: initialData.balance?.toString() || '0'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = initialData.id ? `/api/banks/${initialData.id}` : '/api/banks'
      const method = initialData.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        alert(initialData.id ? 'حساب بانکی با موفقیت ویرایش شد' : 'حساب بانکی جدید ایجاد شد')
        if (onSuccess) onSuccess(result)
        
        if (!initialData.id) {
          setFormData({
            name: '',
            accountNumber: '',
            balance: '0'
          })
        }
      } else {
        const error = await response.json()
        alert(`خطا: ${error.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('خطا در ذخیره اطلاعات')
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
            <Form.Label>موجودی</Form.Label>
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

      <Button 
        type="submit" 
        variant="primary" 
        disabled={loading}
        className="w-100"
      >
        {loading ? 'در حال ذخیره...' : (initialData.id ? 'ویرایش حساب بانکی' : 'ایجاد حساب بانکی')}
      </Button>
    </Form>
  )
}