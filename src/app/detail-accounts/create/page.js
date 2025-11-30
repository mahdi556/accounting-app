// src/app/detail-accounts/create/page.js
'use client'
import { Container, Card, Form, Button, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function CreateDetailAccount() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [subAccounts, setSubAccounts] = useState([])
  const [detailAccounts, setDetailAccounts] = useState([])
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    subAccountId: ''
  })

  const [selectedSubAccount, setSelectedSubAccount] = useState(null)

  useEffect(() => {
    fetchSubAccounts()
    fetchDetailAccounts()
  }, [])

  // وقتی حساب معین تغییر می‌کند، کد جدید تولید کن
  useEffect(() => {
    if (formData.subAccountId) {
      generateNewCode()
    }
  }, [formData.subAccountId])

  // وقتی حساب معین انتخاب می‌شود، اطلاعاتش را بگیر
  useEffect(() => {
    if (formData.subAccountId) {
      const selectedSub = subAccounts.find(acc => acc.id === parseInt(formData.subAccountId))
      setSelectedSubAccount(selectedSub || null)
    } else {
      setSelectedSubAccount(null)
    }
  }, [formData.subAccountId, subAccounts])

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

  const fetchDetailAccounts = async () => {
    try {
      const response = await fetch('/api/detail-accounts')
      if (response.ok) {
        const data = await response.json()
        setDetailAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching detail accounts:', error)
    }
  }

  const generateNewCode = async () => {
    if (!formData.subAccountId || !selectedSubAccount) return
    
    setLoadingCodes(true)
    try {
      // دریافت کدهای موجود برای این حساب معین
      const existingCodesResponse = await fetch(
        `/api/accounts/existing-codes?parentCode=${selectedSubAccount.code}&accountType=detailAccount`
      )
      
      let existingCodes = []
      if (existingCodesResponse.ok) {
        const data = await existingCodesResponse.json()
        existingCodes = data.codes || []
      }

      // تولید کد جدید برای حساب تفصیلی - فرمت: حسابمعین-شماره دورقمی
      const parentCode = selectedSubAccount.code
      const lastChildNumber = findLastChildNumber(existingCodes, parentCode)
      const nextNumber = lastChildNumber + 1
      const newCode = `${parentCode}-${nextNumber.toString().padStart(2, '0')}`

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
      if (!formData.code.trim() || !formData.name.trim() || !formData.subAccountId) {
        setError('کد، نام و حساب معین الزامی هستند')
        setLoading(false)
        return
      }

      const submitData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        subAccountId: parseInt(formData.subAccountId)
      }

      const response = await fetch('/api/detail-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(`حساب تفصیلی "${data.name}" با کد ${data.code} با موفقیت ایجاد شد`)
        
        // به روز کردن لیست
        fetchDetailAccounts()
        
        // ریست فرم
        setFormData({
          code: '',
          name: '',
          subAccountId: ''
        })
        
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'خطا در ایجاد حساب تفصیلی')
      }
    } catch (error) {
      console.error('Error creating detail account:', error)
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

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">ایجاد حساب تفصیلی جدید</h1>
          <p className="text-muted mb-0">سیستم کدگذاری سلسله مراتبی - ادامه کد حساب معین</p>
        </div>
        <Button 
          variant="outline-secondary" 
          onClick={() => router.push('/detail-accounts')}
        >
          بازگشت به لیست حساب‌های تفصیلی
        </Button>
      </div>

      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                📝 اطلاعات حساب تفصیلی
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
                        کد حساب تفصیلی *
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="ms-2"
                          onClick={generateNewCode}
                          disabled={loadingCodes || !formData.subAccountId}
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
                        {loadingCodes ? 'در حال تولید کد...' : 'کد بر اساس حساب معین والد تولید شد'}
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>نام حساب تفصیلی *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="مثال: بانک ملی شعبه مرکزی"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>حساب معین *</Form.Label>
                  <Form.Select
                    name="subAccountId"
                    value={formData.subAccountId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">انتخاب حساب معین</option>
                    {subAccounts.map(subAccount => (
                      <option key={subAccount.id} value={subAccount.id}>
                        {subAccount.code} - {subAccount.name}
                        {subAccount.category && ` (${subAccount.category.name})`}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    حساب معین والد برای این حساب تفصیلی
                  </Form.Text>
                </Form.Group>

                {/* نمایش اطلاعات ساختار کد */}
                {selectedSubAccount && formData.code && (
                  <Alert variant="info" className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>حساب تفصیلی</strong>
                        <br />
                        <small className="text-muted">
                          زیرمجموعه: {selectedSubAccount.code} - {selectedSubAccount.name}
                          {selectedSubAccount.category && ` (${selectedSubAccount.category.name})`}
                        </small>
                      </div>
                      {selectedSubAccount.category && (
                        <Badge bg={getTypeColor(selectedSubAccount.category.type)}>
                          {getTypeLabel(selectedSubAccount.category.type)}
                        </Badge>
                      )}
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
                      '💾 ایجاد حساب تفصیلی'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => {
                      setFormData({
                        code: '',
                        name: '',
                        subAccountId: ''
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
              <h6 className="mb-0">🎯 ساختار کد حساب تفصیلی</h6>
            </Card.Header>
            <Card.Body>
              <h6>فرمت: حسابمعین-شماره دورقمی</h6>
              <div className="small">
                <div className="mb-2">
                  <strong>مثال‌ها:</strong>
                  <div><code>1-0002-01</code> - بانک ملی</div>
                  <div><code>1-0002-02</code> - بانک سپه</div>
                  <div><code>1-0001-01</code> - صندوق اصلی</div>
                  <div><code>1-0001-02</code> - صندوق فروش</div>
                  <div><code>4-0001-01</code> - فروش محصولات تولیدی</div>
                </div>

                <div className="mt-3">
                  <strong>توضیح:</strong>
                  <div>• شماره دورقمی به صورت خودکار افزایش می‌یابد</div>
                  <div>• هر حساب معین می‌تواند تا 99 حساب تفصیلی داشته باشد</div>
                  <div>• کدها به صورت منحصربه‌فرد تولید می‌شوند</div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* مثال‌های عملی */}
          <Card className="mt-3">
            <Card.Header>
              <h6 className="mb-0">📚 ساختار نمونه کامل</h6>
            </Card.Header>
            <Card.Body>
              <div className="small">
                <div><strong>ساختار کامل:</strong></div>
                <div><code>1</code> - دارایی‌ها</div>
                <div>  ├─ <code>1-0001</code> - صندوق</div>
                <div>  │  ├─ <code>1-0001-01</code> - صندوق اصلی</div>
                <div>  │  └─ <code>1-0001-02</code> - صندوق فروش</div>
                <div>  ├─ <code>1-0002</code> - بانک‌ها</div>
                <div>  │  ├─ <code>1-0002-01</code> - بانک ملی</div>
                <div>  │  ├─ <code>1-0002-02</code> - بانک سپه</div>
                <div>  │  └─ <code>1-0002-03</code> - بانک ملت</div>
                <div>  └─ <code>1-0003</code> - موجودی نقدی</div>
                <br />
                
                <div><strong>ساختار درآمد:</strong></div>
                <div><code>4-0001</code> - فروش</div>
                <div>  ├─ <code>4-0001-01</code> - فروش محصولات</div>
                <div>  ├─ <code>4-0001-02</code> - فروش خدمات</div>
                <div>  └─ <code>4-0001-03</code> - درآمد اجاره</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}