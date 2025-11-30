// src/app/components/layout/Sidebar.jsx
'use client'

import { Nav, Navbar, NavDropdown, Container } from 'react-bootstrap'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <Navbar expand="lg" className="sidebar flex-lg-column p-0 bg-dark text-white" style={{ width: '280px', minHeight: '100vh' }}>
      <Container fluid className="flex-lg-column p-0">
        {/* برند */}
        <Navbar.Brand 
          as={Link} 
          href="/dashboard" 
          className="w-100 text-center text-white border-bottom py-3"
        >
          <h5 className="mb-0">🧮 سیستم حسابداری</h5>
        </Navbar.Brand>

        {/* دکمه همبرگر برای موبایل */}
        <Navbar.Toggle 
          aria-controls="sidebar-nav" 
          className="border-0 m-3"
        >
          <span className="navbar-toggler-icon"></span>
        </Navbar.Toggle>

        {/* منوی اصلی */}
        <Navbar.Collapse id="sidebar-nav" className="flex-lg-column w-100">
          <Nav className="flex-lg-column w-100">
            
            {/* داشبورد */}
            <Nav.Link
              as={Link}
              href="/dashboard"
              className={`text-white py-3 px-3 border-bottom ${isActive('/dashboard') ? 'bg-primary' : 'hover-bg-light'}`}
            >
              <span className="me-2">📊</span>
              داشبورد
            </Nav.Link>

            {/* اسناد حسابداری */}
            <NavDropdown
              title={
                <span>
                  <span className="me-2">📝</span>
                  اسناد حسابداری
                </span>
              }
              id="vouchers-dropdown"
              className="text-white border-bottom"
              menuVariant="dark"
            >
              <NavDropdown.Item 
                as={Link} 
                href="/vouchers"
                className={isActive('/vouchers') ? 'active' : ''}
              >
                لیست اسناد
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                href="/vouchers/create"
                className={isActive('/vouchers/create') ? 'active' : ''}
              >
                ثبت سند جدید
              </NavDropdown.Item>
            </NavDropdown>

            {/* مدیریت چک‌ها */}
            <Nav.Link
              as={Link}
              href="/cheques"
              className={`text-white py-3 px-3 border-bottom ${isActive('/cheques') ? 'bg-primary' : 'hover-bg-light'}`}
            >
              <span className="me-2">💳</span>
              مدیریت چک‌ها
            </Nav.Link>

            {/* حساب‌ها */}
            <NavDropdown
              title={
                <span>
                  <span className="me-2">🏦</span>
                  مدیریت حساب‌ها
                </span>
              }
              id="accounts-dropdown"
              className="text-white border-bottom"
              menuVariant="dark"
            >
              <NavDropdown.Header>حساب‌های معین</NavDropdown.Header>
              <NavDropdown.Item 
                as={Link} 
                href="/accounts"
                className={isActive('/accounts') ? 'active' : ''}
              >
                📋 لیست حساب‌های معین
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                href="/accounts/create"
                className={isActive('/accounts/create') ? 'active' : ''}
              >
                ➕ ایجاد حساب معین
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Header>حساب‌های تفصیلی</NavDropdown.Header>
              <NavDropdown.Item 
                as={Link} 
                href="/detail-accounts"
                className={isActive('/detail-accounts') ? 'active' : ''}
              >
                📋 لیست حساب‌های تفصیلی
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                href="/detail-accounts/create"
                className={isActive('/detail-accounts/create') ? 'active' : ''}
              >
                ➕ ایجاد حساب تفصیلی
              </NavDropdown.Item>

              <NavDropdown.Divider />
              
              <NavDropdown.Header>حساب‌های کل</NavDropdown.Header>
              <NavDropdown.Item 
                as={Link} 
                href="/categories"
                className={isActive('/categories') ? 'active' : ''}
              >
                📊 مشاهده ساختار حساب‌ها
              </NavDropdown.Item>
            </NavDropdown>

            {/* اشخاص */}
            <NavDropdown
              title={
                <span>
                  <span className="me-2">👥</span>
                  مدیریت اشخاص
                </span>
              }
              id="persons-dropdown"
              className="text-white border-bottom"
              menuVariant="dark"
            >
              <NavDropdown.Item 
                as={Link} 
                href="/persons"
                className={isActive('/persons') ? 'active' : ''}
              >
                📋 لیست اشخاص
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                href="/persons/create"
                className={isActive('/persons/create') ? 'active' : ''}
              >
                ➕ افزودن شخص جدید
              </NavDropdown.Item>
            </NavDropdown>

            {/* بانک‌ها و صندوق */}
            <Nav.Link
              as={Link}
              href="/banks"
              className={`text-white py-3 px-3 border-bottom ${isActive('/banks') ? 'bg-primary' : 'hover-bg-light'}`}
            >
              <span className="me-2">💰</span>
              بانک‌ها و صندوق
            </Nav.Link>

            {/* گزارش‌ها */}
            <NavDropdown
              title={
                <span>
                  <span className="me-2">📈</span>
                  گزارش‌های مالی
                </span>
              }
              id="reports-dropdown"
              className="text-white border-bottom"
              menuVariant="dark"
            >
              <NavDropdown.Header>گزارش‌های اصلی</NavDropdown.Header>
              <NavDropdown.Item 
                as={Link} 
                href="/reports"
                className={isActive('/reports') ? 'active' : ''}
              >
                📊 خلاصه گزارش‌ها
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                href="/reports/balance-sheet"
                className={isActive('/reports/balance-sheet') ? 'active' : ''}
              >
                ⚖️ ترازنامه
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                href="/reports/profit-loss"
                className={isActive('/reports/profit-loss') ? 'active' : ''}
              >
                📉 سود و زیان
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Header>گزارش‌های تفصیلی</NavDropdown.Header>
              <NavDropdown.Item 
                as={Link} 
                href="/reports/account-turnover"
                className={isActive('/reports/account-turnover') ? 'active' : ''}
              >
                🔄 گردش حساب‌ها
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                href="/reports/general-ledger"
                className={isActive('/reports/general-ledger') ? 'active' : ''}
              >
                📖 دفتر کل
              </NavDropdown.Item>
            </NavDropdown>

            {/* تنظیمات */}
            <Nav.Link
              as={Link}
              href="/settings"
              className={`text-white py-3 px-3 border-bottom ${isActive('/settings') ? 'bg-primary' : 'hover-bg-light'}`}
            >
              <span className="me-2">⚙️</span>
              تنظیمات سیستم
            </Nav.Link>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}