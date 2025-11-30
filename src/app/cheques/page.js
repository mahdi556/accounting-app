// src/app/cheques/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Table, Button, Badge, Card, Row, Col, Form, Alert, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ChequesPage() {
  const router = useRouter()
  const [cheques, setCheques] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({
    type: '',
    status: ''
  })

  useEffect(() => {
    fetchCheques()
  }, [])

  const fetchCheques = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cheques')
      
      if (response.ok) {
        const data = await response.json()
        // داده‌ها ممکن است در فیلد cheques باشند یا مستقیماً آرایه باشند
        const chequesData = data.cheques || data
        setCheques(Array.isArray(chequesData) ? chequesData : [])
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'خطا در دریافت اطلاعات چک‌ها')
        setCheques([])
      }
    } catch (error) {
      console.error('Error fetching cheques:', error)
      setError('خطا در ارتباط با سرور')
      setCheques([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    const newFilter = {
      ...filter,
      [field]: value
    }
    setFilter(newFilter)
  }

  const getFilteredCheques = () => {
    if (!Array.isArray(cheques)) return []
    
    return cheques.filter(cheque => {
      if (filter.type && cheque.type !== filter.type) return false
      if (filter.status && cheque.status !== filter.status) return false
      return true
    })
  }

  const getTypeLabel = (type) => {
    return type === 'receivable' ? 'دریافتنی' : 'پرداختنی'
  }

  const getTypeVariant = (type) => {
    return type === 'receivable' ? 'success' : 'danger'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'در انتظار',
      collected: 'وصول شده',
      deposited: 'وصول شده به حساب',
      returned: 'برگشتی',
      canceled: 'ابطال شده'
    }
    return labels[status] || status
  }

  const getStatusVariant = (status) => {
    const variants = {
      pending: 'warning',
      collected: 'success',
      deposited: 'info',
      returned: 'danger',
      canceled: 'secondary'
    }
    return variants[status] || 'secondary'
  }

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString('fa-IR') + ' ریال'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fa-IR')
  }

  const handleViewCheque = (chequeId) => {
    router.push(`/cheques/${chequeId}`)
  }

  const handleEditCheque = (chequeId) => {
    router.push(`/cheques/${chequeId}/edit`)
  }

  const handleStatusUpdate = async (chequeId, newStatus) => {
    if (window.confirm(`آیا از تغییر وضعیت چک اطمینان دارید؟`)) {
      try {
        const response = await fetch(`/api/cheques?id=${chequeId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus })
        })

        if (response.ok) {
          alert('وضعیت چک با موفقیت به‌روزرسانی شد')
          fetchCheques() // رفرش لیست
        } else {
          const error = await response.json()
          alert(`خطا: ${error.error}`)
        }
      } catch (error) {
        console.error('Error updating cheque status:', error)
        alert('خطا در به‌روزرسانی وضعیت چک')
      }
    }
  }

  const filteredCheques = getFilteredCheques()

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">در حال بارگذاری اطلاعات چک‌ها...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>مدیریت چک‌ها</h1>
        <Link href="/cheques/create">
          <Button variant="primary">
            ➕ ثبت چک جدید
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <strong>خطا:</strong> {error}
        </Alert>
      )}

      {/* آمار و فیلترها */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <Card.Title className="h6">کل چک‌ها</Card.Title>
              <Card.Text className="h4 text-success">
                {Array.isArray(cheques) ? cheques.length : 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-info">
            <Card.Body>
              <Card.Title className="h6">دریافتنی</Card.Title>
              <Card.Text className="h4 text-info">
                {Array.isArray(cheques) ? cheques.filter((c) => c.type === "receivable").length : 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <Card.Title className="h6">پرداختنی</Card.Title>
              <Card.Text className="h4 text-warning">
                {Array.isArray(cheques) ? cheques.filter((c) => c.type === "payable").length : 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-primary">
            <Card.Body>
              <Card.Title className="h6">در انتظار</Card.Title>
              <Card.Text className="h4 text-primary">
                {Array.isArray(cheques) ? cheques.filter((c) => c.status === "pending").length : 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* فیلترها */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>فیلتر بر اساس نوع</Form.Label>
                <Form.Select
                  value={filter.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">همه انواع</option>
                  <option value="receivable">دریافتنی</option>
                  <option value="payable">پرداختنی</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>فیلتر بر اساس وضعیت</Form.Label>
                <Form.Select
                  value={filter.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="pending">در انتظار</option>
                  <option value="collected">وصول شده</option>
                  <option value="deposited">وصول شده به حساب</option>
                  <option value="returned">برگشتی</option>
                  <option value="canceled">ابطال شده</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div>
                <small className="text-muted">
                  نمایش {filteredCheques.length} چک از {Array.isArray(cheques) ? cheques.length : 0} چک
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* لیست چک‌ها */}
      <Card>
        <Card.Body>
          {Array.isArray(filteredCheques) && filteredCheques.length > 0 ? (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>شماره چک</th>
                  <th>بانک</th>
                  <th>نوع</th>
                  <th>صادرکننده / گیرنده</th>
                  <th>مبلغ</th>
                  <th>تاریخ سررسید</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheques.map(cheque => (
                  <tr key={cheque.id}>
                    <td className="fw-bold">{cheque.chequeNumber}</td>
                    <td>{cheque.bankName}</td>
                    <td>
                      <Badge bg={getTypeVariant(cheque.type)}>
                        {getTypeLabel(cheque.type)}
                      </Badge>
                    </td>
                    <td>
                      {cheque.type === 'receivable' ? cheque.drawer : cheque.payee}
                      {cheque.person && (
                        <div>
                          <small className="text-muted">
                            {cheque.person.name}
                          </small>
                        </div>
                      )}
                    </td>
                    <td className="fw-bold">{formatCurrency(cheque.amount)}</td>
                    <td>{formatDate(cheque.dueDate)}</td>
                    <td>
                      <Badge bg={getStatusVariant(cheque.status)}>
                        {getStatusLabel(cheque.status)}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewCheque(cheque.id)}
                        >
                          مشاهده
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleEditCheque(cheque.id)}
                        >
                          ویرایش
                        </Button>
                        {cheque.status === 'pending' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleStatusUpdate(cheque.id, 'collected')}
                          >
                            وصول شده
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <h5 className="text-muted">هیچ چکی یافت نشد</h5>
              <p className="text-muted mb-3">
                {Array.isArray(cheques) && cheques.length === 0 
                  ? 'هنوز هیچ چکی ثبت نشده است.' 
                  : 'با فیلترهای فعلی هیچ چکی یافت نشد.'
                }
              </p>
              {Array.isArray(cheques) && cheques.length === 0 && (
                <Link href="/cheques/create">
                  <Button variant="primary">
                    ثبت اولین چک
                  </Button>
                </Link>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}