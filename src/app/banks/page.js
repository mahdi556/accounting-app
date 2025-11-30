// src/app/banks/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Table, Button, Card, Row, Col } from 'react-bootstrap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BanksPage() {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchBanks()
  }, [])

  const fetchBanks = async () => {
    try {
      const response = await fetch('/api/banks')
      if (response.ok) {
        const data = await response.json()
        setBanks(data)
      } else {
        console.error('Error fetching banks')
      }
    } catch (error) {
      console.error('Error fetching banks:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalBalance = banks.reduce((sum, bank) => sum + bank.balance, 0)

  const handleDelete = async (id, name) => {
    if (window.confirm(`آیا از حذف "${name}" اطمینان دارید؟`)) {
      try {
        const response = await fetch(`/api/banks/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('حساب بانکی با موفقیت حذف شد')
          fetchBanks() // رفرش لیست
        } else {
          const error = await response.json()
          alert(`خطا: ${error.error}`)
        }
      } catch (error) {
        console.error('Error deleting bank:', error)
        alert('خطا در حذف حساب بانکی')
      }
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال بارگذاری حساب‌های بانکی...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>مدیریت حساب‌های بانکی</h1>
        <Link href="/banks/create">
          <Button variant="primary">
            ➕ افزودن حساب بانکی
          </Button>
        </Link>
      </div>

      {/* آمار */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>تعداد حساب‌ها</Card.Title>
              <Card.Text className="h4 text-primary">
                {banks.length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>مجموع موجودی</Card.Title>
              <Card.Text className="h4 text-success">
                {totalBalance.toLocaleString('fa-IR')} ریال
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>میانگین موجودی</Card.Title>
              <Card.Text className="h4 text-info">
                {banks.length > 0 ? (totalBalance / banks.length).toLocaleString('fa-IR', {maximumFractionDigits: 0}) : 0} ریال
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* لیست حساب‌های بانکی */}
      <Card>
        <Card.Body>
          {banks.length > 0 ? (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>نام حساب</th>
                  <th>شماره حساب</th>
                  <th>موجودی</th>
                  <th>تاریخ ایجاد</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {banks.map(bank => (
                  <tr key={bank.id}>
                    <td className="fw-bold">{bank.name}</td>
                    <td>{bank.accountNumber || '-'}</td>
                    <td className={`fw-bold ${bank.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                      {bank.balance.toLocaleString('fa-IR')} ریال
                    </td>
                    <td>
                      {new Date(bank.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => router.push(`/banks/${bank.id}`)}
                        >
                          مشاهده
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(bank.id, bank.name)}
                        >
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <h5 className="text-muted">هیچ حساب بانکی ثبت نشده است</h5>
              <p className="text-muted mb-3">
                برای شروع، اولین حساب بانکی خود را ایجاد کنید.
              </p>
              <Link href="/banks/create">
                <Button variant="primary">
                  افزودن اولین حساب بانکی
                </Button>
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}