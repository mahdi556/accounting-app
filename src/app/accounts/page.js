"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Table,
  Button,
  Badge,
  Card,
  Row,
  Col,
  Form,
  Spinner,
} from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // اضافه شدن وضعیت خطا
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const router = useRouter();

  // 1. تابع فچ (Fetch) حساب‌ها
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching accounts...");
      // فراخوانی API route.js برای دریافت لیست حساب‌ها با موجودی محاسبه شده
      const response = await fetch("/api/accounts");
      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Received accounts:", data);
        setAccounts(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در دریافت اطلاعات حساب‌ها");
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError(err.message);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []); // هیچ وابستگی خارجی ندارد

  // 2. تابع فیلتر (Filter) حساب‌ها
  const filterAccounts = useCallback(() => {
    let filtered = accounts;

    // فیلتر بر اساس جستجو
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (account) =>
          account.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
          account.code?.includes(searchTerm) ||
          account.category?.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
          account.category?.type?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // فیلتر بر اساس نوع
    if (typeFilter) {
      filtered = filtered.filter(
        (account) => account.category?.type === typeFilter
      );
    }

    setFilteredAccounts(filtered);
  }, [accounts, searchTerm, typeFilter]);

  // 3. اجرای فچ در زمان بارگذاری
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // 4. اجرای فیلتر در زمان تغییر لیست حساب‌ها یا فیلترها
  useEffect(() => {
    filterAccounts();
  }, [filterAccounts]);

  // --- توابع کمکی ---

  const getTypeColor = (type) => {
    const colors = {
      asset: "success",
      liability: "danger",
      equity: "primary",
      income: "info",
      expense: "warning",
    };
    return colors[type] || "secondary";
  };

  const getTypeLabel = (type) => {
    const labels = {
      asset: "دارایی",
      liability: "بدهی",
      equity: "سرمایه",
      income: "درآمد",
      expense: "هزینه",
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount) => {
    // مقدار مطلق را نمایش می‌دهد
    if (amount === null || amount === undefined || isNaN(amount))
      return "۰ ریال";
    return Math.abs(amount).toLocaleString("fa-IR") + " ریال";
  };

  const getTransactionCount = (account) => {
    // از فیلد محاسبه شده در سمت سرور استفاده می‌کند
    return account.transactionCount || 0;
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`آیا از حذف حساب "${name}" اطمینان دارید؟`)) {
      try {
        const response = await fetch(`/api/accounts/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("حساب با موفقیت حذف شد");
          fetchAccounts(); // رفرش لیست
        } else {
          const error = await response.json();
          alert(`خطا: ${error.error}`);
        }
      } catch (err) {
        console.error("Error deleting account:", err);
        alert("خطا در حذف حساب");
      }
    }
  };

  // --- بخش رندر ---

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" role="status" />
          <p className="mt-3">در حال بارگذاری حساب‌ها...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="alert alert-danger p-4">
          <h5>❌ خطا در بارگذاری اطلاعات</h5>
          <p>{error}</p>
          <Button variant="danger" onClick={fetchAccounts}>
            تلاش مجدد
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>مدیریت حساب‌های معین</h1>
          <p className="text-muted">لیست کلیه حساب‌ها با موجودی لحظه‌ای</p>
        </div>
        <Link href="/accounts/create">
          <Button variant="primary">➕ ایجاد حساب جدید</Button>
        </Link>
      </div>

      <hr />

      {/* آمار و فیلترها */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>جستجو</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="جستجو بر اساس نام، کد یا نوع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>فیلتر بر اساس نوع</Form.Label>
                <Form.Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">همه انواع</option>
                  <option value="asset">💼 دارایی</option>
                  <option value="liability">📋 بدهی</option>
                  <option value="equity">🏛️ سرمایه</option>
                  <option value="income">📈 درآمد</option>
                  <option value="expense">📉 هزینه</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div className="w-100">
                <small className="text-muted">
                  نمایش **{filteredAccounts.length}** حساب از **
                  {accounts.length}** حساب
                </small>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="ms-2"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("");
                  }}
                >
                  پاک کردن فیلترها
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* لیست حساب‌ها */}
      <Card>
        <Card.Body className="p-0">
          {filteredAccounts.length > 0 ? (
            <Table striped bordered hover responsive className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th width="100">کد حساب</th>
                  <th>نام حساب</th>
                  <th width="120">حساب کل</th>
                  <th width="100">نوع</th>
                  <th width="150" className="text-center">
                    موجودی (مانده)
                  </th>
                  <th width="120" className="text-center">
                    تعداد تراکنش
                  </th>
                  <th width="150" className="text-center">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="fw-bold font-monospace">{account.code}</td>
                    <td>
                      {account.name}{" "}
                      {account.hasDetailAccounts && (
                        <Badge
                          bg="info"
                          className="ms-2"
                          size="sm"
                          title="دارای حساب تفصیلی"
                        >
                          تفصیلی
                        </Badge>
                      )}
                    </td>
                    <td>{account.category?.name || "نامشخص"}</td>
                    <td>
                      <Badge bg={getTypeColor(account.category?.type)}>
                        {getTypeLabel(account.category?.type)}
                      </Badge>
                    </td>
                    {/* نمایش مانده با رنگ و علامت صحیح */}
                    <td
                      className={`fw-bold text-center ${
                        account.balance > 0
                          ? "text-success"
                          : account.balance < 0
                          ? "text-danger"
                          : "text-muted"
                      }`}
                    >
                      {(account.balance || 0) > 0
                        ? "بدهکار"
                        : (account.balance || 0) < 0
                        ? "بستانکار"
                        : "صفر"}
                      <br />
                      {formatCurrency(account.balance)}
                    </td>
                    <td className="text-center">
                      <Badge bg="info">{getTransactionCount(account)}</Badge>
                    </td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => router.push(`/accounts/${account.id}`)}
                        >
                          مشاهده
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(account.id, account.name)}
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
              <div className="fs-1 mb-3">🗃️</div>
              <h5 className="text-muted">هیچ حسابی یافت نشد</h5>
              <p className="text-muted mb-3">
                {accounts.length === 0
                  ? "هنوز هیچ حسابی ثبت نشده است."
                  : "با فیلترهای فعلی هیچ حسابی یافت نشد."}
              </p>
              {accounts.length === 0 && (
                <Link href="/accounts/create">
                  <Button variant="primary">ایجاد اولین حساب</Button>
                </Link>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
