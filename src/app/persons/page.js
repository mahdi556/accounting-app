// src/app/persons/page.js
'use client'
import { useState, useEffect } from 'react'
import { Container, Table, Button, Badge, Card, Row, Col, Form } from 'react-bootstrap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PersonsPage() {
  const [persons, setPersons] = useState([])
  const [filteredPersons, setFilteredPersons] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchPersons()
  }, [])

  useEffect(() => {
    filterPersons()
  }, [persons, searchTerm, typeFilter])

  const fetchPersons = async () => {
    try {
      const response = await fetch('/api/persons')
      if (response.ok) {
        const data = await response.json()
        setPersons(data)
      } else {
        console.error('Error fetching persons')
      }
    } catch (error) {
      console.error('Error fetching persons:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPersons = () => {
    let filtered = persons

    // فیلتر بر اساس جستجو
    if (searchTerm) {
      filtered = filtered.filter(person =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.phone?.includes(searchTerm) ||
        person.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // فیلتر بر اساس نوع
    if (typeFilter) {
      filtered = filtered.filter(person => person.type === typeFilter)
    }

    setFilteredPersons(filtered)
  }

  const getTypeLabel = (type) => {
    const labels = {
      customer: 'مشتری',
      supplier: 'تأمین کننده',
      employee: 'پرسنل'
    }
    return labels[type] || type
  }

  const getTypeVariant = (type) => {
    const variants = {
      customer: 'success',
      supplier: 'warning',
      employee: 'info'
    }
    return variants[type] || 'secondary'
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`آیا از حذف "${name}" اطمینان دارید؟`)) {
      try {
        const response = await fetch(`/api/persons/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('شخص با موفقیت حذف شد')
          fetchPersons() // رفرش لیست
        } else {
          const error = await response.json()
          alert(`خطا: ${error.error}`)
        }
      } catch (error) {
        console.error('Error deleting person:', error)
        alert('خطا در حذف شخص')
      }
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال بارگذاری اطلاعات اشخاص...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>مدیریت اشخاص</h1>
        <Link href="/persons/create">
          <Button variant="primary">
            ➕ افزودن شخص جدید
          </Button>
        </Link>
      </div>

      {/* آمار و فیلترها */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>جستجو</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="جستجو بر اساس نام، تلفن یا آدرس..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>فیلتر بر اساس نوع</Form.Label>
                <Form.Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">همه انواع</option>
                  <option value="customer">مشتری</option>
                  <option value="supplier">تأمین کننده</option>
                  <option value="employee">پرسنل</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div>
                <small className="text-muted">
                  نمایش {filteredPersons.length} نفر از {persons.length} شخص
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* لیست اشخاص */}
      <Card>
        <Card.Body>
          {filteredPersons.length > 0 ? (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>نام</th>
                  <th>نوع</th>
                  <th>تلفن</th>
                  <th>آدرس</th>
                  <th>تاریخ ثبت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersons.map(person => (
                  <tr key={person.id}>
                    <td className="fw-bold">{person.name}</td>
                    <td>
                      <Badge bg={getTypeVariant(person.type)}>
                        {getTypeLabel(person.type)}
                      </Badge>
                    </td>
                    <td>{person.phone || '-'}</td>
                    <td>
                      {person.address ? (
                        <span title={person.address}>
                          {person.address.length > 30 
                            ? person.address.substring(0, 30) + '...' 
                            : person.address
                          }
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {new Date(person.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => router.push(`/persons/${person.id}`)}
                        >
                          مشاهده
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(person.id, person.name)}
                        >
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <h5 className="text-muted">هیچ شخصی یافت نشد</h5>
              <p className="text-muted mb-3">
                {persons.length === 0 
                  ? 'هنوز هیچ شخصی ثبت نشده است.' 
                  : 'با فیلترهای فعلی هیچ شخصی یافت نشد.'
                }
              </p>
              {persons.length === 0 && (
                <Link href="/persons/create">
                  <Button variant="primary">
                    افزودن اولین شخص
                  </Button>
                </Link>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}