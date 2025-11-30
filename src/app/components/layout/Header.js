// app/components/layout/Header.jsx
'use client'

import { Navbar, Nav, Container } from 'react-bootstrap'

export default function Header() {
  return (
    <Navbar bg="light" expand="lg" className="border-bottom">
      <Container fluid>
        <Navbar.Brand href="/" className="fw-bold">
          🧮 سیستم حسابداری
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/dashboard">داشبورد</Nav.Link>
            <Nav.Link href="/vouchers">اسناد</Nav.Link>
            <Nav.Link href="/accounts">حساب‌ها</Nav.Link>
            <Nav.Link href="/reports">گزارش‌ها</Nav.Link>
          </Nav>
          
          <Nav>
            <Nav.Link href="/profile">پروفایل</Nav.Link>
            <Nav.Link href="/logout">خروج</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}