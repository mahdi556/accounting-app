// src/components/forms/PersonForm.jsx
'use client'
import { useState } from 'react'
import { Form, Button, Row, Col } from 'react-bootstrap'

export default function PersonForm({ initialData = {}, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    type: initialData.type || 'customer',
    phone: initialData.phone || '',
    address: initialData.address || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = initialData.id ? `/api/persons/${initialData.id}` : '/api/persons'
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
        alert(initialData.id ? 'شخص با موفقیت ویرایش شد' : 'شخص جدید ایجاد شد')
        if (onSuccess) onSuccess(result)
        
        if (!initialData.id) {
          setFormData({
            name: '',
            type: 'customer',
            phone: '',
            address: ''
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
            <Form.Label>نام کامل *</Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="نام شخص یا شرکت"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>نوع شخص *</Form.Label>
            <Form.Select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              required
            >
              <option value="customer">مشتری</option>
              <option value="supplier">تأمین کننده</option>
              <option value="employee">پرسنل</option>
            </Form.Select>
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
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>آدرس</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="آدرس کامل"
        />
      </Form.Group>

      <Button 
        type="submit" 
        variant="primary" 
        disabled={loading}
        className="w-100"
      >
        {loading ? 'در حال ذخیره...' : (initialData.id ? 'ویرایش شخص' : 'ایجاد شخص')}
      </Button>
    </Form>
  )
}