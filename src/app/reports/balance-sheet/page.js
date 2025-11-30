// src/app/reports/balance-sheet/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Table, Card, Row, Col } from 'react-bootstrap'

export default function BalanceSheetPage() {
  const [assets, setAssets] = useState([])
  const [liabilities, setLiabilities] = useState([])
  const [equity, setEquity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBalanceSheetData()
  }, [])

  const fetchBalanceSheetData = async () => {
    try {
      const [assetsRes, liabilitiesRes, equityRes] = await Promise.all([
        fetch('/api/accounts?type=asset'),
        fetch('/api/accounts?type=liability'),
        fetch('/api/accounts?type=equity')
      ])

      const assetsData = await assetsRes.json()
      const liabilitiesData = await liabilitiesRes.json()
      const equityData = await equityRes.json()

      setAssets(assetsData)
      setLiabilities(liabilitiesData)
      setEquity(equityData)
    } catch (error) {
      console.error('Error fetching balance sheet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = (accounts) => {
    return accounts.reduce((sum, account) => sum + account.balance, 0)
  }

  const totalAssets = calculateTotal(assets)
  const totalLiabilities = calculateTotal(liabilities)
  const totalEquity = calculateTotal(equity)
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

  if (loading) return <div className="text-center p-4">در حال بارگذاری...</div>

  return (
    <Container>
      <h1 className="my-4">ترازنامه</h1>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">دارایی‌ها</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered>
                <tbody>
                  {assets.map(account => (
                    <tr key={account.id}>
                      <td>{account.name}</td>
                      <td className="text-end">{account.balance.toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold table-active">
                    <td>جمع دارایی‌ها</td>
                    <td className="text-end">{totalAssets.toLocaleString('fa-IR')}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">بدهی‌ها</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered>
                <tbody>
                  {liabilities.map(account => (
                    <tr key={account.id}>
                      <td>{account.name}</td>
                      <td className="text-end">{account.balance.toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold table-active">
                    <td>جمع بدهی‌ها</td>
                    <td className="text-end">{totalLiabilities.toLocaleString('fa-IR')}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">سرمایه</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered>
                <tbody>
                  {equity.map(account => (
                    <tr key={account.id}>
                      <td>{account.name}</td>
                      <td className="text-end">{account.balance.toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                  <tr className="fw-bold table-active">
                    <td>جمع سرمایه</td>
                    <td className="text-end">{totalEquity.toLocaleString('fa-IR')}</td>
                  </tr>
                  <tr className="fw-bold table-success">
                    <td>جمع بدهی‌ها و سرمایه</td>
                    <td className="text-end">{totalLiabilitiesAndEquity.toLocaleString('fa-IR')}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}