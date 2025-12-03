"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/components/forms/ProductForm";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching product with ID:", params.id);

      const response = await fetch(`/api/inventory/products/${params.id}`);
      const data = await response.json();

      console.log("API Response in edit page:", data);

      if (response.ok) {
        setProduct(data);
      } else {
        setError(data.error || `خطا در دریافت محصول (کد: ${response.status})`);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push("/inventory/products");
    router.refresh();
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال بارگذاری اطلاعات محصول...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-danger">
          <h5 className="alert-heading">⚠️ خطا!</h5>
          <p>{error}</p>
          <div className="d-flex gap-2 mt-3">
            <button onClick={fetchProduct} className="btn btn-outline-danger">
              تلاش مجدد
            </button>
            <button
              onClick={() => router.push("/inventory/products")}
              className="btn btn-secondary"
            >
              بازگشت به لیست کالاها
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">ویرایش کالا</h1>
          {product && (
            <div className="text-muted">
              <span className="badge bg-primary me-2">{product.code}</span>
              <span>{product.name}</span>
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <Link
            href={`/inventory/products/${params.id}`}
            className="btn btn-outline-secondary"
          >
            مشاهده
          </Link>
          <Link
            href={`/inventory/products/${params.id}/ledger`}
            className="btn btn-info"
          >
            📒 کاردکس کالا
          </Link>
          <button onClick={handleCancel} className="btn btn-outline-primary">
            بازگشت
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        {product ? (
          <>
            {/* نمایش دیباگ اطلاعات */}

            <ProductForm
              product={product}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </>
        ) : (
          <div className="alert alert-warning">محصولی برای ویرایش یافت نشد</div>
        )}
      </div>
    </div>
  );
}
