// src/app/inventory/documents/production-output/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductionOutputPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [productionOrders, setProductionOrders] = useState([]);

  const [formData, setFormData] = useState({
    productionOrderId: "",
    warehouseId: "",
    productId: "",
    quantity: 1,
    unitPrice: 0,
    description: "",
    calculateCost: true, // محاسبه خودکار بهای تمام شده
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
    fetchRecentProductionOrders();
  }, []);

  // وقتی محصول انتخاب شد، قیمت پیش فرض را تنظیم کن
  useEffect(() => {
    if (formData.productId) {
      const selectedProduct = products.find(
        (p) => p.id === parseInt(formData.productId)
      );
      if (selectedProduct) {
        // اگر قیمت خرید پیش فرض دارد، از آن استفاده کن
        if (selectedProduct.defaultPurchasePrice > 0) {
          setFormData((prev) => ({
            ...prev,
            unitPrice: selectedProduct.defaultPurchasePrice,
          }));
        }
      }
    }
  }, [formData.productId, products]);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/inventory/warehouses");
      if (response.ok) {
        const data = await response.json();

        // API ساختار { warehouses: [...] } برمی‌گرداند
        console.log("Warehouses API data structure:", data);

        if (data.warehouses && Array.isArray(data.warehouses)) {
          setWarehouses(data.warehouses);
          console.log(`✅ ${data.warehouses.length} انبار بارگذاری شد`);

          // لاگ برای دیباگ
          data.warehouses.forEach((wh, index) => {
            console.log(
              `   ${index + 1}. ${wh.code} - ${wh.name} (ID: ${wh.id})`
            );
          });
        } else {
          console.error("Invalid warehouses data structure:", data);
          setWarehouses([]);
        }
      } else {
        console.error("Failed to fetch warehouses:", response.status);
        setWarehouses([]);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      setWarehouses([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/inventory/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchRecentProductionOrders = async () => {
    try {
      // API برای دریافت آخرین دستورات تولید
      const response = await fetch(
        "/api/inventory/documents?type=PROD-CONSUME&limit=10"
      );
      if (response.ok) {
        const data = await response.json();
        setProductionOrders(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching production orders:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.productId ||
      !formData.warehouseId ||
      !formData.quantity ||
      formData.quantity <= 0
    ) {
      alert("لطفا اطلاعات ضروری را تکمیل کنید");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        productionOrderId: formData.productionOrderId || `PO-${Date.now()}`,
        warehouseId: parseInt(formData.warehouseId),
        productId: parseInt(formData.productId),
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        description: formData.description,
        createVoucher: true,
      };

      console.log("Sending production output payload:", payload);

      const response = await fetch(
        "/api/inventory/documents/production-output",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        alert("سند تولید محصول با موفقیت ثبت شد");
        router.push("/inventory/documents");
      } else {
        console.error("API Error:", result);
        alert(result.error || "خطا در ثبت تولید محصول");
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("خطا در ارتباط با سرور");
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
  };

  const calculateTotalCost = () => {
    return (
      (parseFloat(formData.quantity) || 0) *
      (parseFloat(formData.unitPrice) || 0)
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">🎯 ثبت محصول نهایی تولید</h1>
          <p className="text-muted mb-0">
            ثبت خروج محصول تولید شده از خط تولید به انبار
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="btn btn-outline-secondary"
        >
          بازگشت
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* کارت اطلاعات پایه */}
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">📝 اطلاعات تولید</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">شماره دستور تولید</label>
                    <input
                      type="text"
                      className="form-control"
                      name="productionOrderId"
                      value={formData.productionOrderId}
                      onChange={handleChange}
                      placeholder="مثال: PO-1402-001"
                    />
                    <div className="form-text">یا از لیست زیر انتخاب کنید</div>

                    {productionOrders.length > 0 && (
                      <div className="mt-2">
                        <label className="form-label small">
                          دستورات تولید اخیر:
                        </label>
                        <select
                          className="form-select form-select-sm"
                          onChange={(e) => {
                            if (e.target.value) {
                              setFormData((prev) => ({
                                ...prev,
                                productionOrderId: e.target.value,
                              }));
                            }
                          }}
                        >
                          <option value="">انتخاب از لیست</option>
                          {productionOrders.map((order) => (
                            <option
                              key={order.id}
                              value={
                                order.referenceNumber || order.documentNumber
                              }
                            >
                              {order.documentNumber} -{" "}
                              {order.description?.substring(0, 50)}...
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      انبار مقصد <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="warehouseId"
                      value={formData.warehouseId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">انتخاب انبار</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name} ({wh.code}) - {wh.type || "انبار محصولات"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      محصول نهایی <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="productId"
                      value={formData.productId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">انتخاب محصول</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name}
                          {product.unit && ` (${product.unit.name})`}
                        </option>
                      ))}
                    </select>
                    {formData.productId && (
                      <div className="mt-2">
                        <small className="text-muted">
                          محصول انتخاب شده:{" "}
                          {
                            products.find(
                              (p) => p.id === parseInt(formData.productId)
                            )?.name
                          }
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">
                      تعداد <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="0.001"
                      step="0.001"
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">
                      قیمت واحد (ریال) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="unitPrice"
                      value={formData.unitPrice}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      required
                    />
                    <div className="form-text">بهای تمام شده هر واحد</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">توضیحات</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="توضیحات مربوط به تولید، مشخصات فنی، کنترل کیفیت و..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* کارت خلاصه و محاسبات */}
          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">💰 خلاصه مالی</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>تعداد:</span>
                    <span className="fw-bold">{formData.quantity}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>قیمت واحد:</span>
                    <span className="fw-bold">
                      {parseFloat(formData.unitPrice).toLocaleString("fa-IR")}{" "}
                      ریال
                    </span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span className="fs-5">مبلغ کل:</span>
                    <span className="fs-4 fw-bold text-primary">
                      {calculateTotalCost().toLocaleString("fa-IR")} ریال
                    </span>
                  </div>
                </div>

                <div className="alert alert-info">
                  <h6 className="alert-heading">💡 نکته:</h6>
                  <p className="mb-0 small">
                    این سند باعث <strong>افزایش موجودی</strong> محصول نهایی در
                    انبار مقصد می‌شود. سند حسابداری مربوطه نیز به طور خودکار
                    ایجاد می‌شود.
                  </p>
                </div>
              </div>
            </div>

            {/* کارت عملیات سریع */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">⚡ عملیات سریع</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // محاسبه خودکار میانگین هزینه مواد مصرفی
                      alert("این قابلیت به زودی اضافه می‌شود");
                    }}
                    className="btn btn-outline-info"
                    disabled={loading}
                  >
                    🔢 محاسبه خودکار بهای تمام شده
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/inventory/documents/production-consumption")
                    }
                    className="btn btn-outline-warning"
                  >
                    📝 ثبت مصرف مواد اولیه
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (formData.productId) {
                        router.push(
                          `/inventory/products/${formData.productId}`
                        );
                      } else {
                        alert("لطفا ابتدا یک محصول انتخاب کنید");
                      }
                    }}
                    className="btn btn-outline-secondary"
                  >
                    📦 مشاهده اطلاعات محصول
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* دکمه‌های ثبت */}
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-outline-secondary"
                disabled={loading}
              >
                انصراف
              </button>
            </div>

            <div className="d-flex gap-3">
              <button
                type="button"
                onClick={() => {
                  // ذخیره پیش‌نویس
                  const draft = {
                    ...formData,
                    savedAt: new Date().toISOString(),
                  };
                  localStorage.setItem(
                    "productionOutputDraft",
                    JSON.stringify(draft)
                  );
                  alert("پیش‌نویس ذخیره شد");
                }}
                className="btn btn-outline-primary"
                disabled={loading}
              >
                💾 ذخیره پیش‌نویس
              </button>

              <button
                type="submit"
                className="btn btn-success btn-lg"
                disabled={
                  loading ||
                  !formData.productId ||
                  !formData.warehouseId ||
                  !formData.quantity
                }
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    در حال ثبت...
                  </>
                ) : (
                  <>✅ ثبت محصول نهایی</>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
