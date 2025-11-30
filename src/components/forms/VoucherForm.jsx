// src/components/forms/VoucherForm.jsx
"use client";
import PersianDatePicker from "@components/ui/PersianDatePicker";
import { PersianDate } from "@lib/persianDate";
import { useState, useEffect, useRef } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Table,
  Alert,
  InputGroup,
} from "react-bootstrap";
import Portal from "../Portal";
import useDropdownPosition from "@/hooks/useDropdownPosition";

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

  useEffect(() => {
    searchRefs.current = searchRefs.current.slice(0, voucher.items.length);
    setInputValues((prev) => {
      const newValues = [...prev];
      while (newValues.length < voucher.items.length) {
        newValues.push("");
      }
      while (newValues.length > voucher.items.length) {
        newValues.pop();
      }
      return newValues;
    });
  }, [voucher.items]);

  // دریافت همه حساب‌ها
  // در VoucherForm.jsx، تابع fetchAllAccounts را اینطور به‌روزرسانی کنید:
  const fetchAllAccounts = async () => {
    try {
      console.log("📡 شروع دریافت همه حساب‌ها...");

      const [categoriesResponse, subAccountsResponse, detailAccountsResponse] =
        await Promise.all([
          fetch("/api/categories"),
          fetch("/api/accounts"),
          fetch("/api/detail-accounts"), // حالا idها هم شامل می‌شوند
        ]);

      if (
        !categoriesResponse.ok ||
        !subAccountsResponse.ok ||
        !detailAccountsResponse.ok
      ) {
        throw new Error("خطا در دریافت اطلاعات حساب‌ها");
      }

      const [categoriesData, subAccountsData, detailAccountsData] =
        await Promise.all([
          categoriesResponse.json(),
          subAccountsResponse.json(),
          detailAccountsResponse.json(),
        ]);

      // تبدیل حساب‌های کل
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

      // تبدیل حساب‌های معین
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

      // تبدیل حساب‌های تفصیلی - حالا با id کامل
      const detailAccounts = Array.isArray(detailAccountsData)
        ? detailAccountsData.map((acc) => {
            console.log("🔍 حساب تفصیلی:", {
              id: acc.id,
              name: acc.name,
              subAccount: acc.subAccount, // باید شامل id باشد
            });
            return {
              id: acc.id,
              code: acc.code,
              name: acc.name,
              type: "detailAccount",
              fullName: `${acc.code} - ${acc.name} (تفصیلی)`,
              subAccount: acc.subAccount, // حالا شامل id می‌شود
              category: acc.subAccount?.category,
              categoryType: acc.subAccount?.category?.type,
            };
          })
        : [];

      const combined = [...categories, ...subAccounts, ...detailAccounts];
      console.log("🎯 تعداد کل حساب‌ها:", combined.length);
      console.log("📊 حساب‌های تفصیلی:", detailAccounts.length);

      // بررسی اینکه آیا subAccountها شامل id هستند
      const detailAccountsWithSubAccountId = detailAccounts.filter(
        (acc) => acc.subAccount && acc.subAccount.id
      );
      console.log(
        "✅ حساب‌های تفصیلی با subAccountId:",
        detailAccountsWithSubAccountId.length
      );

      setAllAccounts(combined);
      setFilteredAccounts(combined.slice(0, 10));
    } catch (error) {
      console.error("❌ خطا در دریافت حساب‌ها:", error);
      alert(`خطا در بارگذاری حساب‌ها: ${error.message}`);
      setAllAccounts([]);
      setFilteredAccounts([]);
    }
  };

  // فیلتر حساب‌ها
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

  // انتخاب حساب
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

  // اضافه‌کردن ردیف
  const addItem = () => {
    setVoucher((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          accountId: "",
          accountType: "",
          description: "",
          debit: 0,
          credit: 0,
        },
      ],
    }));

    setInputValues((prev) => [...prev, ""]);
  };

  // تغییرات آیتم
  const updateItem = (index, field, value) => {
    setVoucher((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      if (field === "debit" && parseFloat(value) > 0)
        newItems[index].credit = 0;
      if (field === "credit" && parseFloat(value) > 0)
        newItems[index].debit = 0;

      return { ...prev, items: newItems };
    });
  };

  // حذف ردیف
  const removeItem = (index) => {
    if (voucher.items.length > 1) {
      setVoucher((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));

      setInputValues((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // مدیریت تغییر input
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

  // پاک کردن انتخاب حساب
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

  // محاسبه تراز
  const calculateBalance = () => {
    const debit = voucher.items.reduce(
      (sum, item) => sum + parseFloat(item.debit || 0),
      0
    );
    const credit = voucher.items.reduce(
      (sum, item) => sum + parseFloat(item.credit || 0),
      0
    );
    return debit - credit;
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
      // بررسی و ساخت آیتم‌ها
      const itemsData = voucher.items.map((item) => {
        const itemData = {
          description: item.description,
          debit: parseFloat(item.debit || 0),
          credit: parseFloat(item.credit || 0),
        };

        if (item.accountType === "subAccount") {
          itemData.subAccountId = parseInt(item.accountId);
          itemData.detailAccountId = null;
          console.log("🔹 حساب معین:", {
            subAccountId: itemData.subAccountId,
          });
        } else if (item.accountType === "detailAccount") {
          itemData.detailAccountId = parseInt(item.accountId);

          // پیدا کردن حساب تفصیلی از بین حساب‌های بارگذاری شده
          const selectedDetailAccount = allAccounts.find(
            (acc) =>
              acc.type === "detailAccount" &&
              acc.id === parseInt(item.accountId)
          );

          console.log("🔹 حساب تفصیلی پیدا شده:", selectedDetailAccount);

          if (
            selectedDetailAccount &&
            selectedDetailAccount.subAccount &&
            selectedDetailAccount.subAccount.id
          ) {
            itemData.subAccountId = parseInt(
              selectedDetailAccount.subAccount.id
            );
            console.log("✅ subAccountId والد:", itemData.subAccountId);
          } else {
            console.error(
              "❌ subAccount پیدا نشد برای:",
              selectedDetailAccount
            );
            throw new Error(
              `حساب تفصیلی "${selectedDetailAccount?.name}" معتبر نیست. لطفاً صفحه را رفرش کنید.`
            );
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

      console.log(
        "📤 داده‌های نهایی ارسالی:",
        JSON.stringify(submitData, null, 2)
      );

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

      // ریست فرم
      resetForm();
    } catch (error) {
      console.error("❌ خطا در ثبت سند:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // نمایش نوع حساب به فارسی
  const getAccountTypeLabel = (type) => {
    const labels = {
      category: "کل",
      subAccount: "معین",
      detailAccount: "تفصیلی",
    };
    return labels[type] || type;
  };

  // نمایش نوع دسته‌بندی به فارسی
  const getCategoryTypeLabel = (type) => {
    const labels = {
      asset: "دارایی",
      liability: "بدهی",
      equity: "سرمایه",
      income: "درآمد",
      expense: "هزینه",
    };
    return labels[type] || type;
  };

  const balance = calculateBalance();
  const isBalanced = Math.abs(balance) < 0.01;
  console.log("voucherDate:", voucherDate);

  return (
    <Form onSubmit={handleSubmit} className="rtl">
      {/* تاریخ و شرح */}
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
              onChange={(e) =>
                setVoucher((prev) => ({ ...prev, description: e.target.value }))
              }
              required
              placeholder="شرح مختصر سند"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* جدول */}
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
                      placeholder="جستجوی حساب (کل، معین یا تفصیلی)..."
                      onFocus={() => {
                        setActiveSearchIndex(index);
                        setShowSuggestions(true);
                        if (searchRefs.current[index]) {
                          updateDropdownPosition(searchRefs.current[index]);
                        }
                      }}
                      onChange={(e) => {
                        handleInputChange(index, e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (!showSuggestions) return;

                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setHighlightIndex((prev) =>
                            prev < filteredAccounts.length - 1 ? prev + 1 : 0
                          );
                        }

                        if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setHighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : filteredAccounts.length - 1
                          );
                        }

                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            highlightIndex >= 0 &&
                            filteredAccounts[highlightIndex]
                          ) {
                            handleAccountSelect(
                              index,
                              filteredAccounts[highlightIndex]
                            );
                          }
                        }

                        if (e.key === "Escape") {
                          setShowSuggestions(false);
                        }
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

                {/* Dropdown */}
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
                            className={`autocomplete-item p-2 ${
                              idx === highlightIndex ? "active bg-light" : ""
                            }`}
                            style={{
                              borderBottom: "1px solid #f0f0f0",
                              cursor: "pointer",
                            }}
                            onMouseEnter={() => setHighlightIndex(idx)}
                            onMouseLeave={() => setHighlightIndex(-1)}
                            onClick={() => handleAccountSelect(index, acc)}
                          >
                            <div
                              className="fw-bold"
                              style={{ fontSize: "14px" }}
                            >
                              {acc.fullName}
                            </div>
                            <small
                              className="text-muted"
                              style={{ fontSize: "12px" }}
                            >
                              {getAccountTypeLabel(acc.type)} -{" "}
                              {acc.categoryType &&
                                getCategoryTypeLabel(acc.categoryType)}
                              {!acc.categoryType &&
                                acc.categoryType &&
                                "نامشخص"}
                            </small>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-center text-muted">
                          {allAccounts.length === 0
                            ? "در حال بارگذاری حساب‌ها..."
                            : "هیچ حسابی یافت نشد"}
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
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                  placeholder="شرح ردیف"
                />
              </td>

              <td>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.debit}
                  onChange={(e) => updateItem(index, "debit", e.target.value)}
                  placeholder="0"
                />
              </td>

              <td>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.credit}
                  onChange={(e) => updateItem(index, "credit", e.target.value)}
                  placeholder="0"
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

      {/* دکمه اضافه کردن ردیف */}
      <div className="mb-3">
        <Button variant="outline-secondary" onClick={addItem}>
          ➕ افزودن ردیف
        </Button>
      </div>

      {/* وضعیت تراز */}
      <div className="mb-3">
        <Alert variant={isBalanced ? "success" : "danger"}>
          {isBalanced
            ? "✅ سند تراز است"
            : `❌ سند تراز نیست — اختلاف: ${balance.toLocaleString(
                "fa-IR"
              )} ریال`}
        </Alert>
      </div>

      {/* دکمه ثبت */}
      <div className="d-flex gap-2">
        <Button
          type="submit"
          variant="primary"
          disabled={!isBalanced || loading}
          size="lg"
        >
          {loading ? "در حال ثبت..." : "📝 ثبت سند"}
        </Button>

        <Button
          type="button"
          variant="outline-secondary"
          onClick={() => {
            setVoucher({
              voucher_date: PersianDate.toGregorian(PersianDate.today()),
              description: "",
              items: [
                {
                  accountId: "",
                  accountType: "",
                  description: "",
                  debit: 0,
                  credit: 0,
                },
              ],
            });
            setVoucherDate(PersianDate.toGregorian(PersianDate.today()));
            setInputValues([""]);
            setSearchTerm("");
          }}
        >
          پاک کردن فرم
        </Button>
      </div>
    </Form>
  );
}
