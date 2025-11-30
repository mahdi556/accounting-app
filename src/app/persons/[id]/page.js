// src/app/persons/[id]/page.js
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Card,
  Table,
  Button,
  Row,
  Col,
  Badge,
  Alert,
  Spinner,
  Modal,
  Form,
} from "react-bootstrap";

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log("Params ID:", params.id); // دیباگ
    if (params.id) {
      fetchPerson();
    }
  }, [params.id]);

  const fetchPerson = async () => {
    try {
      console.log("Fetching person from API..."); // دیباگ
      const response = await fetch(`/api/persons/${params.id}`);
      console.log("Response status:", response.status); // دیباگ

      if (response.ok) {
        const data = await response.json();
        console.log("Received person data:", data); // دیباگ
        setPerson(data);
        setFormData({
          name: data.name,
          type: data.type,
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
        });
        setError("");
      } else {
        const errorData = await response.json();
        console.log("API error:", errorData); // دیباگ
        setError(errorData.error || "شخص یافت نشد");
      }
    } catch (error) {
      console.error("Error fetching person:", error);
      setError("خطا در دریافت اطلاعات شخص");
    } finally {
      setLoading(false);
    }
  };

  // بقیه توابع بدون تغییر...
  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData({
      name: person.name,
      type: person.type,
      phone: person.phone || "",
      email: person.email || "",
      address: person.address || "",
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("نام شخص الزامی است");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/persons/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedPerson = await response.json();
        setPerson(updatedPerson);
        setEditMode(false);
        alert("اطلاعات شخص با موفقیت به‌روزرسانی شد");
        fetchPerson(); // رفرش داده‌ها
      } else {
        const error = await response.json();
        alert(`خطا: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating person:", error);
      alert("خطا در به‌روزرسانی اطلاعات");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/persons/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("شخص با موفقیت حذف شد");
        router.push("/persons");
      } else {
        const error = await response.json();
        alert(`خطا: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting person:", error);
      alert("خطا در حذف شخص");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getTypeLabel = (type) => {
    const labels = {
      customer: "مشتری",
      supplier: "تأمین کننده",
      employee: "پرسنل",
    };
    return labels[type] || type;
  };

  const getTypeVariant = (type) => {
    const variants = {
      customer: "success",
      supplier: "warning",
      employee: "info",
    };
    return variants[type] || "secondary";
  };

  const calculateFinancialSummary = () => {
    if (!person?.voucherItems)
      return { totalDebit: 0, totalCredit: 0, balance: 0 };

    const totalDebit = person.voucherItems.reduce(
      (sum, item) => sum + (item.debit || 0),
      0
    );
    const totalCredit = person.voucherItems.reduce(
      (sum, item) => sum + (item.credit || 0),
      0
    );
    const balance = totalDebit - totalCredit;

    return { totalDebit, totalCredit, balance };
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">در حال بارگذاری اطلاعات شخص...</p>
          <p className="text-muted">ID: {params.id}</p>
        </div>
      </Container>
    );
  }

  if (error || !person) {
    return (
      <Container>
        <Alert variant="danger">
          <h5>خطا در دریافت اطلاعات</h5>
          <p>{error || "شخص یافت نشد"}</p>
          <p className="text-muted">شناسه درخواستی: {params.id}</p>
          <div className="d-flex gap-2">
            <Button
              variant="outline-danger"
              onClick={() => router.push("/persons")}
            >
              بازگشت به لیست اشخاص
            </Button>
            <Button variant="outline-primary" onClick={fetchPerson}>
              تلاش مجدد
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const { totalDebit, totalCredit, balance } = calculateFinancialSummary();

  return (
    <Container>
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">جزئیات شخص</h1>
          <p className="text-muted mb-0">کد: {person.id}</p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            onClick={() => router.push("/persons")}
          >
            بازگشت به لیست
          </Button>
          {!editMode && (
            <>
              <Button variant="outline-primary" onClick={handleEdit}>
                ✏️ ویرایش
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                🗑️ حذف
              </Button>
            </>
          )}
        </div>
      </div>

      {/* بقیه کد بدون تغییر */}
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">اطلاعات حسابداری</h5>
            </Card.Header>
            <Card.Body>
              {person.detailAccount ? (
                <Table borderless>
                  <tbody>
                    <tr>
                      <td width="160" className="fw-bold text-muted">
                        کد حساب تفصیلی:
                      </td>
                      <td className="fw-bold">
                        <Badge bg="primary" className="fs-6">
                          {person.detailAccount.code}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold text-muted">نام حساب تفصیلی:</td>
                      <td>{person.detailAccount.name}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold text-muted">حساب معین:</td>
                      <td>
                        {person.detailAccount.subAccount?.code} -{" "}
                        {person.detailAccount.subAccount?.name}
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold text-muted">حساب کل:</td>
                      <td>
                        {person.detailAccount.subAccount?.category?.code} -{" "}
                        {person.detailAccount.subAccount?.category?.name}
                        <Badge bg="secondary" className="me-2">
                          {person.detailAccount.subAccount?.category?.type ===
                          "asset"
                            ? "دارایی"
                            : person.detailAccount.subAccount?.category
                                ?.type === "liability"
                            ? "بدهی"
                            : person.detailAccount.subAccount?.category
                                ?.type === "equity"
                            ? "سرمایه"
                            : person.detailAccount.subAccount?.category
                                ?.type === "income"
                            ? "درآمد"
                            : "هزینه"}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold text-muted">مانده حساب:</td>
                      <td>
                        <span
                          className={
                            person.detailAccount.balance >= 0
                              ? "text-success"
                              : "text-danger"
                          }
                        >
                          {Math.abs(
                            person.detailAccount.balance
                          ).toLocaleString("fa-IR")}{" "}
                          ریال
                          <Badge
                            bg={
                              person.detailAccount.balance >= 0
                                ? "success"
                                : "danger"
                            }
                            className="me-2"
                          >
                            {person.detailAccount.balance >= 0
                              ? "بدهکار"
                              : "بستانکار"}
                          </Badge>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              ) : (
                <Alert variant="warning">
                  <strong>توجه:</strong> این شخص به حساب تفصیلی متصل نیست.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">خلاصه مالی</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="mb-4">
                  <h6 className="text-muted mb-2">مانده حساب</h6>
                  <h2 className={balance >= 0 ? "text-success" : "text-danger"}>
                    {Math.abs(balance).toLocaleString("fa-IR")} ریال
                  </h2>
                  <Badge bg={balance >= 0 ? "success" : "danger"}>
                    {balance >= 0 ? "بدهکار" : "بستانکار"}
                  </Badge>
                </div>

                <Row>
                  <Col md={6}>
                    <div className="border rounded p-3 mb-3">
                      <h6 className="text-success mb-1">جمع بدهکار</h6>
                      <h5 className="text-success mb-0">
                        {totalDebit.toLocaleString("fa-IR")}
                      </h5>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="border rounded p-3 mb-3">
                      <h6 className="text-danger mb-1">جمع بستانکار</h6>
                      <h5 className="text-danger mb-0">
                        {totalCredit.toLocaleString("fa-IR")}
                      </h5>
                    </div>
                  </Col>
                </Row>

                <div className="border rounded p-3">
                  <h6 className="text-muted mb-1">تعداد تراکنش‌ها</h6>
                  <h5 className="text-primary mb-0">
                    {person.voucherItems?.length || 0}
                  </h5>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* مودال حذف */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>حذف شخص</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <h6>⚠️ هشدار</h6>
            <p className="mb-0">
              آیا از حذف <strong>"{person.name}"</strong> اطمینان دارید؟
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            انصراف
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            حذف شخص
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
