// src/app/dashboard/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات')
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('خطا در بارگذاری اطلاعات داشبورد')
    } finally {
      setLoading(false)
    }
  }

  // میانبرهای سریع
  const quickActions = [
    {
      title: '📋 لیست اسناد',
      description: 'مشاهده و مدیریت کلیه اسناد حسابداری',
      path: '/vouchers',
      variant: 'primary',
      icon: '📋'
    },
    {
      title: '💳 مدیریت چک‌ها',
      description: 'ثبت و پیگیری چک‌های دریافتنی و پرداختنی',
      path: '/cheques',
      variant: 'success',
      icon: '💳'
    },
    {
      title: '🏛️ ساختار حساب‌ها',
      description: 'مدیریت حساب‌های کل، معین و تفصیلی',
      path: '/accounts',
      variant: 'info',
      icon: '🏛️'
    },
    {
      title: '👥 اشخاص',
      description: 'مدیریت مشتریان، تأمین‌کنندگان و پرسنل',
      path: '/persons',
      variant: 'warning',
      icon: '👥'
    },
    {
      title: '📊 گردش حساب‌ها',
      description: 'گزارش گردش و مانده حساب‌ها',
      path: '/reports/account-turnover',
      variant: 'secondary',
      icon: '📊'
    },
    {
      title: '💰 ترازنامه',
      description: 'گزارش وضعیت مالی',
      path: '/reports/balance-sheet',
      variant: 'dark',
      icon: '💰'
    }
  ]

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال بارگذاری اطلاعات داشبورد...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">داشبورد حسابداری</h1>
          <p className="text-muted mb-0">نمای کلی از وضعیت مالی سیستم</p>
        </div>
        <Button 
          variant="outline-secondary" 
          onClick={fetchStats}
          disabled={loading}
        >
          🔄 بروزرسانی
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <strong>خطا:</strong> {error}
          <div className="mt-2">
            <Button variant="outline-danger" size="sm" onClick={fetchStats}>
              تلاش مجدد
            </Button>
          </div>
        </Alert>
      )}

      {/* آمار کلی */}
      <Row className="mb-5">
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <div className="fs-2 mb-2">💰</div>
              <Card.Title className="h6 text-success">مجموع دارایی‌ها</Card.Title>
              <Card.Text className="h4 fw-bold text-success">
                {(stats.totalAssets || 0).toLocaleString('fa-IR')} ریال
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-danger">
            <Card.Body>
              <div className="fs-2 mb-2">📋</div>
              <Card.Title className="h6 text-danger">مجموع بدهی‌ها</Card.Title>
              <Card.Text className="h4 fw-bold text-danger">
                {(stats.totalLiabilities || 0).toLocaleString('fa-IR')} ریال
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className={`text-center border-${(stats.netProfit || 0) >= 0 ? 'primary' : 'warning'}`}>
            <Card.Body>
              <div className="fs-2 mb-2">📈</div>
              <Card.Title className="h6">سود / زیان خالص</Card.Title>
              <Card.Text className={`h4 fw-bold ${(stats.netProfit || 0) >= 0 ? 'text-primary' : 'text-warning'}`}>
                {(stats.netProfit || 0).toLocaleString('fa-IR')} ریال
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-info">
            <Card.Body>
              <div className="fs-2 mb-2">📄</div>
              <Card.Title className="h6 text-info">تعداد اسناد</Card.Title>
              <Card.Text className="h4 fw-bold text-info">
                {(stats.totalVouchers || 0).toLocaleString('fa-IR')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* آمار جزئی‌تر */}
      <Row className="mb-5">
        <Col md={2}>
          <Card className="text-center bg-light">
            <Card.Body>
              <div className="fs-4 mb-1">💳</div>
              <Card.Title className="h6">چک‌های دریافتنی</Card.Title>
              <Card.Text className="h5 text-success">
                {(stats.receivableCheques || 0).toLocaleString('fa-IR')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-light">
            <Card.Body>
              <div className="fs-4 mb-1">📋</div>
              <Card.Title className="h6">چک‌های پرداختنی</Card.Title>
              <Card.Text className="h5 text-danger">
                {(stats.payableCheques || 0).toLocaleString('fa-IR')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-light">
            <Card.Body>
              <div className="fs-4 mb-1">👥</div>
              <Card.Title className="h6">تعداد اشخاص</Card.Title>
              <Card.Text className="h5 text-info">
                {(stats.totalPersons || 0).toLocaleString('fa-IR')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-light">
            <Card.Body>
              <div className="fs-4 mb-1">🏛️</div>
              <Card.Title className="h6">حساب‌های معین</Card.Title>
              <Card.Text className="h5 text-primary">
                {(stats.totalAccounts || 0).toLocaleString('fa-IR')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-light">
            <Card.Body>
              <div className="fs-4 mb-1">📊</div>
              <Card.Title className="h6">گردش امروز</Card.Title>
              <Card.Text className="h5 text-warning">
                {(stats.todayTurnover || 0).toLocaleString('fa-IR')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-light">
            <Card.Body>
              <div className="fs-4 mb-1">⚖️</div>
              <Card.Title className="h6">تراز اسناد</Card.Title>
              <Card.Text className={`h5 ${stats.vouchersBalanced ? 'text-success' : 'text-danger'}`}>
                {stats.vouchersBalanced ? '✅' : '❌'}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* میانبرهای سریع */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">🚀 دسترسی سریع</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {quickActions.map((action, index) => (
                  <Col md={4} key={index} className="mb-3">
                    <Card 
                      className={`h-100 border-${action.variant} cursor-pointer`}
                      onClick={() => router.push(action.path)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="text-center">
                        <div className="fs-1 mb-3">{action.icon}</div>
                        <Card.Title className="h6">{action.title}</Card.Title>
                        <Card.Text className="text-muted small">
                          {action.description}
                        </Card.Text>
                        <Button 
                          variant={action.variant} 
                          size="sm"
                          className="mt-2"
                        >
                          ورود
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* آخرین فعالیت‌ها */}
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">📝 آخرین اسناد</h6>
            </Card.Header>
            <Card.Body>
              {stats.recentVouchers && stats.recentVouchers.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.recentVouchers.slice(0, 5).map((voucher, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{voucher.voucherNumber}</strong>
                        <br />
                        <small className="text-muted">{voucher.description}</small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">{voucher.totalAmount.toLocaleString('fa-IR')} ریال</div>
                        <small className="text-muted">
                          {new Date(voucher.voucherDate).toLocaleDateString('fa-IR')}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center">هیچ سندی ثبت نشده است</p>
              )}
              <div className="text-center mt-3">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => router.push('/vouchers')}
                >
                  مشاهده همه اسناد
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">💳 چک‌های سررسید نزدیک</h6>
            </Card.Header>
            <Card.Body>
              {stats.dueCheques && stats.dueCheques.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.dueCheques.slice(0, 5).map((cheque, index) => (
                    <div key={index} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{cheque.chequeNumber}</strong>
                          <br />
                          <small className="text-muted">
                            {cheque.bankName} - {cheque.drawer}
                          </small>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-danger">
                            {cheque.amount.toLocaleString('fa-IR')} ریال
                          </div>
                          <small className="text-muted">
                            {new Date(cheque.dueDate).toLocaleDateString('fa-IR')}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center">هیچ چک سررسید نزدیک وجود ندارد</p>
              )}
              <div className="text-center mt-3">
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={() => router.push('/cheques')}
                >
                  مدیریت چک‌ها
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}