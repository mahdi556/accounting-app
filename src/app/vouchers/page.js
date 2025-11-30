// src/app/vouchers/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Table, Button, Badge, Pagination } from 'react-bootstrap'
import Link from 'next/link'

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchVouchers(currentPage)
  }, [currentPage])

  const fetchVouchers = async (page = 1) => {
    try {
      const response = await fetch(`/api/vouchers?page=${page}&limit=10`)
      const data = await response.json()
      setVouchers(data.vouchers)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      // اطمینان از اینکه dateString معتبر است
      if (!dateString) return '-'
      
      const date = new Date(dateString)
      
      // بررسی معتبر بودن تاریخ
      if (isNaN(date.getTime())) return '-'
      
      return date.toLocaleDateString('fa-IR')
    } catch (error) {
      console.error('Error formatting date:', error)
      return '-'
    }
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 ریال'
    return amount.toLocaleString('fa-IR') + ' ریال'
  }

  if (loading) return <div className="text-center p-4">در حال بارگذاری...</div>

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>اسناد حسابداری</h1>
        <Link href="/vouchers/create">
          <Button variant="primary">ثبت سند جدید</Button>
        </Link>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>شماره سند</th>
            <th>تاریخ</th>
            <th>شرح</th>
            <th>مبلغ کل</th>
            <th>تعداد ردیف‌ها</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map(voucher => (
            <tr key={voucher.id}>
              <td>
                <Badge bg="secondary">{voucher.voucherNumber}</Badge>
              </td>
              <td>{formatDate(voucher.voucherDate)}</td>
              <td>{voucher.description}</td>
              <td className="fw-bold">{formatCurrency(voucher.totalAmount)}</td>
              <td>
                <Badge bg="info">{voucher.items.length}</Badge>
              </td>
              <td>
                <Link href={`/vouchers/${voucher.id}`}>
                  <Button variant="outline-primary" size="sm">
                    مشاهده
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {pagination.pages > 1 && (
        <div className="d-flex justify-content-center">
          <Pagination>
            <Pagination.Prev 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            />
            {[...Array(pagination.pages)].map((_, index) => (
              <Pagination.Item
                key={index + 1}
                active={index + 1 === currentPage}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next 
              disabled={currentPage === pagination.pages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            />
          </Pagination>
        </div>
      )}
    </Container>
  )
}