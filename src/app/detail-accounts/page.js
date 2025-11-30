// src/app/detail-accounts/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Table, Button, Badge, Card, Row, Col, Form } from 'react-bootstrap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DetailAccountsPage() {
  const [detailAccounts, setDetailAccounts] = useState([])
  const [subAccounts, setSubAccounts] = useState([])
  const [filteredAccounts, setFilteredAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subAccountFilter, setSubAccountFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchDetailAccounts()
    fetchSubAccounts()
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [detailAccounts, searchTerm, subAccountFilter])

  const fetchDetailAccounts = async () => {
    try {
      const response = await fetch('/api/detail-accounts')
      if (response.ok) {
        const data = await response.json()
        setDetailAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching detail accounts:', error)
    } finally {
      setLoading(false)
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

  const filterAccounts = () => {
    let filtered = detailAccounts

    // فیلتر بر اساس جستجو
    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code.includes(searchTerm) ||
        account.subAccount.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // فیلتر بر اساس حساب معین
    if (subAccountFilter) {
      filtered = filtered.filter(account => account.subAccountId === parseInt(subAccountFilter))
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

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال بارگذاری حساب‌های تفصیلی...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>مدیریت حساب‌های تفصیلی</h1>
        <Link href="/detail-accounts/create">
          <Button variant="primary">
            ➕ ایجاد حساب تفصیلی جدید
          </Button>
        </Link>
      </div>

      {/* فیلترها */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>جستجو</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="جستجو بر اساس نام یا کد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>فیلتر بر اساس حساب معین</Form.Label>
                <Form.Select
                  value={subAccountFilter}
                  onChange={(e) => setSubAccountFilter(e.target.value)}
                >
                  <option value="">همه حساب‌های معین</option>
                  {subAccounts.map(subAccount => (
                    <option key={subAccount.id} value={subAccount.id}>
                      {subAccount.code} - {subAccount.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div>
                <small className="text-muted">
                  نمایش {filteredAccounts.length} حساب از {detailAccounts.length} حساب تفصیلی
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* لیست حساب‌های تفصیلی */}
      <Card>
        <Card.Body>
          {filteredAccounts.length > 0 ? (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>کد حساب</th>
                  <th>نام حساب</th>
                  <th>حساب معین</th>
                  <th>حساب کل</th>
                  <th>نوع</th>
                  <th>موجودی</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(account => (
                  <tr key={account.id}>
                    <td className="fw-bold">{account.code}</td>
                    <td>{account.name}</td>
                    <td>
                      {account.subAccount.code} - {account.subAccount.name}
                    </td>
                    <td>{account.subAccount.category.name}</td>
                    <td>
                      <Badge bg={getTypeColor(account.subAccount.category.type)}>
                        {account.subAccount.category.type}
                      </Badge>
                    </td>
                    <td className={`fw-bold ${account.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(account.balance)}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => router.push(`/detail-accounts/${account.id}`)}
                      >
                        مشاهده
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <h5 className="text-muted">هیچ حساب تفصیلی یافت نشد</h5>
              <p className="text-muted mb-3">
                {detailAccounts.length === 0 
                  ? 'هنوز هیچ حساب تفصیلی ثبت نشده است.' 
                  : 'با فیلترهای فعلی هیچ حساب تفصیلی یافت نشد.'
                }
              </p>
              {detailAccounts.length === 0 && (
                <Link href="/detail-accounts/create">
                  <Button variant="primary">
                    ایجاد اولین حساب تفصیلی
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