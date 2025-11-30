// src/app/banks/[id]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Card, Table, Button, Row, Col, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap'

export default function BankDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [bank, setBank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchBank()
    }
  }, [params.id])

  const fetchBank = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/banks/${params.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setBank(data)
        setFormData({
          name: data.name,
          accountNumber: data.accountNumber || '',
          balance: data.balance.toString()
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'بانک یافت نشد')
      }
    } catch (error) {
      console.error('Error fetching bank:', error)
      setError('خطا در دریافت اطلاعات بانک')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditMode(true)
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setFormData({
      name: bank.name,
      accountNumber: bank.accountNumber || '',
      balance: bank.balance.toString()
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('نام حساب بانکی الزامی است')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/banks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedBank = await response.json()
        setBank(updatedBank)
        setEditMode(false)
        alert('اطلاعات حساب بانکی با موفقیت به‌روزرسانی شد')
      } else {
        const error = await response.json()
        alert(`خطا: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating bank:', error)
      alert('خطا در به‌روزرسانی اطلاعات')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/banks/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('حساب بانکی با موفقیت حذف شد')
        router.push('/banks')
      } else {
        const error = await response.json()
        alert(`خطا: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting bank:', error)
      alert('خطا در حذف حساب بانکی')
    } finally {
      setShowDeleteModal(false)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCurrency = (amount) => {
    return amount.toLocaleString('fa-IR') + ' ریال'
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">در حال بارگذاری اطلاعات حساب بانکی...</p>
        </div>
      </Container>
    )
  }

  if (error || !bank) {
    return (
      <Container>
        <Alert variant="danger">
          <h5>خطا در دریافت اطلاعات</h5>
          <p>{error || 'حساب بانکی یافت نشد'}</p>
          <Button variant="outline-danger" onClick={() => router.push('/banks')}>
            بازگشت به لیست حساب‌های بانکی
          </Button>
        </Alert>
      </Container>
    )
  }

  return (
    <Container>
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">جزئیات حساب بانکی</h1>
          <p className="text-muted mb-0">کد: {bank.id}</p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            onClick={() => router.push('/banks')}
          >
            بازگشت به لیست
          </Button>
          {!editMode && (
            <>
              <Button variant="outline-primary" onClick={handleEdit}>
                ✏️ ویرایش
              </Button>
              <Button 
                variant="outline-danger" 
                onClick={() => setShowDeleteModal(true)}
              >
                🗑️ حذف
              </Button>
            </>
          )}
        </div>
      </div>

      <Row>
        {/* اطلاعات حساب بانکی */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">اطلاعات حساب بانکی</h5>
            </Card.Header>
            <Card.Body>
              {editMode ? (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>نام حساب *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      required
                      placeholder="مثال: بانک ملی - حساب جاری"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>شماره حساب</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => handleFormChange('accountNumber', e.target.value)}
                      placeholder="شماره حساب بانکی"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>موجودی (ریال)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => handleFormChange('balance', e.target.value)}
                      required
                    />
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-secondary" 
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      انصراف
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          در حال ذخیره...
                        </>
                      ) : (
                        'ذخیره تغییرات'
                      )}
                    </Button>
                  </div>
                </Form>
              ) : (
                <Table borderless>
                  <tbody>
                    <tr>
                      <td width="160" className="fw-bold text-muted">نام حساب:</td>
                      <td className="fw-bold h5">{bank.name}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold text-muted">شماره حساب:</td>
                      <td>{bank.accountNumber || <span className="text-muted">ثبت نشده</span>}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold text-muted">موجودی:</td>
                      <td className={`h5 ${bank.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(bank.balance)}
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold text-muted">تاریخ ایجاد:</td>
                      <td>{new Date(bank.createdAt).toLocaleDateString('fa-IR')}</td>
                    </tr>
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* خلاصه مالی */}
        <Col md={6}>
          <Card className="mb-4 bg-light">
            <Card.Body className="text-center">
              <h6 className="text-muted mb-3">وضعیت حساب</h6>
              <div className={`display-4 ${bank.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                {bank.balance >= 0 ? '✅' : '⚠️'}
              </div>
              <h4 className={bank.balance >= 0 ? 'text-success' : 'text-danger'}>
                {bank.balance >= 0 ? 'موجودی مثبت' : 'موجودی منفی'}
              </h4>
              <p className="text-muted mt-3">
                این حساب در سیستم حسابداری به عنوان یک حساب بانکی مدیریت می‌شود.
              </p>
            </Card.Body>
          </Card>

          {/* عملیات سریع */}
          <Card>
            <Card.Header>
              <h6 className="mb-0">عملیات سریع</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-success"
                  onClick={() => router.push('/vouchers/create')}
                >
                  ➕ ثبت تراکنش جدید
                </Button>
                <Button 
                  variant="outline-info"
                  onClick={() => router.push('/reports')}
                >
                  📊 مشاهده گزارش‌ها
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* اطلاعات تکمیلی */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">اطلاعات تکمیلی</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <div className="text-center p-3 border rounded">
                <h6 className="text-muted">نوع حساب</h6>
                <Badge bg="info" className="fs-6">حساب بانکی</Badge>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3 border rounded">
                <h6 className="text-muted">وضعیت</h6>
                <Badge bg={bank.balance >= 0 ? 'success' : 'warning'} className="fs-6">
                  {bank.balance >= 0 ? 'فعال' : 'نیازمند توجه'}
                </Badge>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3 border rounded">
                <h6 className="text-muted">آخرین به‌روزرسانی</h6>
                <div className="fw-bold">
                  {new Date(bank.createdAt).toLocaleDateString('fa-IR')}
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* مودال حذف */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>حذف حساب بانکی</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <h6>⚠️ هشدار</h6>
            <p className="mb-0">
              آیا از حذف حساب بانکی <strong>"{bank.name}"</strong> اطمینان دارید؟
              این عمل غیرقابل بازگشت است.
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            انصراف
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            حذف حساب بانکی
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}