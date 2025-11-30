// src/app/reports/page.js
'use client'
import { Container, Row, Col, Card } from 'react-bootstrap'
import Link from 'next/link'

export default function ReportsPage() {
  const reportCards = [
    {
      title: 'ترازنامه',
      description: 'گزارش وضعیت مالی واحد اقتصادی',
      href: '/reports/balance-sheet',
      icon: '📊',
      color: 'primary'
    },
    {
      title: 'سود و زیان',
      description: 'گزارش عملکرد مالی دوره',
      href: '/reports/profit-loss',
      icon: '📈',
      color: 'success'
    },
    {
      title: 'گردش حساب‌ها',
      description: 'گزارش گردش کلیه حساب‌ها',
      href: '/reports/account-turnover',
      icon: '🔄',
      color: 'info'
    },
    {
      title: 'دفتر کل',
      description: 'گزارش تفصیلی دفتر کل',
      href: '/reports/general-ledger',
      icon: '📖',
      color: 'warning'
    }
  ]

  return (
    <Container>
      <h1 className="my-4">گزارش‌های حسابداری</h1>
      
      <Row>
        {reportCards.map((report, index) => (
          <Col md={6} lg={3} key={index} className="mb-4">
            <Link href={report.href} style={{ textDecoration: 'none' }}>
              <Card className={`h-100 border-${report.color} hover-shadow`}>
                <Card.Body className="text-center">
                  <div className="fs-1 mb-3">{report.icon}</div>
                  <Card.Title className={`text-${report.color}`}>
                    {report.title}
                  </Card.Title>
                  <Card.Text className="text-muted">
                    {report.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </Container>
  )
}