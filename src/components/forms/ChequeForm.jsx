// src/components/forms/ChequeForm.jsx
"use client";
import { useState, useEffect } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Alert,
  Card,
  Badge,
  Spinner,
} from "react-bootstrap";
import PersianDatePicker from "../ui/PersianDatePicker";

export default function ChequeForm({ initialData = {}, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [persons, setPersons] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [detailAccounts, setDetailAccounts] = useState([]);
  const [accountType, setAccountType] = useState("subAccount"); // 'subAccount' یا 'detailAccount'

  const [formData, setFormData] = useState({
    chequeNumber: initialData.chequeNumber || "",
    bankName: initialData.bankName || "",
    branchName: initialData.branchName || "",
    amount: initialData.amount || "",
    issueDate: initialData.issueDate || new Date().toISOString().split("T")[0],
    dueDate: initialData.dueDate || "",
    drawer: initialData.drawer || "",
    payee: initialData.payee || "",
    type: initialData.type || "receivable",
    description: initialData.description || "",
    personId: initialData.personId || "",
    drawerAccountId: initialData.drawerAccountId || "",
    payeeAccountId: initialData.payeeAccountId || "",
    drawerDetailAccountId: initialData.drawerDetailAccountId || "",
    payeeDetailAccountId: initialData.payeeDetailAccountId || "",
  });

  useEffect(() => {
    fetchPersons();
    fetchAccounts();
    fetchDetailAccounts();
  }, []);

  const fetchPersons = async () => {
    try {
      const response = await fetch("/api/persons");
      if (response.ok) {
        const data = await response.json();
        setPersons(data);
      }
    } catch (error) {
      console.error("Error fetching persons:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchDetailAccounts = async () => {
    try {
      const response = await fetch("/api/detail-accounts");
      if (response.ok) {
        const data = await response.json();
        setDetailAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching detail accounts:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // اعتبارسنجی داده‌های اجباری
      if (
        !formData.chequeNumber ||
        !formData.bankName ||
        !formData.amount ||
        !formData.issueDate ||
        !formData.dueDate ||
        !formData.drawer
      ) {
        setError("پر کردن فیلدهای ستاره‌دار الزامی است");
        setLoading(false);
        return;
      }

      // اعتبارسنجی مبلغ
      if (parseFloat(formData.amount) <= 0) {
        setError("مبلغ چک باید بزرگتر از صفر باشد");
        setLoading(false);
        return;
      }

      // اعتبارسنجی تاریخ‌ها
      const issueDate = new Date(formData.issueDate);
      const dueDate = new Date(formData.dueDate);

      if (dueDate < issueDate) {
        setError("تاریخ سررسید نمی‌تواند قبل از تاریخ صدور باشد");
        setLoading(false);
        return;
      }

      // اعتبارسنجی حساب‌ها بر اساس نوع چک
      if (formData.type === "receivable") {
        if (accountType === "subAccount" && !formData.drawerAccountId) {
          setError("برای چک دریافتنی، انتخاب حساب صادرکننده الزامی است");
          setLoading(false);
          return;
        }
        if (
          accountType === "detailAccount" &&
          !formData.drawerDetailAccountId
        ) {
          setError("برای چک دریافتنی، انتخاب حساب تفصیلی صادرکننده الزامی است");
          setLoading(false);
          return;
        }
      }

      if (formData.type === "payable") {
        if (accountType === "subAccount" && !formData.payeeAccountId) {
          setError("برای چک پرداختنی، انتخاب حساب گیرنده الزامی است");
          setLoading(false);
          return;
        }
        if (accountType === "detailAccount" && !formData.payeeDetailAccountId) {
          setError("برای چک پرداختنی، انتخاب حساب تفصیلی گیرنده الزامی است");
          setLoading(false);
          return;
        }
      }

      // آماده کردن داده‌ها برای ارسال
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        personId: formData.personId ? parseInt(formData.personId) : null,
        drawerAccountId:
          accountType === "subAccount" && formData.drawerAccountId
            ? parseInt(formData.drawerAccountId)
            : null,
        payeeAccountId:
          accountType === "subAccount" && formData.payeeAccountId
            ? parseInt(formData.payeeAccountId)
            : null,
        drawerDetailAccountId:
          accountType === "detailAccount" && formData.drawerDetailAccountId
            ? parseInt(formData.drawerDetailAccountId)
            : null,
        payeeDetailAccountId:
          accountType === "detailAccount" && formData.payeeDetailAccountId
            ? parseInt(formData.payeeDetailAccountId)
            : null,
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
      };

      // حذف فیلدهای null برای جلوگیری از خطا
      Object.keys(submitData).forEach((key) => {
        if (submitData[key] === null || submitData[key] === "") {
          delete submitData[key];
        }
      });

      const url = initialData.id
        ? `/api/cheques/${initialData.id}`
        : "/api/cheques";
      const method = initialData.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        const message = initialData.id
          ? "چک با موفقیت ویرایش شد"
          : formData.type === "receivable"
          ? "چک دریافتنی ثبت شد و سند حسابداری ایجاد گردید"
          : "چک پرداختنی ثبت شد و سند حسابداری ایجاد گردید";

        alert(message);
        if (onSuccess) onSuccess(result);

        if (!initialData.id) {
          // ریست فرم پس از ایجاد موفق
          resetForm();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "خطا در ثبت چک");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // پاک کردن خطا هنگام تغییر فیلد
    if (error) {
      setError("");
    }
  };

  const resetForm = () => {
    setFormData({
      chequeNumber: "",
      bankName: "",
      branchName: "",
      amount: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      drawer: "",
      payee: "",
      type: "receivable",
      description: "",
      personId: "",
      drawerAccountId: "",
      payeeAccountId: "",
      drawerDetailAccountId: "",
      payeeDetailAccountId: "",
    });
    setAccountType("subAccount");
    setError("");
  };

  const getTypeColor = (type) => {
    return type === "receivable" ? "success" : "danger";
  };

  const getTypeLabel = (type) => {
    return type === "receivable" ? "دریافتنی" : "پرداختنی";
  };

  const getSelectedDrawerAccount = () => {
    if (accountType === "subAccount") {
      return accounts.find(
        (acc) => acc.id === parseInt(formData.drawerAccountId)
      );
    } else {
      return detailAccounts.find(
        (acc) => acc.id === parseInt(formData.drawerDetailAccountId)
      );
    }
  };

  const getSelectedPayeeAccount = () => {
    if (accountType === "subAccount") {
      return accounts.find(
        (acc) => acc.id === parseInt(formData.payeeAccountId)
      );
    } else {
      return detailAccounts.find(
        (acc) => acc.id === parseInt(formData.payeeDetailAccountId)
      );
    }
  };

  const getAccountCode = (account) => {
    return account ? account.code : "";
  };

  const getAccountName = (account) => {
    return account ? account.name : "";
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      if (
        window.confirm("آیا از انصراف اطمینان دارید؟ تغییرات ذخیره نخواهند شد.")
      ) {
        resetForm();
      }
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="rtl">
      {error && (
        <Alert variant="danger" className="mb-3">
          <strong>خطا:</strong> {error}
        </Alert>
      )}
      {/* اطلاعات اصلی چک */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">📋 اطلاعات چک</h6>
          <Badge bg={getTypeColor(formData.type)}>
            {getTypeLabel(formData.type)}
          </Badge>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>نوع چک *</Form.Label>
                <Form.Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="receivable">💰 چک دریافتنی</option>
                  <option value="payable">📋 چک پرداختنی</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>شماره چک *</Form.Label>
                <Form.Control
                  type="text"
                  name="chequeNumber"
                  value={formData.chequeNumber}
                  onChange={handleChange}
                  required
                  placeholder="مثال: 123456"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>نام بانک *</Form.Label>
                <Form.Control
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                  placeholder="مثال: ملی، ملت، صادرات"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>شعبه بانک</Form.Label>
                <Form.Control
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  placeholder="مثال: شعبه مرکزی"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>مبلغ چک (ریال) *</Form.Label>
                <Form.Control
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>صادرکننده *</Form.Label>
                <Form.Control
                  type="text"
                  name="drawer"
                  value={formData.drawer}
                  onChange={handleChange}
                  required
                  placeholder="نام صادرکننده چک"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* انتخاب نوع حساب */}
          <Form.Group className="mb-3">
            <Form.Label>نوع حساب *</Form.Label>
            <Form.Select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              required
            >
              <option value="subAccount">حساب معین</option>
              <option value="detailAccount">حساب تفصیلی</option>
            </Form.Select>
            <Form.Text className="text-muted">
              {accountType === "subAccount"
                ? "انتخاب از بین حساب‌های معین"
                : "انتخاب از بین حساب‌های تفصیلی (اشخاص)"}
            </Form.Text>
          </Form.Group>

          {/* انتخاب حساب صادرکننده برای چک دریافتنی */}
          {formData.type === "receivable" && (
            <Form.Group className="mb-3">
              <Form.Label>
                حساب صادرکننده *
                <small className="text-muted me-2">
                  ({accountType === "subAccount" ? "معین" : "تفصیلی"})
                </small>
              </Form.Label>
              {accountType === "subAccount" ? (
                <Form.Select
                  name="drawerAccountId"
                  value={formData.drawerAccountId}
                  onChange={handleChange}
                  required={formData.type === "receivable"}
                >
                  <option value="">انتخاب حساب معین صادرکننده</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name} ({account.category?.name})
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Form.Select
                  name="drawerDetailAccountId"
                  value={formData.drawerDetailAccountId}
                  onChange={handleChange}
                  required={formData.type === "receivable"}
                >
                  <option value="">انتخاب حساب تفصیلی صادرکننده</option>
                  {detailAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                      {account.person && ` (${account.person.name})`}
                    </option>
                  ))}
                </Form.Select>
              )}
              {((accountType === "subAccount" && formData.drawerAccountId) ||
                (accountType === "detailAccount" &&
                  formData.drawerDetailAccountId)) &&
                getSelectedDrawerAccount() && (
                  <Form.Text className="text-success">
                    ✅ حساب انتخاب شده:{" "}
                    {getAccountCode(getSelectedDrawerAccount())} -{" "}
                    {getAccountName(getSelectedDrawerAccount())}
                  </Form.Text>
                )}
            </Form.Group>
          )}

          {/* انتخاب حساب گیرنده برای چک پرداختنی */}
          {formData.type === "payable" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>گیرنده چک *</Form.Label>
                <Form.Control
                  type="text"
                  name="payee"
                  value={formData.payee}
                  onChange={handleChange}
                  required={formData.type === "payable"}
                  placeholder="نام گیرنده چک"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  حساب گیرنده *
                  <small className="text-muted me-2">
                    ({accountType === "subAccount" ? "معین" : "تفصیلی"})
                  </small>
                </Form.Label>
                {accountType === "subAccount" ? (
                  <Form.Select
                    name="payeeAccountId"
                    value={formData.payeeAccountId}
                    onChange={handleChange}
                    required={formData.type === "payable"}
                  >
                    <option value="">انتخاب حساب معین گیرنده</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name} (
                        {account.category?.name})
                      </option>
                    ))}
                  </Form.Select>
                ) : (
                  <Form.Select
                    name="payeeDetailAccountId"
                    value={formData.payeeDetailAccountId}
                    onChange={handleChange}
                    required={formData.type === "payable"}
                  >
                    <option value="">انتخاب حساب تفصیلی گیرنده</option>
                    {detailAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                        {account.person && ` (${account.person.name})`}
                      </option>
                    ))}
                  </Form.Select>
                )}
                {((accountType === "subAccount" && formData.payeeAccountId) ||
                  (accountType === "detailAccount" &&
                    formData.payeeDetailAccountId)) &&
                  getSelectedPayeeAccount() && (
                    <Form.Text className="text-success">
                      ✅ حساب انتخاب شده:{" "}
                      {getAccountCode(getSelectedPayeeAccount())} -{" "}
                      {getAccountName(getSelectedPayeeAccount())}
                    </Form.Text>
                  )}
              </Form.Group>
            </>
          )}

          <Row>
            <Col md={6}>
              {/* <Form.Group className="mb-3">
                <Form.Control
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                required
                />
                </Form.Group> */}
            </Col>
            <Form.Group className="mb-3">
              <Form.Label>تاریخ صدور *</Form.Label>
              <PersianDatePicker
                selected={formData.issueDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, issueDate: date }))
                }
                placeholder="تاریخ صدور چک"
                required
              />
            </Form.Group>
            <Col md={6}>
              {/* <Form.Group className="mb-3">
                <Form.Control
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                />
                </Form.Group> */}
              <Form.Group className="mb-3">
                <Form.Label>تاریخ سررسید *</Form.Label>
                <PersianDatePicker
                  selected={formData.dueDate}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, dueDate: date }))
                  }
                  placeholder="تاریخ سررسید چک"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>شخص مرتبط</Form.Label>
            <Form.Select
              name="personId"
              value={formData.personId}
              onChange={handleChange}
            >
              <option value="">بدون شخص</option>
              {persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} (
                  {person.type === "customer"
                    ? "مشتری"
                    : person.type === "supplier"
                    ? "تأمین کننده"
                    : "پرسنل"}
                  ){person.detailAccount && ` - ${person.detailAccount.code}`}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>شرح</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="شرح مختصر درباره چک"
            />
          </Form.Group>
        </Card.Body>
      </Card>
      {/* اطلاعات سند حسابداری برای چک دریافتنی */}
      {formData.type === "receivable" &&
        formData.amount &&
        ((accountType === "subAccount" && formData.drawerAccountId) ||
          (accountType === "detailAccount" &&
            formData.drawerDetailAccountId)) && (
          <Card className="mb-4 border-success">
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0">📝 سند حسابداری خودکار (دریافتنی)</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="border rounded p-3 bg-light">
                    <strong>بدهکار:</strong>
                    <div className="mt-2">
                      <Badge bg="info" className="me-2">
                        {getAccountCode(getSelectedDrawerAccount())}
                      </Badge>
                      <span>
                        {getAccountName(getSelectedDrawerAccount())}
                        {accountType === "detailAccount" && " (حساب تفصیلی)"}
                        {accountType === "subAccount" && " (حساب معین)"}
                      </span>
                      {accountType === "detailAccount" &&
                        getSelectedDrawerAccount()?.person && (
                          <div className="mt-1">
                            <small className="text-muted">
                              شخص: {getSelectedDrawerAccount().person.name}
                            </small>
                          </div>
                        )}
                    </div>
                    <div className="mt-2 text-success fw-bold">
                      مبلغ:{" "}
                      {parseFloat(formData.amount || 0).toLocaleString("fa-IR")}{" "}
                      ریال
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 bg-light">
                    <strong>بستانکار:</strong>
                    <div className="mt-2">
                      <Badge bg="success" className="me-2">
                        1-02-0001
                      </Badge>
                      <span>چک‌های دریافتنی</span>
                    </div>
                    <div className="mt-2 text-danger fw-bold">
                      مبلغ:{" "}
                      {parseFloat(formData.amount || 0).toLocaleString("fa-IR")}{" "}
                      ریال
                    </div>
                  </div>
                </Col>
              </Row>
              <div className="mt-3">
                <Alert variant="info" className="mb-0">
                  <small>
                    <strong>توجه:</strong>
                    {accountType === "detailAccount"
                      ? " سند برای حساب تفصیلی صادر خواهد شد و شخص مرتبط به طور خودکار ثبت می‌شود."
                      : " سند برای حساب معین صادر خواهد شد."}
                  </small>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        )}
      {/* اطلاعات سند حسابداری برای چک پرداختنی */}
      {formData.type === "payable" &&
        formData.amount &&
        ((accountType === "subAccount" && formData.payeeAccountId) ||
          (accountType === "detailAccount" &&
            formData.payeeDetailAccountId)) && (
          <Card className="mb-4 border-warning">
            <Card.Header className="bg-warning text-dark">
              <h6 className="mb-0">📝 سند حسابداری خودکار (پرداختنی)</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="border rounded p-3 bg-light">
                    <strong>بدهکار:</strong>
                    <div className="mt-2">
                      <Badge bg="success" className="me-2">
                        3-01-0001
                      </Badge>
                      <span>چک‌های پرداختنی</span>
                    </div>
                    <div className="mt-2 text-success fw-bold">
                      مبلغ:{" "}
                      {parseFloat(formData.amount || 0).toLocaleString("fa-IR")}{" "}
                      ریال
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 bg-light">
                    <strong>بستانکار:</strong>
                    <div className="mt-2">
                      <Badge bg="info" className="me-2">
                        {getAccountCode(getSelectedPayeeAccount())}
                      </Badge>
                      <span>
                        {getAccountName(getSelectedPayeeAccount())}
                        {accountType === "detailAccount" && " (حساب تفصیلی)"}
                        {accountType === "subAccount" && " (حساب معین)"}
                      </span>
                      {accountType === "detailAccount" &&
                        getSelectedPayeeAccount()?.person && (
                          <div className="mt-1">
                            <small className="text-muted">
                              شخص: {getSelectedPayeeAccount().person.name}
                            </small>
                          </div>
                        )}
                    </div>
                    <div className="mt-2 text-danger fw-bold">
                      مبلغ:{" "}
                      {parseFloat(formData.amount || 0).toLocaleString("fa-IR")}{" "}
                      ریال
                    </div>
                  </div>
                </Col>
              </Row>
              <div className="mt-3">
                <Alert variant="info" className="mb-0">
                  <small>
                    <strong>توجه:</strong>
                    {accountType === "detailAccount"
                      ? " سند برای حساب تفصیلی صادر خواهد شد و شخص مرتبط به طور خودکار ثبت می‌شود."
                      : " سند برای حساب معین صادر خواهد شد."}
                  </small>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        )}
      {/* دکمه‌های اقدام */}
      <div className="d-flex gap-2 justify-content-end">
        <Button
          type="button"
          variant="outline-secondary"
          onClick={handleCancel}
          disabled={loading}
        >
          انصراف
        </Button>

        <Button type="submit" variant="primary" disabled={loading} size="lg">
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              در حال ثبت...
            </>
          ) : initialData.id ? (
            "💾 ذخیره تغییرات"
          ) : formData.type === "receivable" ? (
            "💳 ثبت چک دریافتنی"
          ) : (
            "💳 ثبت چک پرداختنی"
          )}
        </Button>
      </div>
      {/* راهنما */}
      <Alert variant="info" className="mt-4">
        <strong>راهنما:</strong>
        <ul className="mb-0 mt-2">
          <li>فیلدهای ستاره‌دار (*) اجباری هستند</li>
          <li>چک دریافتنی: چکی که از دیگران دریافت می‌کنید</li>
          <li>چک پرداختنی: چکی که به دیگران می‌دهید</li>
          <li>حساب تفصیلی: برای ثبت دقیق‌تر و ارتباط با اشخاص</li>
          <li>حساب معین: برای ثبت کلی‌تر تراکنش‌ها</li>
        </ul>
      </Alert>
    </Form>
  );
}
