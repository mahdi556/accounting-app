// src/app/reports/profit-loss/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Table, Card, Row, Col, Form, Button } from 'react-bootstrap'

export default function ProfitLossPage() {
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchProfitLossData()
  }, [])

  const fetchProfitLossData = async () => {
    try {
      const [incomesRes, expensesRes] = await Promise.all([
        fetch('/api/accounts?type=income'),
        fetch('/api/accounts?type=expense')
      ])

      const incomesData = await incomesRes.json()
      const expensesData = await expensesRes.json()

      setIncomes(incomesData)
      setExpenses(expensesData)
    } catch (error) {
      console.error('Error fetching profit loss data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = (accounts) => {
    return accounts.reduce((sum, account) => sum + account.balance, 0)
  }

  const totalIncome = calculateTotal(incomes)
  const totalExpense = calculateTotal(expenses)
  const netProfit = totalIncome - totalExpense

  const handlePeriodChange = () => {
    // در اینجا می‌توانید فیلتر بر اساس تاریخ را پیاده‌سازی کنید
    alert('فیلتر بر اساس تاریخ در حال توسعه است')
  }

  if (loading) return <div className="text-center p-4">در حال بارگذاری...</div>

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>گزارش سود و زیان</h1>
        
        <div className="d-flex gap-2 align-items-center">
          <Form.Group className="mb-0">
            <Form.Label className="mb-0 me-2">از تاریخ:</Form.Label>
            <Form.Control
              type="date"
              value={period.startDate}
              onChange={(e) => setPeriod(prev => ({...prev, startDate: e.target.value}))}
              size="sm"
            />
          </Form.Group>
          <Form.Group className="mb-0">
            <Form.Label className="mb-0 me-2">تا تاریخ:</Form.Label>
            <Form.Control
              type="date"
              value={period.endDate}
              onChange={(e) => setPeriod(prev => ({...prev, endDate: e.target.value}))}
              size="sm"
            />
          </Form.Group>
          <Button variant="outline-primary" size="sm" onClick={handlePeriodChange}>
            اعمال فیلتر
          </Button>
        </div>
      </div>

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">درآمدها</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered>
                <tbody>
                  {incomes.map(account => (
                    <tr key={account.id}>
                      <td>{account.name}</td>
                      <td className="text-end">{account.balance.toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold table-active">
                    <td>جمع درآمدها</td>
                    <td className="text-end">{totalIncome.toLocaleString('fa-IR')}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">هزینه‌ها</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered>
                <tbody>
                  {expenses.map(account => (
                    <tr key={account.id}>
                      <td>{account.name}</td>
                      <td className="text-end">{account.balance.toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold table-active">
                    <td>جمع هزینه‌ها</td>
                    <td className="text-end">{totalExpense.toLocaleString('fa-IR')}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className={`${netProfit >= 0 ? 'bg-success' : 'bg-danger'} text-white`}>
            <Card.Body className="text-center">
              <h5>سود {netProfit >= 0 ? '✅' : '❌'} زیان خالص</h5>
              <h2 className="my-3">{Math.abs(netProfit).toLocaleString('fa-IR')} ریال</h2>
              <p className="mb-0">
                {netProfit >= 0 ? 'سود خالص' : 'زیان خالص'}
              </p>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Body>
              <h6 className="mb-3">خلاصه عملکرد</h6>
              <div className="d-flex justify-content-between mb-2">
                <span>کل درآمد:</span>
                <span className="text-success fw-bold">{totalIncome.toLocaleString('fa-IR')}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>کل هزینه:</span>
                <span className="text-danger fw-bold">{totalExpense.toLocaleString('fa-IR')}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold">
                <span>نتیجه:</span>
                <span className={netProfit >= 0 ? 'text-success' : 'text-danger'}>
                  {netProfit.toLocaleString('fa-IR')}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}