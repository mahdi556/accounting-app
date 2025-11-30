// src/app/accounts/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Table, Button, Badge, Card, Row, Col, Form } from 'react-bootstrap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [filteredAccounts, setFilteredAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [accounts, searchTerm, typeFilter])

  const fetchAccounts = async () => {
    try {
      console.log('Fetching accounts...')
      const response = await fetch('/api/accounts')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Received accounts:', data)
        setAccounts(data)
      } else {
        console.error('Error fetching accounts')
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAccounts = () => {
    let filtered = accounts

    // فیلتر بر اساس جستجو
    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code.includes(searchTerm) ||
        account.category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // فیلتر بر اساس نوع
    if (typeFilter) {
      filtered = filtered.filter(account => account.category.type === typeFilter)
    }

    setFilteredAccounts(filtered)
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

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 ریال'
    return amount.toLocaleString('fa-IR') + ' ریال'
  }

  const getTransactionCount = (account) => {
    return account.voucherItems?.length || 0
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`آیا از حذف حساب "${name}" اطمینان دارید؟`)) {
      try {
        const response = await fetch(`/api/accounts/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('حساب با موفقیت حذف شد')
          fetchAccounts() // رفرش لیست
        } else {
          const error = await response.json()
          alert(`خطا: ${error.error}`)
        }
      } catch (error) {
        console.error('Error deleting account:', error)
        alert('خطا در حذف حساب')
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
          <p className="mt-3">در حال بارگذاری حساب‌ها...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>مدیریت حساب‌های معین</h1>
        <Link href="/accounts/create">
          <Button variant="primary">
            ➕ ایجاد حساب جدید
          </Button>
        </Link>
      </div>

      {/* آمار و فیلترها */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>جستجو</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="جستجو بر اساس نام، کد یا حساب کل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>فیلتر بر اساس نوع</Form.Label>
                <Form.Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">همه انواع</option>
                  <option value="asset">دارایی</option>
                  <option value="liability">بدهی</option>
                  <option value="equity">سرمایه</option>
                  <option value="income">درآمد</option>
                  <option value="expense">هزینه</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div>
                <small className="text-muted">
                  نمایش {filteredAccounts.length} حساب از {accounts.length} حساب
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* لیست حساب‌ها */}
      <Card>
        <Card.Body>
          {filteredAccounts.length > 0 ? (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>کد حساب</th>
                  <th>نام حساب</th>
                  <th>حساب کل</th>
                  <th>نوع</th>
                  <th>موجودی</th>
                  <th>تعداد تراکنش</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(account => (
                  <tr key={account.id}>
                    <td className="fw-bold">{account.code}</td>
                    <td>{account.name}</td>
                    <td>{account.category.name}</td>
                    <td>
                      <Badge bg={getTypeColor(account.category.type)}>
                        {account.category.type}
                      </Badge>
                    </td>
                    <td className={`fw-bold ${account.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(account.balance)}
                    </td>
                    <td>
                      <Badge bg="info">{getTransactionCount(account)}</Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => router.push(`/accounts/${account.id}`)}
                        >
                          مشاهده
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(account.id, account.name)}
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
              <h5 className="text-muted">هیچ حسابی یافت نشد</h5>
              <p className="text-muted mb-3">
                {accounts.length === 0 
                  ? 'هنوز هیچ حسابی ثبت نشده است.' 
                  : 'با فیلترهای فعلی هیچ حسابی یافت نشد.'
                }
              </p>
              {accounts.length === 0 && (
                <Link href="/accounts/create">
                  <Button variant="primary">
                    ایجاد اولین حساب
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