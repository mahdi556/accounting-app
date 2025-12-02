// src/components/forms/VoucherForm.jsx
"use client";
import PersianDatePicker from "@components/ui/PersianDatePicker";
import { PersianDate } from "@lib/persianDate";
import {
  formatNumber,
  parseInputToNumber,
} from "@lib/format";
import { useState, useEffect, useRef } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Table,
  Alert,
  InputGroup,
  Modal,
} from "react-bootstrap";
import Portal from "../Portal";
import useDropdownPosition from "@/hooks/useDropdownPosition";
import PrintVoucher from "./PrintVoucher";

// --- تابع کمکی برای تبدیل اعداد فارسی/عربی به انگلیسی ---
const toEnglishDigits = (str) => {
  if (!str) return "";
  return str.toString()
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
};

export default function VoucherForm() {
  const [allAccounts, setAllAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [voucherDate, setVoucherDate] = useState(PersianDate.todayGregorian());
  const [voucher, setVoucher] = useState({
    description: "",
    items: [
      { accountId: "", accountType: "", description: "", debit: 0, credit: 0 },
    ],
  });

  // استیت برای نمایش مقادیر (با جداکننده و فونت فارسی)
  const [displayValues, setDisplayValues] = useState([
    { debit: "", credit: "" },
  ]);

  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [inputValues, setInputValues] = useState([""]);

  const searchRefs = useRef([]);
  const { dropdownPos, updateDropdownPosition } = useDropdownPosition();

  useEffect(() => {
    fetchAllAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [searchTerm, allAccounts]);

  // --- اصلاح useEffect برای جلوگیری از ری‌رندر اضافی هنگام تایپ ---
  useEffect(() => {
    // تنظیم رفرنس‌ها
    searchRefs.current = searchRefs.current.slice(0, voucher.items.length);

    // تنظیم طول آرایه اینپوت‌های جستجو
    setInputValues((prev) => {
      const newValues = [...prev];
      while (newValues.length < voucher.items.length) newValues.push("");
      while (newValues.length > voucher.items.length) newValues.pop();
      return newValues;
    });

    // تنظیم طول آرایه مقادیر نمایشی (بدون دستکاری مقادیر داخلی هنگام تایپ)
    setDisplayValues((prev) => {
      // اگر طول آرایه درست است، تغییری نده (جلوگیری از پرش هنگام تایپ)
      if (prev.length === voucher.items.length) return prev;

      const newDisplayValues = [...prev];
      // اضافه کردن آیتم جدید
      while (newDisplayValues.length < voucher.items.length) {
        newDisplayValues.push({ debit: "", credit: "" });
      }
      // حذف آیتم اضافی
      while (newDisplayValues.length > voucher.items.length) {
        newDisplayValues.pop();
      }
      return newDisplayValues;
    });
    
    // فقط وقتی تعداد آیتم‌ها کم و زیاد می‌شود اجرا شود
  }, [voucher.items.length]);

  const handlePrint = (voucherData) => {
    setPrintData(voucherData);
    setShowPrint(true);
  };

  const fetchAllAccounts = async () => {
    try {
      const [categoriesResponse, subAccountsResponse, detailAccountsResponse] =
        await Promise.all([
          fetch("/api/categories"),
          fetch("/api/accounts"),
          fetch("/api/detail-accounts"),
        ]);

      if (!categoriesResponse.ok || !subAccountsResponse.ok || !detailAccountsResponse.ok) {
        throw new Error("خطا در دریافت اطلاعات حساب‌ها");
      }

      const [categoriesData, subAccountsData, detailAccountsData] =
        await Promise.all([
          categoriesResponse.json(),
          subAccountsResponse.json(),
          detailAccountsResponse.json(),
        ]);

      const categories = Array.isArray(categoriesData)
        ? categoriesData.map((cat) => ({
            id: cat.id,
            code: cat.code,
            name: cat.name,
            type: "category",
            fullName: `${cat.code} - ${cat.name} (کل)`,
            categoryType: cat.type,
          }))
        : [];

      const subAccounts = Array.isArray(subAccountsData)
        ? subAccountsData.map((acc) => ({
            id: acc.id,
            code: acc.code,
            name: acc.name,
            type: "subAccount",
            fullName: `${acc.code} - ${acc.name} (معین)`,
            category: acc.category,
            categoryType: acc.category?.type,
          }))
        : [];

      const detailAccounts = Array.isArray(detailAccountsData)
        ? detailAccountsData.map((acc) => ({
            id: acc.id,
            code: acc.code,
            name: acc.name,
            type: "detailAccount",
            fullName: `${acc.code} - ${acc.name} (تفصیلی)`,
            subAccount: acc.subAccount,
            category: acc.subAccount?.category,
            categoryType: acc.subAccount?.category?.type,
          }))
        : [];

      const combined = [...categories, ...subAccounts, ...detailAccounts];
      setAllAccounts(combined);
      setFilteredAccounts(combined.slice(0, 10));
    } catch (error) {
      console.error("❌ خطا در دریافت حساب‌ها:", error);
      setAllAccounts([]);
      setFilteredAccounts([]);
    }
  };

  const filterAccounts = () => {
    if (!searchTerm.trim()) {
      setFilteredAccounts(allAccounts.slice(0, 10));
      return;
    }
    const filtered = allAccounts
      .filter(
        (acc) =>
          acc.code.includes(searchTerm) ||
          acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          acc.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10);
    setFilteredAccounts(filtered);
  };

  const handleAccountSelect = (index, account) => {
    updateItem(index, "accountId", account.id);
    updateItem(index, "accountType", account.type);

    setInputValues((prev) => {
      const newValues = [...prev];
      newValues[index] = account.fullName;
      return newValues;
    });

    setSearchTerm("");
    setShowSuggestions(false);
    setActiveSearchIndex(null);
    setHighlightIndex(-1);
  };

  const addItem = () => {
    setVoucher((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { accountId: "", accountType: "", description: "", debit: 0, credit: 0 },
      ],
    }));
  };

  const removeItem = (index) => {
    const newItems = voucher.items.filter((_, i) => i !== index);
    setVoucher((prev) => ({ ...prev, items: newItems }));
    
    // آرایه‌های دیگر توسط useEffect به‌روز می‌شوند
    // اما برای جلوگیری از باگ لحظه‌ای می‌توان دستی هم ست کرد، ولی useEffect کافیست.
  };

  const updateItem = (index, field, value) => {
    setVoucher((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  // --- اصلاح تابع هندلر تغییر مبلغ (مهمترین بخش) ---
  const handleAmountChange = (index, field, value) => {
    // 1. تبدیل ارقام فارسی به انگلیسی
    const englishValue = toEnglishDigits(value);
    
    // 2. حذف هر چیزی غیر از عدد
    const numbersOnly = englishValue.replace(/[^\d]/g, "");

    // 3. فرمت کردن برای نمایش (جداکننده هزارگان)
    let formattedValue = "";
    if (numbersOnly) {
      const num = parseInt(numbersOnly, 10);
      if (!isNaN(num)) {
        formattedValue = new Intl.NumberFormat("fa-IR").format(num);
      }
    }

    // 4. به‌روزرسانی مقدار نمایشی
    setDisplayValues((prev) => {
      const updated = [...prev];
      // فیلد جاری را آپدیت کن
      updated[index] = { ...updated[index], [field]: formattedValue };
      
      // اگر بدهکار وارد شد، بستانکار را پاک کن (نمایشی)
      if (field === 'debit' && numbersOnly) {
         updated[index].credit = "";
      }
      // اگر بستانکار وارد شد، بدهکار را پاک کن (نمایشی)
      if (field === 'credit' && numbersOnly) {
         updated[index].debit = "";
      }
      
      return updated;
    });

    // 5. ذخیره عدد خالص در استیت اصلی
    const numericValue = numbersOnly ? parseInt(numbersOnly, 10) : 0;
    
    // آپدیت مقدار در مدل اصلی
    setVoucher((prev) => {
        const newItems = [...prev.items];
        newItems[index] = { ...newItems[index], [field]: numericValue };
        
        // اگر بدهکار مقدار گرفت، بستانکار صفر شود و برعکس
        if (field === "debit" && numericValue > 0) {
            newItems[index].credit = 0;
        }
        if (field === "credit" && numericValue > 0) {
            newItems[index].debit = 0;
        }
        return { ...prev, items: newItems };
    });
  };

  // --- اضافه کردن تابع onBlur برای اطمینان از فرمت صحیح ---
  const handleAmountBlur = (index, field) => {
     // اینجا می‌توان کارهای اضافه انجام داد، فعلاً فقط مطمئن می‌شویم مقدار نمایشی درست است
     const numericValue = voucher.items[index][field];
     if (numericValue) {
        const formatted = new Intl.NumberFormat("fa-IR").format(numericValue);
        setDisplayValues(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: formatted };
            return updated;
        });
     }
  };

  const handleInputChange = (index, value) => {
    setInputValues((prev) => {
      const newValues = [...prev];
      newValues[index] = value;
      return newValues;
    });

    if (voucher.items[index].accountId) {
      updateItem(index, "accountId", "");
      updateItem(index, "accountType", "");
    }

    setSearchTerm(value);
    setHighlightIndex(-1);
    setActiveSearchIndex(index);
    setShowSuggestions(true);

    if (searchRefs.current[index]) {
      updateDropdownPosition(searchRefs.current[index]);
    }
  };

  const clearAccountSelection = (index) => {
    updateItem(index, "accountId", "");
    updateItem(index, "accountType", "");
    setInputValues((prev) => {
      const newValues = [...prev];
      newValues[index] = "";
      return newValues;
    });
    setSearchTerm("");
    setShowSuggestions(false);
  };

  const calculateBalance = () => {
    const debit = voucher.items.reduce((sum, item) => sum + parseFloat(item.debit || 0), 0);
    const credit = voucher.items.reduce((sum, item) => sum + parseFloat(item.credit || 0), 0);
    return debit - credit;
  };

  const resetForm = () => {
    setVoucher({
      description: "",
      items: [
        { accountId: "", accountType: "", description: "", debit: 0, credit: 0 },
      ],
    });
    setVoucherDate(PersianDate.todayGregorian());
    setInputValues([""]);
    setDisplayValues([{ debit: "", credit: "" }]);
    setSearchTerm("");
    setShowSuggestions(false);
    setActiveSearchIndex(null);
    setHighlightIndex(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const balance = calculateBalance();

    if (Math.abs(balance) > 0.01) {
      alert("سند تراز نیست");
      return;
    }

    const hasEmpty = voucher.items.some((i) => !i.accountId);
    if (hasEmpty) return alert("لطفاً حساب را انتخاب کنید");

    setLoading(true);
    try {
      const itemsData = voucher.items.map((item) => {
        const itemData = {
          description: item.description,
          debit: parseFloat(item.debit || 0),
          credit: parseFloat(item.credit || 0),
        };

        if (item.accountType === "subAccount") {
          itemData.subAccountId = parseInt(item.accountId);
          itemData.detailAccountId = null;
        } else if (item.accountType === "detailAccount") {
          itemData.detailAccountId = parseInt(item.accountId);
          const selectedDetailAccount = allAccounts.find(
            (acc) => acc.type === "detailAccount" && acc.id === parseInt(item.accountId)
          );
          if (selectedDetailAccount?.subAccount?.id) {
            itemData.subAccountId = parseInt(selectedDetailAccount.subAccount.id);
          } else {
            throw new Error(`حساب تفصیلی معتبر نیست.`);
          }
        } else if (item.accountType === "category") {
          throw new Error("استفاده از حساب کل در اسناد مجاز نیست.");
        }
        return itemData;
      });

      const submitData = {
        voucherDate: voucherDate.toISOString(),
        description: voucher.description,
        items: itemsData,
      };

      const response = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "خطا در ثبت سند");
      }

      const data = await response.json();
      alert(`✅ سند ${data.voucherNumber} با موفقیت ثبت شد`);
      handlePrint(data);
      resetForm();
    } catch (error) {
      console.error("❌ خطا در ثبت سند:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeLabel = (type) => {
    const labels = { category: "کل", subAccount: "معین", detailAccount: "تفصیلی" };
    return labels[type] || type;
  };

  const getCategoryTypeLabel = (type) => {
    const labels = { asset: "دارایی", liability: "بدهی", equity: "سرمایه", income: "درآمد", expense: "هزینه" };
    return labels[type] || type;
  };

  const balance = calculateBalance();
  const isBalanced = Math.abs(balance) < 0.01;

  return (
    <>
      <Form onSubmit={handleSubmit} className="rtl">
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>تاریخ سند *</Form.Label>
              <PersianDatePicker
                selected={voucherDate}
                onChange={setVoucherDate}
                placeholder="تاریخ سند"
                maxDate={new Date()}
                required
              />
              <Form.Text className="text-muted">
                تاریخ انتخاب شده: {PersianDate.toPersian(voucherDate)}
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>شرح سند</Form.Label>
              <Form.Control
                type="text"
                value={voucher.description}
                onChange={(e) => setVoucher((prev) => ({ ...prev, description: e.target.value }))}
                required
                placeholder="شرح مختصر سند"
              />
            </Form.Group>
          </Col>
        </Row>

        <Table bordered hover>
          <thead className="table-dark">
            <tr>
              <th width="35%">حساب</th>
              <th>شرح</th>
              <th>بدهکار</th>
              <th>بستانکار</th>
              <th>حذف</th>
            </tr>
          </thead>
          <tbody>
            {voucher.items.map((item, index) => (
              <tr key={index}>
                <td>
                  <div
                    ref={(el) => (searchRefs.current[index] = el)}
                    className="position-relative"
                  >
                    <InputGroup>
                      <Form.Control
                        type="text"
                        value={inputValues[index]}
                        placeholder="جستجوی حساب..."
                        onFocus={() => {
                          setActiveSearchIndex(index);
                          setShowSuggestions(true);
                          if (searchRefs.current[index]) updateDropdownPosition(searchRefs.current[index]);
                        }}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => {
                           if (!showSuggestions) return;
                           if (e.key === "ArrowDown") {
                             e.preventDefault();
                             setHighlightIndex((prev) => (prev < filteredAccounts.length - 1 ? prev + 1 : 0));
                           }
                           if (e.key === "ArrowUp") {
                             e.preventDefault();
                             setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredAccounts.length - 1));
                           }
                           if (e.key === "Enter") {
                             e.preventDefault();
                             if (highlightIndex >= 0 && filteredAccounts[highlightIndex]) {
                               handleAccountSelect(index, filteredAccounts[highlightIndex]);
                             }
                           }
                           if (e.key === "Escape") setShowSuggestions(false);
                        }}
                        required
                      />
                      {item.accountId && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => clearAccountSelection(index)}
                        >
                          ❌
                        </Button>
                      )}
                    </InputGroup>
                  </div>

                  {showSuggestions && activeSearchIndex === index && (
                    <Portal>
                      <div
                        className="autocomplete-dropdown open"
                        style={{
                          position: "absolute",
                          top: dropdownPos.top,
                          left: dropdownPos.left,
                          width: dropdownPos.width,
                          background: "white",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          zIndex: 999999,
                          maxHeight: "250px",
                          overflowY: "auto",
                        }}
                      >
                        {filteredAccounts.length > 0 ? (
                          filteredAccounts.map((acc, idx) => (
                            <div
                              key={`${acc.type}-${acc.id}`}
                              className={`autocomplete-item p-2 ${idx === highlightIndex ? "active bg-light" : ""}`}
                              style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                              onMouseEnter={() => setHighlightIndex(idx)}
                              onMouseLeave={() => setHighlightIndex(-1)}
                              onClick={() => handleAccountSelect(index, acc)}
                            >
                              <div className="fw-bold" style={{ fontSize: "14px" }}>
                                {acc.fullName}
                              </div>
                              <small className="text-muted" style={{ fontSize: "12px" }}>
                                {getAccountTypeLabel(acc.type)} -{" "}
                                {acc.categoryType && getCategoryTypeLabel(acc.categoryType)}
                              </small>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-center text-muted">
                            {allAccounts.length === 0 ? "در حال بارگذاری..." : "هیچ حسابی یافت نشد"}
                          </div>
                        )}
                      </div>
                    </Portal>
                  )}
                </td>

                <td>
                  <Form.Control
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="شرح ردیف"
                  />
                </td>
                
                {/* ستون بدهکار */}
                <td>
                  <Form.Control
                    type="text"
                    value={displayValues[index]?.debit || ""}
                    onChange={(e) => handleAmountChange(index, "debit", e.target.value)}
                    onBlur={() => handleAmountBlur(index, "debit")}
                    placeholder="0"
                    className="text-left"
                    dir="ltr"
                    inputMode="numeric"
                  />
                </td>

                {/* ستون بستانکار */}
                <td>
                  <Form.Control
                    type="text"
                    value={displayValues[index]?.credit || ""}
                    onChange={(e) => handleAmountChange(index, "credit", e.target.value)}
                    onBlur={() => handleAmountBlur(index, "credit")}
                    placeholder="0"
                    className="text-left"
                    dir="ltr"
                    inputMode="numeric"
                  />
                </td>

                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={voucher.items.length <= 1}
                  >
                    حذف
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <div className="mb-3">
          <Button variant="outline-secondary" onClick={addItem}>
            ➕ افزودن ردیف
          </Button>
        </div>

        <div className="mb-3">
          <Alert variant={isBalanced ? "success" : "danger"}>
            {isBalanced
              ? "✅ سند تراز است"
              : `❌ سند تراز نیست — اختلاف: ${formatNumber(balance, true)}`}
          </Alert>
        </div>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" disabled={!isBalanced || loading} size="lg">
            {loading ? "در حال ثبت..." : "📝 ثبت سند"}
          </Button>
          <Button type="button" variant="outline-secondary" onClick={resetForm}>
            پاک کردن فرم
          </Button>
          <Button type="button" variant="outline-info" onClick={fetchAllAccounts} size="sm">
            🔄 بروزرسانی لیست حساب‌ها
          </Button>
        </div>
      </Form>

      <Modal show={showPrint} onHide={() => setShowPrint(false)} size="xl" fullscreen="md-down">
        <Modal.Header closeButton>
          <Modal.Title>پرینت سند {printData?.voucherNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <PrintVoucher voucher={printData} onClose={() => setShowPrint(false)} />
        </Modal.Body>
      </Modal>
    </>
  );
}