// src/app/vouchers/[id]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Card, Table, Button, Row, Col, Badge, Alert, Spinner } from 'react-bootstrap'

export default function VoucherDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [voucher, setVoucher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('Params:', params)
    if (params.id) {
      fetchVoucher()
    }
  }, [params.id])

  const fetchVoucher = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('Fetching voucher with ID:', params.id)
      const response = await fetch(`/api/vouchers/${params.id}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Received voucher data:', data)
        setVoucher(data)
      } else {
        const errorData = await response.json()
        console.log('API error:', errorData)
        setError(errorData.error || 'خطا در دریافت اطلاعات سند')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    if (!voucher) return { totalDebit: 0, totalCredit: 0 }
    
    const totalDebit = voucher.items.reduce((sum, item) => sum + (item.debit || 0), 0)
    const totalCredit = voucher.items.reduce((sum, item) => sum + (item.credit || 0), 0)
    
    return { totalDebit, totalCredit }
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '-'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('fa-IR')
    } catch (error) {
      return '-'
    }
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 ریال'
    return amount.toLocaleString('fa-IR') + ' ریال'
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">در حال بارگذاری اطلاعات سند...</p>
          <p className="text-muted">شناسه: {params.id}</p>
        </div>
      </Container>
    )
  }

  if (error || !voucher) {
    return (
      <Container>
        <Alert variant="danger">
          <h5>خطا در دریافت اطلاعات</h5>
          <p>{error || 'سند یافت نشد'}</p>
          <p className="text-muted">شناسه درخواستی: {params.id}</p>
          <div className="d-flex gap-2 mt-3">
            <Button variant="outline-danger" onClick={() => router.push('/vouchers')}>
              بازگشت به لیست اسناد
            </Button>
            <Button variant="outline-primary" onClick={fetchVoucher}>
              تلاش مجدد
            </Button>
          </div>
        </Alert>
      </Container>
    )
  }

  const { totalDebit, totalCredit } = calculateTotals()
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>جزئیات سند حسابداری</h1>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => router.push('/vouchers')}>
            بازگشت به لیست
          </Button>
          <Button variant="outline-primary" onClick={() => window.print()}>
            چاپ سند
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">سند شماره: <Badge bg="primary">{voucher.voucherNumber}</Badge></h5>
          <small>تاریخ: {formatDate(voucher.voucherDate)}</small>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col>
              <strong>شرح سند:</strong> {voucher.description || 'بدون شرح'}
            </Col>
          </Row>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>حساب</th>
                <th>شخص</th>
                <th>شرح</th>
                <th>بدهکار</th>
                <th>بستانکار</th>
              </tr>
            </thead>
            <tbody>
              {voucher.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div>
                      <strong>{item.subAccount?.code || 'N/A'}</strong>
                      <br />
                      <small>{item.subAccount?.name || 'حساب نامشخص'}</small>
                    </div>
                  </td>
                  <td>{item.person?.name || '-'}</td>
                  <td>{item.description || '-'}</td>
                  <td className="text-success fw-bold">
                    {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                  </td>
                  <td className="text-danger fw-bold">
                    {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-active">
              <tr>
                <td colSpan="4" className="text-end fw-bold">جمع:</td>
                <td className="text-success fw-bold">{formatCurrency(totalDebit)}</td>
                <td className="text-danger fw-bold">{formatCurrency(totalCredit)}</td>
              </tr>
              <tr>
                <td colSpan="4" className="text-end fw-bold">مانده:</td>
                <td colSpan="2" className={`fw-bold ${isBalanced ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(totalDebit - totalCredit)}
                  {isBalanced && ' ✅ تراز'}
                  {!isBalanced && ' ❌ عدم تراز'}
                </td>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
      </Card>

      {/* اطلاعات تکمیلی */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">اطلاعات فنی سند</h6>
            </Card.Header>
            <Card.Body>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted">شماره سند:</td>
                    <td className="fw-bold">{voucher.voucherNumber}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">تاریخ ثبت:</td>
                    <td>{formatDate(voucher.createdAt)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">تعداد ردیف‌ها:</td>
                    <td>
                      <Badge bg="info">{voucher.items.length}</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">مبلغ کل سند:</td>
                    <td className="fw-bold">{formatCurrency(voucher.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">وضعیت تراز:</td>
                    <td>
                      <Badge bg={isBalanced ? 'success' : 'danger'}>
                        {isBalanced ? 'تراز' : 'عدم تراز'}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">خلاصه مالی</h6>
            </Card.Header>
            <Card.Body>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted">مجموع بدهکار:</td>
                    <td className="text-success fw-bold">{formatCurrency(totalDebit)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">مجموع بستانکار:</td>
                    <td className="text-danger fw-bold">{formatCurrency(totalCredit)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">تفاوت:</td>
                    <td className={`fw-bold ${isBalanced ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(totalDebit - totalCredit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}