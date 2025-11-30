// src/app/reports/general-ledger/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Table, Card, Form, Button, Row, Col } from 'react-bootstrap'

export default function GeneralLedgerPage() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    try {
      const response = await fetch('/api/vouchers?limit=1000')
      const data = await response.json()
      setVouchers(data.vouchers)
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    // فیلتر بر اساس تاریخ
    const filtered = vouchers.filter(voucher => {
      const voucherDate = new Date(voucher.voucherDate)
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      return voucherDate >= startDate && voucherDate <= endDate
    })
    setVouchers(filtered)
  }

  if (loading) return <div className="text-center p-4">در حال بارگذاری...</div>

  return (
    <Container>
      <h1 className="my-4">دفتر کل</h1>

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">فیلتر دوره</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>از تاریخ</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>تا تاریخ</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button variant="primary" onClick={handleFilter} className="w-100">
                اعمال فیلتر
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">لیست اسناد دفتر کل</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>شماره سند</th>
                <th>شرح سند</th>
                <th>حساب بدهکار</th>
                <th>حساب بستانکار</th>
                <th>مبلغ بدهکار</th>
                <th>مبلغ بستانکار</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(voucher => 
                voucher.items.map((item, index) => (
                  <tr key={`${voucher.id}-${item.id}`}>
                    <td>{new Date(voucher.voucherDate).toLocaleDateString('fa-IR')}</td>
                    <td className="fw-bold">{voucher.voucherNumber}</td>
                    <td>{item.description || voucher.description}</td>
                    <td>
                      {item.debit > 0 && (
                        <div>
                          <small className="text-muted">{item.subAccount.code}</small>
                          <br />
                          {item.subAccount.name}
                        </div>
                      )}
                    </td>
                    <td>
                      {item.credit > 0 && (
                        <div>
                          <small className="text-muted">{item.subAccount.code}</small>
                          <br />
                          {item.subAccount.name}
                        </div>
                      )}
                    </td>
                    <td className="text-success fw-bold">
                      {item.debit > 0 ? item.debit.toLocaleString('fa-IR') : '-'}
                    </td>
                    <td className="text-danger fw-bold">
                      {item.credit > 0 ? item.credit.toLocaleString('fa-IR') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  )
}