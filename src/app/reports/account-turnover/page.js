// src/app/reports/account-turnover/page.js
"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";

export default function AccountTurnoverPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    accountType: "",
  });

  useEffect(() => {
    fetchAccountsWithTurnover();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, accounts]);

  const fetchAccountsWithTurnover = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("📊 Fetching account turnover data...");
      
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const response = await fetch(`/api/accounts/account-turnover?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در دریافت اطلاعات گردش حساب‌ها");
      }

      const accountsData = await response.json();
      console.log("📋 Received turnover data:", accountsData);

      // بررسی داده‌های دریافتی
      if (accountsData.length > 0) {
        console.log("Sample turnover data:", accountsData[0]);
        
        // بررسی اینکه آیا داده‌های واقعی داریم
        const hasData = accountsData.some(account => 
          account.debitTurnover > 0 || account.creditTurnover > 0
        );
        
        if (!hasData) {
          console.warn("⚠️ No transaction data found in any account");
        }
      }

      setAccounts(accountsData);
      console.log("✅ Turnover data loaded successfully");
    } catch (error) {
      console.error("❌ Error fetching turnover data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountClick = (accountId) => {
    router.push(`/accounts/${accountId}`);
  };

  const applyFilters = () => {
    let filtered = accounts;

    // فیلتر بر اساس نوع حساب
    if (filters.accountType) {
      filtered = filtered.filter(
        (account) => account.category.type === filters.accountType
      );
    }

    setFilteredAccounts(filtered);
    console.log(
      `🔧 Applied filters: ${filtered.length} accounts after filtering`
    );
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      accountType: "",
    });
  };

  const handleApplyDateFilter = () => {
    fetchAccountsWithTurnover();
  };

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
    if (amount === null || amount === undefined || isNaN(amount))
      return "۰ ریال";
    return Math.abs(amount).toLocaleString("fa-IR") + " ریال";
  };

  const getBalanceSign = (account) => {
    const type = account.category.type;
    if (type === "asset" || type === "expense") {
      return account.finalBalance >= 0 ? "+" : "-";
    } else {
      return account.finalBalance >= 0 ? "+" : "-";
    }
  };

  const calculateTotals = () => {
    return filteredAccounts.reduce(
      (totals, account) => {
        totals.debit += account.debitTurnover || 0;
        totals.credit += account.creditTurnover || 0;
        totals.balance += account.finalBalance || 0;
        return totals;
      },
      { debit: 0, credit: 0, balance: 0 }
    );
  };

  // تابع برای تست داده‌های دیتابیس
  const testDatabaseData = async () => {
    try {
      const response = await fetch('/api/debug/voucher-items');
      const data = await response.json();
      console.log('🧪 Database test results:', data);
      alert(`تست دیتابیس: ${data.message}\n\nجزئیات در کنسول مرورگر`);
    } catch (error) {
      console.error('Test failed:', error);
      alert('خطا در تست دیتابیس');
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">در حال محاسبه گردش حساب‌ها...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">
          <h5>خطا در دریافت اطلاعات</h5>
          <p>{error}</p>
          <div className="d-flex gap-2 mt-3">
            <Button
              variant="outline-danger"
              onClick={fetchAccountsWithTurnover}
            >
              🔄 تلاش مجدد
            </Button>
            <Button
              variant="outline-warning"
              onClick={testDatabaseData}
            >
              🧪 تست دیتابیس
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const totals = calculateTotals();

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">گزارش گردش حساب‌ها</h1>
          <p className="text-muted mb-0">
            محاسبه گردش و مانده کلیه حساب‌های معین
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-warning" onClick={testDatabaseData}>
            🧪 تست دیتابیس
          </Button>
          <Button variant="outline-secondary" onClick={fetchAccountsWithTurnover}>
            🔄 بروزرسانی
          </Button>
        </div>
      </div>

      {/* فیلترها */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">فیلترها و تنظیمات</h5>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleResetFilters}
          >
            پاک کردن فیلترها
          </Button>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>از تاریخ</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>تا تاریخ</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>نوع حساب</Form.Label>
                <Form.Select
                  value={filters.accountType}
                  onChange={(e) =>
                    handleFilterChange("accountType", e.target.value)
                  }
                >
                  <option value="">همه انواع حساب</option>
                  <option value="asset">💼 دارایی</option>
                  <option value="liability">📋 بدهی</option>
                  <option value="equity">🏛️ سرمایه</option>
                  <option value="income">📈 درآمد</option>
                  <option value="expense">📉 هزینه</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button
                variant="primary"
                onClick={handleApplyDateFilter}
                className="w-100"
              >
                🔍 اعمال فیلتر تاریخ
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* آمار سریع */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center bg-light">
            <Card.Body>
              <div className="fs-4">📊</div>
              <Card.Title className="h6">تعداد حساب‌ها</Card.Title>
              <Card.Text className="h5 text-primary">
                {filteredAccounts.length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <div className="fs-4">💰</div>
              <Card.Title className="h6">جمع بدهکار</Card.Title>
              <Card.Text className="h5">
                {formatCurrency(totals.debit)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-danger text-white">
            <Card.Body>
              <div className="fs-4">📋</div>
              <Card.Title className="h6">جمع بستانکار</Card.Title>
              <Card.Text className="h5">
                {formatCurrency(totals.credit)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card
            className={`text-center ${
              totals.balance >= 0
                ? "bg-info text-white"
                : "bg-warning text-dark"
            }`}
          >
            <Card.Body>
              <div className="fs-4">⚖️</div>
              <Card.Title className="h6">مانده کل</Card.Title>
              <Card.Text className="h5">
                {formatCurrency(totals.balance)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* گزارش گردش حساب‌ها */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            گردش حساب‌ها
            <Badge bg="secondary" className="ms-2">
              {filteredAccounts.length}
            </Badge>
          </h5>
          <small className="text-muted">
            تاریخ گزارش: {new Date().toLocaleDateString("fa-IR")}
          </small>
        </Card.Header>
        <Card.Body className="p-0">
          {filteredAccounts.length > 0 ? (
            <>
              <Table striped bordered hover responsive className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th width="80">کد حساب</th>
                    <th>نام حساب</th>
                    <th width="100">نوع</th>
                    <th width="120" className="text-center">
                      مانده اول
                    </th>
                    <th width="120" className="text-center">
                      گردش بدهکار
                    </th>
                    <th width="120" className="text-center">
                      گردش بستانکار
                    </th>
                    <th width="120" className="text-center">
                      مانده akhir
                    </th>
                    <th width="80" className="text-center">
                      تراکنش
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((account) => (
                    <tr
                      key={account.id}
                      className="cursor-pointer hover-row"
                      onClick={() => handleAccountClick(account.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td
                        className="fw-bold font-monospace"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccountClick(account.id);
                        }}
                      >
                        {account.code}
                      </td>
                      <td>
                        <div
                          className="d-flex align-items-center account-name"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccountClick(account.id);
                          }}
                        >
                          <span className="me-2">
                            {account.category.type === "asset" && "💰"}
                            {account.category.type === "liability" && "📋"}
                            {account.category.type === "equity" && "🏛️"}
                            {account.category.type === "income" && "📈"}
                            {account.category.type === "expense" && "📉"}
                          </span>
                          {account.name}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${getTypeColor(
                            account.category.type
                          )}`}
                        >
                          {getTypeLabel(account.category.type)}
                        </span>
                      </td>
                      <td className="text-center text-muted">
                        {formatCurrency(account.initialBalance || 0)}
                      </td>
                      <td className="text-center text-success fw-bold">
                        {formatCurrency(account.debitTurnover || 0)}
                      </td>
                      <td className="text-center text-danger fw-bold">
                        {formatCurrency(account.creditTurnover || 0)}
                      </td>
                      <td
                        className={`text-center fw-bold ${
                          (account.finalBalance || 0) >= 0
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        {getBalanceSign(account)}{" "}
                        {formatCurrency(account.finalBalance || 0)}
                      </td>
                      <td className="text-center">
                        <Badge
                          bg="info"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccountClick(account.id);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {account.transactionCount || 0}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-active">
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">
                      جمع کل:
                    </td>
                    <td className="text-center text-success fw-bold">
                      {formatCurrency(totals.debit)}
                    </td>
                    <td className="text-center text-danger fw-bold">
                      {formatCurrency(totals.credit)}
                    </td>
                    <td
                      className={`text-center fw-bold ${
                        totals.balance >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {totals.balance >= 0 ? "+" : "-"}{" "}
                      {formatCurrency(totals.balance)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </>
          ) : (
            <div className="text-center py-5">
              <div className="fs-1 mb-3">📊</div>
              <h5 className="text-muted">هیچ حسابی برای نمایش وجود ندارد</h5>
              <p className="text-muted mb-3">
                {accounts.length === 0
                  ? "هنوز هیچ حسابی ثبت نشده یا اطلاعات تراکنش‌ها موجود نیست."
                  : "با فیلترهای فعلی هیچ حسابی یافت نشد."}
              </p>
              <Button variant="outline-primary" onClick={handleResetFilters}>
                نمایش همه حساب‌ها
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}