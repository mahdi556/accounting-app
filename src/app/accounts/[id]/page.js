// src/app/accounts/[id]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Card, Table, Button, Row, Col, Badge, Alert, Spinner, Tabs, Tab } from 'react-bootstrap'

export default function AccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('turnover')

  useEffect(() => {
    console.log('Params:', params)
    if (params.id) {
      fetchAccount()
    }
  }, [params.id])

  const fetchAccount = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('Fetching account with ID:', params.id)
      const response = await fetch(`/api/accounts/${params.id}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Received account data:', data)
        setAccount(data)
      } else {
        const errorData = await response.json()
        console.log('API error:', errorData)
        setError(errorData.error || 'خطا در دریافت اطلاعات حساب')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
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

  const getTypeLabel = (type) => {
    const labels = {
      asset: 'دارایی',
      liability: 'بدهی',
      equity: 'سرمایه',
      income: 'درآمد',
      expense: 'هزینه'
    }
    return labels[type] || type
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
    if (amount === null || amount === undefined || isNaN(amount)) return '۰ ریال'
    return Math.abs(amount).toLocaleString('fa-IR') + ' ریال'
  }

  const calculateTurnover = () => {
    if (!account?.voucherItems) return { debit: 0, credit: 0, balance: 0 }

    const debit = account.voucherItems.reduce((sum, item) => sum + (item.debit || 0), 0)
    const credit = account.voucherItems.reduce((sum, item) => sum + (item.credit || 0), 0)
    
    let balance
    if (account.category.type === 'asset' || account.category.type === 'expense') {
      balance = debit - credit
    } else {
      balance = credit - debit
    }

    return { debit, credit, balance }
  }

  const getMonthlyTurnover = () => {
    if (!account?.voucherItems) return []

    const monthlyData = {}
    
    account.voucherItems.forEach(item => {
      const date = new Date(item.voucher.voucherDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          debit: 0,
          credit: 0,
          count: 0
        }
      }
      
      monthlyData[monthKey].debit += item.debit || 0
      monthlyData[monthKey].credit += item.credit || 0
      monthlyData[monthKey].count += 1
    })

    return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month))
  }

  const getBalanceSign = () => {
    const { balance } = calculateTurnover()
    const type = account?.category.type
    
    if (type === 'asset' || type === 'expense') {
      return balance >= 0 ? '+' : '-'
    } else {
      return balance >= 0 ? '+' : '-'
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">در حال بارگذاری اطلاعات حساب...</p>
          <p className="text-muted">شناسه: {params.id}</p>
        </div>
      </Container>
    )
  }

  if (error || !account) {
    return (
      <Container>
        <Alert variant="danger">
          <h5>خطا در دریافت اطلاعات</h5>
          <p>{error || 'حساب یافت نشد'}</p>
          <p className="text-muted">شناسه درخواستی: {params.id}</p>
          <div className="d-flex gap-2 mt-3">
            <Button variant="outline-danger" onClick={() => router.push('/accounts')}>
              بازگشت به لیست حساب‌ها
            </Button>
            <Button variant="outline-primary" onClick={fetchAccount}>
              تلاش مجدد
            </Button>
          </div>
        </Alert>
      </Container>
    )
  }

  const turnover = calculateTurnover()
  const monthlyTurnover = getMonthlyTurnover()
  const transactionCount = account.voucherItems?.length || 0

  return (
    <Container>
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">جزئیات حساب</h1>
          <p className="text-muted mb-0">
            {account.code} - {account.name}
          </p>
        </div>
        <Button 
          variant="outline-secondary" 
          onClick={() => router.push('/accounts')}
        >
          بازگشت به لیست
        </Button>
      </div>

      <Row>
        {/* اطلاعات اصلی حساب */}
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📊 اطلاعات حساب</h5>
              <Badge bg={getTypeColor(account.category.type)}>
                {getTypeLabel(account.category.type)}
              </Badge>
            </Card.Header>
            <Card.Body>
              <table className="table table-borderless table-sm">
                <tbody>
                  <tr>
                    <td className="fw-bold text-muted" width="120">کد حساب:</td>
                    <td className="fw-bold h6">{account.code}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold text-muted">نام حساب:</td>
                    <td className="fw-bold h6">{account.name}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold text-muted">حساب کل:</td>
                    <td>{account.category.name}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold text-muted">نوع حساب:</td>
                    <td>
                      <Badge bg={getTypeColor(account.category.type)}>
                        {getTypeLabel(account.category.type)}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-bold text-muted">تاریخ ایجاد:</td>
                    <td>{formatDate(account.createdAt)}</td>
                  </tr>
                </tbody>
              </table>
            </Card.Body>
          </Card>

          {/* آمار سریع */}
          <Card className="bg-light">
            <Card.Header>
              <h6 className="mb-0">📈 آمار حساب</h6>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="mb-3">
                  <div className="fs-5 text-muted">تعداد تراکنش‌ها</div>
                  <div className="h3 text-primary">{transactionCount}</div>
                </div>
                
                <Row>
                  <Col>
                    <div className="border rounded p-2 bg-white">
                      <div className="text-success fw-bold">💰 بدهکار</div>
                      <div className="h5 text-success">{formatCurrency(turnover.debit)}</div>
                    </div>
                  </Col>
                  <Col>
                    <div className="border rounded p-2 bg-white">
                      <div className="text-danger fw-bold">📋 بستانکار</div>
                      <div className="h5 text-danger">{formatCurrency(turnover.credit)}</div>
                    </div>
                  </Col>
                </Row>

                <div className="mt-3 p-3 border rounded bg-white">
                  <div className="text-muted">⚖️ مانده حساب</div>
                  <div className={`h4 ${turnover.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                    {getBalanceSign()} {formatCurrency(turnover.balance)}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* تب‌های جزئیات */}
        <Col md={8}>
          <Card>
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(tab) => setActiveTab(tab)}
                className="mb-3"
              >
                {/* تب گردش حساب */}
                <Tab eventKey="turnover" title="🔄 گردش حساب">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">گردش تفصیلی حساب</h6>
                    <Badge bg="info">
                      {transactionCount} تراکنش
                    </Badge>
                  </div>

                  {transactionCount > 0 ? (
                    <div className="table-responsive">
                      <Table striped bordered hover size="sm">
                        <thead className="table-dark">
                          <tr>
                            <th width="100">تاریخ</th>
                            <th width="100">شماره سند</th>
                            <th>شرح</th>
                            <th width="120" className="text-center">بدهکار</th>
                            <th width="120" className="text-center">بستانکار</th>
                            <th width="100" className="text-center">مانده</th>
                          </tr>
                        </thead>
                        <tbody>
                          {account.voucherItems.map((item, index) => {
                            // محاسبه مانده تجمعی
                            const previousItems = account.voucherItems.slice(0, index + 1)
                            let runningBalance = 0
                            
                            previousItems.forEach(prevItem => {
                              if (account.category.type === 'asset' || account.category.type === 'expense') {
                                runningBalance += (prevItem.debit || 0) - (prevItem.credit || 0)
                              } else {
                                runningBalance += (prevItem.credit || 0) - (prevItem.debit || 0)
                              }
                            })

                            return (
                              <tr key={item.id}>
                                <td className="text-nowrap">
                                  {formatDate(item.voucher.voucherDate)}
                                </td>
                                <td>
                                  <Badge 
                                    bg="secondary" 
                                    className="cursor-pointer"
                                    onClick={() => router.push(`/vouchers/${item.voucher.id}`)}
                                  >
                                    {item.voucher.voucherNumber}
                                  </Badge>
                                </td>
                                <td>
                                  <div>
                                    <div className="fw-bold">
                                      {item.description || item.voucher.description || 'بدون شرح'}
                                    </div>
                                    {item.person && (
                                      <small className="text-muted">
                                        شخص: {item.person.name}
                                      </small>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center text-success fw-bold">
                                  {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                                </td>
                                <td className="text-center text-danger fw-bold">
                                  {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                                </td>
                                <td className={`text-center fw-bold ${
                                  runningBalance >= 0 ? 'text-success' : 'text-danger'
                                }`}>
                                  {runningBalance >= 0 ? '+' : '-'} {formatCurrency(runningBalance)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot className="table-active">
                          <tr>
                            <td colSpan="3" className="text-end fw-bold">جمع کل:</td>
                            <td className="text-center text-success fw-bold">
                              {formatCurrency(turnover.debit)}
                            </td>
                            <td className="text-center text-danger fw-bold">
                              {formatCurrency(turnover.credit)}
                            </td>
                            <td className={`text-center fw-bold ${
                              turnover.balance >= 0 ? 'text-success' : 'text-danger'
                            }`}>
                              {getBalanceSign()} {formatCurrency(turnover.balance)}
                            </td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="fs-1 mb-3">📊</div>
                      <h6 className="text-muted">هیچ تراکنشی ثبت نشده است</h6>
                      <p className="text-muted">
                        این حساب تاکنون در هیچ سند حسابداری استفاده نشده است.
                      </p>
                      <Button 
                        variant="outline-primary"
                        onClick={() => router.push('/vouchers/create')}
                      >
                        ایجاد سند جدید
                      </Button>
                    </div>
                  )}
                </Tab>

                {/* تب گردش ماهانه */}
                <Tab eventKey="monthly" title="📅 گردش ماهانه">
                  <h6 className="mb-3">گردش حساب بر اساس ماه</h6>
                  
                  {monthlyTurnover.length > 0 ? (
                    <Table striped bordered hover size="sm">
                      <thead className="table-dark">
                        <tr>
                          <th>ماه</th>
                          <th className="text-center">تعداد تراکنش</th>
                          <th className="text-center">جمع بدهکار</th>
                          <th className="text-center">جمع بستانکار</th>
                          <th className="text-center">خالص ماه</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyTurnover.map((monthData, index) => {
                          const net = account.category.type === 'asset' || account.category.type === 'expense' 
                            ? monthData.debit - monthData.credit 
                            : monthData.credit - monthData.debit

                          return (
                            <tr key={index}>
                              <td className="fw-bold">{monthData.month}</td>
                              <td className="text-center">
                                <Badge bg="info">{monthData.count}</Badge>
                              </td>
                              <td className="text-center text-success fw-bold">
                                {formatCurrency(monthData.debit)}
                              </td>
                              <td className="text-center text-danger fw-bold">
                                {formatCurrency(monthData.credit)}
                              </td>
                              <td className={`text-center fw-bold ${
                                net >= 0 ? 'text-success' : 'text-danger'
                              }`}>
                                {net >= 0 ? '+' : '-'} {formatCurrency(net)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-muted">گردش ماهانه‌ای برای نمایش وجود ندارد</div>
                    </div>
                  )}
                </Tab>

                {/* تب اطلاعات فنی */}
                <Tab eventKey="info" title="ℹ️ اطلاعات فنی">
                  <Row>
                    <Col md={6}>
                      <h6>مشخصات فنی حساب</h6>
                      <table className="table table-borderless table-sm">
                        <tbody>
                          <tr>
                            <td className="fw-bold text-muted">شناسه دیتابیس:</td>
                            <td>{account.id}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold text-muted">کد حساب کل:</td>
                            <td>{account.category.code}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold text-muted">نوع حساب کل:</td>
                            <td>
                              <Badge bg={getTypeColor(account.category.type)}>
                                {account.category.type}
                              </Badge>
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-bold text-muted">تعداد تراکنش‌ها:</td>
                            <td>
                              <Badge bg="primary">{transactionCount}</Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Col>
                    <Col md={6}>
                      <h6>خلاصه مالی</h6>
                      <table className="table table-borderless table-sm">
                        <tbody>
                          <tr>
                            <td className="fw-bold text-muted">مجموع بدهکار:</td>
                            <td className="text-success fw-bold">{formatCurrency(turnover.debit)}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold text-muted">مجموع بستانکار:</td>
                            <td className="text-danger fw-bold">{formatCurrency(turnover.credit)}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold text-muted">مانده نهایی:</td>
                            <td className={`fw-bold ${
                              turnover.balance >= 0 ? 'text-success' : 'text-danger'
                            }`}>
                              {getBalanceSign()} {formatCurrency(turnover.balance)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}