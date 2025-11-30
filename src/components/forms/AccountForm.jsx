// src/components/forms/AccountForm.jsx
'use client'
import { useState, useEffect } from 'react'
import { Form, Button, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap'

export default function AccountForm({ initialData = {}, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [error, setError] = useState('')
  const [subAccounts, setSubAccounts] = useState([])
  
  const [formData, setFormData] = useState({
    code: initialData.code || '',
    name: initialData.name || '',
    categoryId: initialData.categoryId || ''
  })

  const [selectedCategory, setSelectedCategory] = useState(null)

  useEffect(() => {
    fetchCategories()
    fetchSubAccounts()
  }, [])

  // وقتی حساب کل تغییر می‌کند، کد جدید تولید کن
  useEffect(() => {
    if (formData.categoryId && !initialData.id) {
      generateNewCode()
    }
  }, [formData.categoryId])

  // وقتی حساب کل انتخاب می‌شود، اطلاعاتش را بگیر
  useEffect(() => {
    if (formData.categoryId) {
      const selectedCat = categories.find(cat => cat.id === parseInt(formData.categoryId))
      setSelectedCategory(selectedCat || null)
    } else {
      setSelectedCategory(null)
    }
  }, [formData.categoryId, categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        // فقط حساب‌های کل اصلی و فرعی را نشان بده
        const mainCategories = data.filter(cat => !cat.parentId || (cat.parentId && !data.find(p => p.id === cat.parentId)?.parentId))
        setCategories(mainCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSubAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (response.ok) {
        const data = await response.json()
        setSubAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching sub accounts:', error)
    }
  }

  const generateNewCode = async () => {
    if (!formData.categoryId || !selectedCategory || initialData.id) return
    
    setLoadingCodes(true)
    try {
      // دریافت کدهای موجود برای این حساب کل
      const existingCodesResponse = await fetch(
        `/api/accounts/existing-codes?parentCode=${selectedCategory.code}&accountType=subAccount`
      )
      
      let existingCodes = []
      if (existingCodesResponse.ok) {
        const data = await existingCodesResponse.json()
        existingCodes = data.codes || []
      }

      // تولید کد جدید برای حساب معین
      const parentCode = selectedCategory.code
      const lastChildNumber = findLastChildNumber(existingCodes, parentCode)
      const nextNumber = lastChildNumber + 1
      const newCode = `${parentCode}-${nextNumber.toString().padStart(4, '0')}`

      setFormData(prev => ({
        ...prev,
        code: newCode
      }))

    } catch (error) {
      console.error('Error generating code:', error)
      setError('خطا در تولید کد خودکار')
    } finally {
      setLoadingCodes(false)
    }
  }

  const findLastChildNumber = (codes, parentCode) => {
    if (codes.length === 0) return 0
    
    const childCodes = codes.filter(code => code.startsWith(parentCode + '-'))
    if (childCodes.length === 0) return 0
    
    const lastCode = childCodes[childCodes.length - 1]
    const parts = lastCode.split('-')
    const lastPart = parts[parts.length - 1]
    const lastNumber = parseInt(lastPart) || 0
    return lastNumber
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.code.trim() || !formData.name.trim() || !formData.categoryId) {
        setError('کد، نام و حساب کل الزامی هستند')
        setLoading(false)
        return
      }

      const url = initialData.id ? `/api/accounts/${initialData.id}` : '/api/accounts'
      const method = initialData.id ? 'PUT' : 'POST'

      const submitData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        categoryId: parseInt(formData.categoryId)
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const result = await response.json()
        alert(initialData.id ? 'حساب معین با موفقیت ویرایش شد' : 'حساب معین جدید ایجاد شد')
        if (onSuccess) onSuccess(result)
        
        if (!initialData.id) {
          setFormData({
            code: '',
            name: '',
            categoryId: ''
          })
        }
      } else {
        const error = await response.json()
        setError(error.error || 'خطا در ذخیره اطلاعات')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getTypeColor = (type) => {
    const colors = {
      asset: 'success',
      liability: 'danger',
      equity: 'primary',
      income: 'info',
      expense: 'warning'
    }
    return colors[type] || 'secondary'
  }

  const getTypeLabel = (type) => {
    const labels = {
      asset: 'دارایی',
      liability: 'بدهی',
      equity: 'سرمایه',
      income: 'درآمد',
      expense: 'هزینه'
    }
    return labels[type] || type
  }

  return (
    <Form onSubmit={handleSubmit} className="rtl">
      {error && (
        <Alert variant="danger" className="mb-3">
          <strong>خطا:</strong> {error}
        </Alert>
      )}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              کد حساب معین *
              {!initialData.id && (
                <Button
                  variant="outline-info"
                  size="sm"
                  className="ms-2"
                  onClick={generateNewCode}
                  disabled={loadingCodes || !formData.categoryId}
                  type="button"
                >
                  {loadingCodes ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    '🔄 تولید کد'
                  )}
                </Button>
              )}
            </Form.Label>
            <Form.Control
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder={initialData.id ? "کد حساب" : "کد به طور خودکار تولید می‌شود"}
              required
              readOnly={!initialData.id && formData.categoryId}
            />
            <Form.Text className="text-muted">
              {initialData.id 
                ? 'کد حساب معین' 
                : loadingCodes 
                  ? 'در حال تولید کد...' 
                  : 'کد بر اساس حساب کل والد تولید می‌شود'
              }
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>نام حساب معین *</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="مثال: صندوق"
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>حساب کل *</Form.Label>
        <Form.Select
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          required
        >
          <option value="">انتخاب حساب کل</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.code} - {category.name}
              {category.parent && ` (فرعی ${category.parent.code})`}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="text-muted">
          حساب کل والد برای این حساب معین
        </Form.Text>
      </Form.Group>

      {/* نمایش اطلاعات ساختار کد */}
      {selectedCategory && formData.code && !initialData.id && (
        <Alert variant="info" className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>حساب معین</strong>
              <br />
              <small className="text-muted">
                زیرمجموعه: {selectedCategory.code} - {selectedCategory.name}
              </small>
            </div>
            <Badge bg={getTypeColor(selectedCategory.type)}>
              {getTypeLabel(selectedCategory.type)}
            </Badge>
          </div>
        </Alert>
      )}

      <div className="d-flex gap-2">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-100"
          size="lg"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              در حال ذخیره...
            </>
          ) : (
            initialData.id ? '💾 ویرایش حساب معین' : '💾 ایجاد حساب معین'
          )}
        </Button>
      </div>

      {/* راهنمای ساختار کد */}
      {!initialData.id && (
        <Alert variant="light" className="mt-3">
          <h6>🎯 ساختار کد حساب معین</h6>
          <div className="small">
            <strong>فرمت:</strong> حسابکل-شماره چهاررقمی
            <br />
            <strong>مثال‌ها:</strong>
            <div><code>1-0001</code> - صندوق</div>
            <div><code>1-0002</code> - بانک‌ها</div>
            <div><code>1-01-0001</code> - صندوق فروشگاه</div>
          </div>
        </Alert>
      )}
    </Form>
  )
}