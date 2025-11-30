// src/app/categories/create/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

export default function CreateCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [categories, setCategories] = useState([])
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '',
    parentId: ''
  })

  const [parentCategory, setParentCategory] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  // وقتی والد یا نوع تغییر می‌کند، کد جدید تولید کن
  useEffect(() => {
    if (formData.type) {
      generateNewCode()
    }
  }, [formData.parentId, formData.type])

  // وقتی والد انتخاب می‌شود، اطلاعاتش را بگیر
  useEffect(() => {
    if (formData.parentId) {
      const selectedParent = categories.find(cat => cat.id === parseInt(formData.parentId))
      setParentCategory(selectedParent || null)
    } else {
      setParentCategory(null)
    }
  }, [formData.parentId, categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const generateNewCode = async () => {
    if (!formData.type) return
    
    setLoadingCodes(true)
    try {
      // دریافت کدهای موجود برای این والد
      const existingCodesResponse = await fetch(
        `/api/accounts/existing-codes?parentCode=${parentCategory?.code || ''}&accountType=category`
      )
      
      let existingCodes = []
      if (existingCodesResponse.ok) {
        const data = await existingCodesResponse.json()
        existingCodes = data.codes || []
      }

      // تولید کد جدید
      let newCode = ''
      
      if (parentCategory) {
        // حساب کل فرزند - فرمت: والد-شماره (مثال: 1-01)
        const parentCode = parentCategory.code
        const lastChildNumber = findLastChildNumber(existingCodes, parentCode)
        const nextNumber = lastChildNumber + 1
        newCode = `${parentCode}-${nextNumber.toString().padStart(2, '0')}`
      } else {
        // حساب کل اصلی - فرمت: شماره (مثال: 1)
        const mainCategories = categories.filter(cat => !cat.parentId)
        const lastMainNumber = findLastMainNumber(mainCategories)
        const nextNumber = lastMainNumber + 1
        newCode = nextNumber.toString()
      }

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
    const lastNumber = parseInt(parts[parts.length - 1]) || 0
    return lastNumber
  }

  const findLastMainNumber = (mainCategories) => {
    if (mainCategories.length === 0) return 0
    
    const codes = mainCategories.map(cat => parseInt(cat.code)).filter(code => !isNaN(code))
    if (codes.length === 0) return 0
    
    return Math.max(...codes)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!formData.code.trim() || !formData.name.trim() || !formData.type) {
        setError('کد، نام و نوع حساب الزامی هستند')
        setLoading(false)
        return
      }

      const submitData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        type: formData.type,
        parentId: formData.parentId ? parseInt(formData.parentId) : null
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(`حساب کل "${data.name}" با کد ${data.code} با موفقیت ایجاد شد`)
        
        // به روز کردن لیست
        fetchCategories()
        
        // ریست فرم
        setFormData({
          code: '',
          name: '',
          type: '',
          parentId: ''
        })
        
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'خطا در ایجاد حساب کل')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      setError('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
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

  const getCodeStructureInfo = () => {
    if (!formData.code) return null
    
    const parts = formData.code.split('-')
    
    if (parts.length === 1) {
      return {
        level: 'حساب کل اصلی',
        structure: `سطح ۱: ${parts[0]}`
      }
    } else if (parts.length === 2) {
      return {
        level: 'حساب کل فرعی',
        structure: `سطح ۱: ${parts[0]} → سطح ۲: ${parts[1]}`
      }
    } else {
      return {
        level: 'حساب کل زیرفرعی',
        structure: `سطح ۱: ${parts[0]} → سطح ۲: ${parts[1]} → سطح ۳: ${parts[2]}`
      }
    }
  }

  const codeInfo = getCodeStructureInfo()

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">ایجاد حساب کل جدید</h1>
          <p className="text-muted mb-0">سیستم کدگذاری سلسله مراتبی - فرمت: کل-معین-تفصیلی</p>
        </div>
        <Button 
          variant="outline-secondary" 
          onClick={() => router.push('/categories')}
        >
          بازگشت به لیست حساب‌های کل
        </Button>
      </div>

      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                📝 اطلاعات حساب کل
                {formData.code && (
                  <Badge bg="primary" className="ms-2">
                    کد: {formData.code}
                  </Badge>
                )}
              </h5>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  <strong>خطا:</strong> {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="mb-3">
                  <strong>موفق:</strong> {success}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        کد حساب کل *
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="ms-2"
                          onClick={generateNewCode}
                          disabled={loadingCodes || !formData.type}
                          type="button"
                        >
                          {loadingCodes ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            '🔄 تولید کد'
                          )}
                        </Button>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="کد به طور خودکار تولید می‌شود"
                        required
                        readOnly
                      />
                      <Form.Text className="text-muted">
                        {loadingCodes ? 'در حال تولید کد...' : 'کد بر اساس والد و نوع حساب تولید شد'}
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>نام حساب کل *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="مثال: صندوق و بانک‌ها"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>نوع حساب *</Form.Label>
                      <Form.Select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      >
                        <option value="">انتخاب نوع حساب</option>
                        <option value="asset">💰 دارایی</option>
                        <option value="liability">📋 بدهی</option>
                        <option value="equity">🏛️ سرمایه</option>
                        <option value="income">📈 درآمد</option>
                        <option value="expense">📉 هزینه</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>حساب کل والد</Form.Label>
                      <Form.Select
                        name="parentId"
                        value={formData.parentId}
                        onChange={handleChange}
                      >
                        <option value="">بدون والد (حساب اصلی)</option>
                        {categories
                          .filter(cat => !cat.parentId) // فقط حساب‌های اصلی را نشان بده
                          .map(category => (
                            <option key={category.id} value={category.id}>
                              {category.code} - {category.name}
                            </option>
                          ))
                        }
                      </Form.Select>
                      <Form.Text className="text-muted">
                        برای ایجاد سلسله مراتب، حساب کل والد را انتخاب کنید
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* نمایش اطلاعات ساختار کد */}
                {codeInfo && (
                  <Alert variant="info" className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{codeInfo.level}</strong>
                        <br />
                        <small className="text-muted">{codeInfo.structure}</small>
                      </div>
                      <Badge bg={getTypeColor(formData.type)}>
                        {getTypeLabel(formData.type)}
                      </Badge>
                    </div>
                  </Alert>
                )}

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !formData.code}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        در حال ایجاد...
                      </>
                    ) : (
                      '💾 ایجاد حساب کل'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => {
                      setFormData({
                        code: '',
                        name: '',
                        type: '',
                        parentId: ''
                      })
                      setError('')
                      setSuccess('')
                    }}
                  >
                    پاک کردن فرم
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {/* راهنمای ساختار کد */}
          <Card className="bg-light">
            <Card.Header>
              <h6 className="mb-0">🎯 ساختار کدگذاری سلسله مراتبی</h6>
            </Card.Header>
            <Card.Body>
              <h6>فرمت: کل-معین-تفصیلی</h6>
              <div className="small">
                <div className="mb-2">
                  <strong>حساب کل اصلی:</strong>
                  <div><code>1</code> - دارایی‌ها</div>
                  <div><code>2</code> - بدهی‌ها</div>
                  <div><code>3</code> - سرمایه</div>
                  <div><code>4</code> - درآمدها</div>
                  <div><code>5</code> - هزینه‌ها</div>
                </div>

                <div className="mb-2">
                  <strong>حساب کل فرعی:</strong>
                  <div><code>1-01</code> - دارایی‌های جاری</div>
                  <div><code>1-02</code> - دارایی‌های ثابت</div>
                </div>

                <div className="mb-2">
                  <strong>حساب معین:</strong>
                  <div><code>1-01-0001</code> - صندوق</div>
                  <div><code>1-01-0002</code> - بانک‌ها</div>
                </div>

                <div>
                  <strong>حساب تفصیلی:</strong>
                  <div><code>1-01-0002-01</code> - بانک ملی</div>
                  <div><code>1-01-0002-02</code> - بانک سپه</div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* مثال‌های عملی */}
          <Card className="mt-3">
            <Card.Header>
              <h6 className="mb-0">📚 مثال‌های عملی</h6>
            </Card.Header>
            <Card.Body>
              <div className="small">
                <div className="mb-2">
                  <strong>ساختار دارایی‌ها:</strong>
                  <div>💰 <code>1</code> - دارایی‌ها</div>
                  <div>  ├─ <code>1-01</code> - دارایی‌های جاری</div>
                  <div>  │  ├─ <code>1-01-0001</code> - صندوق</div>
                  <div>  │  └─ <code>1-01-0002</code> - بانک‌ها</div>
                  <div>  │     ├─ <code>1-01-0002-01</code> - بانک ملی</div>
                  <div>  │     └─ <code>1-01-0002-02</code> - بانک سپه</div>
                  <div>  └─ <code>1-02</code> - دارایی‌های ثابت</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}