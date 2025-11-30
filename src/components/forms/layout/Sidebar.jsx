// src/app/components/layout/Sidebar.jsx
'use client'

import { Nav } from 'react-bootstrap'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    { href: '/dashboard', icon: '📊', label: 'داشبورد' },
    { href: '/vouchers', icon: '📝', label: 'اسناد حسابداری' },
    { 
      href: '#', 
      icon: '🏦', 
      label: 'حساب‌ها',
      children: [
        { href: '/accounts', label: 'حساب‌های معین' },
        { href: '/detail-accounts', label: 'حساب‌های تفصیلی' },
        { href: '/accounts/create', label: 'ایجاد حساب معین' },
        { href: '/detail-accounts/create', label: 'ایجاد حساب تفصیلی' }
      ]
    },
    { href: '/persons', icon: '👥', label: 'اشخاص' },
    { href: '/banks', icon: '💰', label: 'بانک‌ها و صندوق' },
    { href: '/reports', icon: '📈', label: 'گزارش‌ها' },
  ]

  const isActive = (href) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="sidebar bg-dark text-white" style={{ width: '250px', minHeight: '100vh' }}>
      <div className="p-3 border-bottom">
        <h5 className="mb-0">منوی حسابداری</h5>
      </div>
      
      <Nav className="flex-column p-2">
        {menuItems.map((item) => (
          <div key={item.href}>
            {item.children ? (
              <div className="mb-2">
                <div className="text-white mb-1 rounded p-2 d-flex align-items-center">
                  <span className="me-2">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <div className="ms-3">
                  {item.children.map((child) => (
                    <Nav.Link
                      key={child.href}
                      as={Link}
                      href={child.href}
                      className={`text-white mb-1 rounded d-block ${
                        isActive(child.href) ? 'bg-primary' : 'hover-bg-light hover-text-dark'
                      }`}
                      style={{ 
                        textDecoration: 'none',
                        padding: '8px 12px',
                        fontSize: '0.9rem'
                      }}
                    >
                      {child.label}
                    </Nav.Link>
                  ))}
                </div>
              </div>
            ) : (
              <Nav.Link
                as={Link}
                href={item.href}
                className={`text-white mb-1 rounded ${
                  isActive(item.href) ? 'bg-primary' : 'hover-bg-light hover-text-dark'
                }`}
                style={{ 
                  textDecoration: 'none',
                  padding: '10px 15px'
                }}
              >
                <span className="me-2">{item.icon}</span>
                {item.label}
              </Nav.Link>
            )}
          </div>
        ))}
      </Nav>
    </div>
  )
}