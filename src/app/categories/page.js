// src/app/categories/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Card, Table, Button, Badge, Row, Col, Accordion, Tree, Alert, Spinner } from 'react-bootstrap'
import Link from 'next/link'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState(new Set())

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        
        // به طور پیش‌فرض حساب‌های کل اصلی رو باز کن
        const mainCategories = data.filter(cat => !cat.parentId)
        const expanded = new Set(mainCategories.map(cat => cat.id))
        setExpandedCategories(expanded)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
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

  const getTypeIcon = (type) => {
    const icons = {
      asset: '💰',
      liability: '📋',
      equity: '🏛️',
      income: '📈',
      expense: '📉'
    }
    return icons[type] || '📁'
  }

  const renderCategoryTree = (parentId = null, level = 0) => {
    const childCategories = categories.filter(cat => cat.parentId === parentId)
    
    return childCategories.map(category => {
      const hasChildren = categories.some(cat => cat.parentId === category.id)
      const isExpanded = expandedCategories.has(category.id)
      const subAccountsCount = category.subAccounts?.length || 0
      const childrenCount = category.children?.length || 0

      return (
        <div key={category.id} className="category-tree-item">
          <div 
            className={`d-flex align-items-center py-2 px-3 border-bottom hover-bg-light cursor-pointer ${level > 0 ? 'ms-4' : ''}`}
            style={{ 
              borderLeft: level > 0 ? '3px solid #dee2e6' : 'none',
              marginLeft: level * 20
            }}
            onClick={() => hasChildren && toggleCategory(category.id)}
          >
            {/* آیکون expand/collapse */}
            {hasChildren && (
              <span className="me-2" style={{ width: '20px', textAlign: 'center' }}>
                {isExpanded ? '📂' : '📁'}
              </span>
            )}
            {!hasChildren && (
              <span className="me-2" style={{ width: '20px', textAlign: 'center' }}>
                '📄'
              </span>
            )}

            {/* آیکون نوع حساب */}
            <span className="me-2 fs-5">{getTypeIcon(category.type)}</span>

            {/* اطلاعات حساب */}
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong className="me-2">{category.code}</strong>
                  <span className="fw-bold">{category.name}</span>
                  <Badge bg={getTypeColor(category.type)} className="ms-2">
                    {getTypeLabel(category.type)}
                  </Badge>
                </div>
                <div className="text-muted">
                  <small>
                    {childrenCount > 0 && (
                      <span className="me-2">
                        {childrenCount} زیرمجموعه
                      </span>
                    )}
                    {subAccountsCount > 0 && (
                      <span>
                        {subAccountsCount} حساب معین
                      </span>
                    )}
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* نمایش زیرمجموعه‌ها */}
          {hasChildren && isExpanded && (
            <div className="category-children">
              {renderCategoryTree(category.id, level + 1)}
            </div>
          )}

          {/* نمایش حساب‌های معین */}
          {isExpanded && subAccountsCount > 0 && (
            <div className="sub-accounts ms-5">
              {category.subAccounts.map(subAccount => (
                <div 
                  key={subAccount.id}
                  className="d-flex align-items-center py-2 px-3 border-bottom bg-light"
                  style={{ marginLeft: (level + 1) * 20 }}
                >
                  <span className="me-2">🔹</span>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-primary me-2">{subAccount.code}</strong>
                        <span>{subAccount.name}</span>
                      </div>
                      <div>
                        <Badge bg="outline-primary" className="me-2">
                          موجودی: {subAccount.balance?.toLocaleString('fa-IR')}
                        </Badge>
                        <Link href={`/accounts/${subAccount.id}`}>
                          <Button variant="outline-primary" size="sm">
                            مشاهده
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    })
  }

  const getCategoryStats = () => {
    const stats = {
      total: categories.length,
      asset: categories.filter(cat => cat.type === 'asset').length,
      liability: categories.filter(cat => cat.type === 'liability').length,
      equity: categories.filter(cat => cat.type === 'equity').length,
      income: categories.filter(cat => cat.type === 'income').length,
      expense: categories.filter(cat => cat.type === 'expense').length,
      main: categories.filter(cat => !cat.parentId).length,
      sub: categories.filter(cat => cat.parentId).length
    }

    const totalSubAccounts = categories.reduce((sum, cat) => sum + (cat.subAccounts?.length || 0), 0)

    return { ...stats, totalSubAccounts }
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">در حال بارگذاری ساختار حساب‌ها...</p>
        </div>
      </Container>
    )
  }

  const stats = getCategoryStats()

  return (
    <Container>
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">ساختار حساب‌های کل</h1>
          <p className="text-muted mb-0">نمایش سلسله مراتب و ارتباط حساب‌های حسابداری</p>
        </div>
        <div>
          <Link href="/categories/create">
            <Button variant="primary">
              ➕ ایجاد حساب کل جدید
            </Button>
          </Link>
        </div>
      </div>

      {/* آمار کلی */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center bg-light">
            <Card.Body>
              <div className="fs-4">📊</div>
              <Card.Title className="h5">کل حساب‌ها</Card.Title>
              <Card.Text className="h4 text-primary">{stats.total}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <div className="fs-4">💰</div>
              <Card.Title className="h5">دارایی</Card.Title>
              <Card.Text className="h4">{stats.asset}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-danger text-white">
            <Card.Body>
              <div className="fs-4">📋</div>
              <Card.Title className="h5">بدهی</Card.Title>
              <Card.Text className="h4">{stats.liability}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-primary text-white">
            <Card.Body>
              <div className="fs-4">🏛️</div>
              <Card.Title className="h5">سرمایه</Card.Title>
              <Card.Text className="h4">{stats.equity}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-info text-white">
            <Card.Body>
              <div className="fs-4">📈</div>
              <Card.Title className="h5">درآمد</Card.Title>
              <Card.Text className="h4">{stats.income}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-warning text-dark">
            <Card.Body>
              <div className="fs-4">📉</div>
              <Card.Title className="h5">هزینه</Card.Title>
              <Card.Text className="h4">{stats.expense}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ساختار درختی */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">سلسله مراتب حساب‌ها</h5>
          <div>
            <small className="text-muted">
              {stats.main} حساب اصلی • {stats.sub} زیرمجموعه • {stats.totalSubAccounts} حساب معین
            </small>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {categories.length > 0 ? (
            <div className="category-tree">
              {renderCategoryTree()}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="fs-1 mb-3">📁</div>
              <h5 className="text-muted">هیچ حساب کلی ثبت نشده است</h5>
              <p className="text-muted mb-3">
                برای شروع، اولین حساب کل خود را ایجاد کنید.
              </p>
              <Link href="/categories/create">
                <Button variant="primary">
                  ایجاد اولین حساب کل
                </Button>
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* راهنما */}
      <Card className="mt-4">
        <Card.Header>
          <h6 className="mb-0">📋 راهنمای ساختار حساب‌ها</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>نمادها:</h6>
              <ul className="list-unstyled">
                <li>📂 <strong>حساب کل با زیرمجموعه</strong> - قابل گسترش</li>
                <li>📁 <strong>حساب کل ساده</strong> - بدون زیرمجموعه</li>
                <li>🔹 <strong>حساب معین</strong> - زیرمجموعه حساب کل</li>
                <li>💰 <strong>دارایی</strong> - منابع اقتصادی واحد</li>
                <li>📋 <strong>بدهی</strong> - تعهدات واحد</li>
              </ul>
            </Col>
            <Col md={6}>
              <h6>ساختار:</h6>
              <ul className="list-unstyled">
                <li><strong>سطح ۱:</strong> حساب‌های کل اصلی</li>
                <li><strong>سطح ۲:</strong> حساب‌های کل فرعی</li>
                <li><strong>سطح ۳:</strong> حساب‌های معین</li>
                <li><strong>سطح ۴:</strong> حساب‌های تفصیلی</li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  )
}