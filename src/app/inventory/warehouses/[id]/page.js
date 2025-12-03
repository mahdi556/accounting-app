// src/app/inventory/warehouses/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function WarehouseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stock');

  useEffect(() => {
    if (params.id) {
      fetchWarehouse();
    }
  }, [params.id]);

  const fetchWarehouse = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching warehouse ID:', params.id);
      
      const response = await fetch(`/api/inventory/warehouses/${params.id}`);
      const data = await response.json();
      
      console.log('Warehouse API response:', data);
      
      if (response.ok && data.success) {
        setWarehouse(data.data);
      } else {
        setError(data.error || 'خطا در دریافت اطلاعات انبار');
      }
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '۰ ریال';
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این انبار اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) {
      return;
    }

    try {
      const response = await fetch(`/api/inventory/warehouses/${params.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('انبار با موفقیت حذف شد');
        router.push('/inventory/warehouses');
      } else {
        alert(data.error || 'خطا در حذف انبار');
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      alert('خطا در حذف انبار');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال بارگذاری اطلاعات انبار...</p>
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
            <button onClick={fetchWarehouse} className="btn btn-outline-danger">
              تلاش مجدد
            </button>
            <button onClick={() => router.push('/inventory/warehouses')} className="btn btn-secondary">
              بازگشت به لیست انبارها
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="p-6">
        <div className="alert alert-warning">
          <h5 className="alert-heading">انبار یافت نشد</h5>
          <p>انبار مورد نظر وجود ندارد یا حذف شده است.</p>
          <button onClick={() => router.push('/inventory/warehouses')} className="btn btn-outline-warning">
            بازگشت به لیست انبارها
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">🏭 انبار: {warehouse.name}</h1>
          <div className="text-muted">
            <span className="badge bg-primary me-2">{warehouse.code}</span>
            {warehouse.address && (
              <span className="me-3">
                <i className="bi bi-geo-alt me-1"></i>
                {warehouse.address}
              </span>
            )}
            {warehouse.manager && (
              <span>
                <i className="bi bi-person me-1"></i>
                مسئول: {warehouse.manager}
              </span>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link href={`/inventory/warehouses/${params.id}/edit`} className="btn btn-primary">
            ویرایش
          </Link>
          <Link href={`/inventory/documents/create?warehouseId=${params.id}`} className="btn btn-success">
            ➕ تراکنش جدید
          </Link>
          <button onClick={() => router.back()} className="btn btn-outline-secondary">
            بازگشت
          </button>
        </div>
      </div>

      {/* کارت‌های آمار */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-light">
            <div className="card-body text-center">
              <div className="h6 mb-2">تعداد کالاها</div>
              <div className="h3 text-primary">
                {warehouse.stats?.totalProducts || warehouse.stockItems?.length || 0}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <div className="h6 mb-2">ارزش موجودی</div>
              <div className="h4">
                {formatCurrency(warehouse.stats?.totalStockValue || 0)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body text-center">
              <div className="h6 mb-2">کالاهای کم‌موجود</div>
              <div className="h3">
                {warehouse.stats?.lowStockCount || 0}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-secondary text-white">
            <div className="card-body text-center">
              <div className="h6 mb-2">آخرین به‌روزرسانی</div>
              <div className="h6">
                {new Date(warehouse.updatedAt || warehouse.createdAt).toLocaleDateString('fa-IR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'stock' ? 'active' : ''}`}
                onClick={() => setActiveTab('stock')}
              >
                📦 موجودی انبار
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                ℹ️ اطلاعات انبار
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                📝 اسناد اخیر
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {/* تب موجودی انبار */}
          {activeTab === 'stock' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">موجودی کالاها</h5>
                <div className="d-flex gap-2">
                  <button 
                    onClick={() => window.print()} 
                    className="btn btn-sm btn-outline-secondary"
                  >
                    🖨️ چاپ لیست
                  </button>
                  <Link 
                    href={`/inventory/reports/stock-status?warehouseId=${params.id}`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    📊 گزارش کامل
                  </Link>
                </div>
              </div>
              
              {warehouse.stockItems && warehouse.stockItems.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>کد کالا</th>
                        <th>نام کالا</th>
                        <th>گروه</th>
                        <th>واحد</th>
                        <th className="text-end">موجودی</th>
                        <th className="text-end">حداقل</th>
                        <th className="text-end">حداکثر</th>
                        <th className="text-end">قیمت واحد</th>
                        <th className="text-end">ارزش</th>
                        <th>وضعیت</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouse.stockItems.map((item) => {
                        const isLowStock = item.quantity <= (item.product?.minStock || 0);
                        const unitPrice = item.product?.defaultPurchasePrice || 0;
                        const value = item.quantity * unitPrice;
                        
                        return (
                          <tr key={item.id} className={isLowStock ? 'table-warning' : ''}>
                            <td className="font-monospace">{item.product?.code}</td>
                            <td>
                              <Link href={`/inventory/products/${item.productId}`} className="text-decoration-none">
                                {item.product?.name}
                              </Link>
                            </td>
                            <td>{item.product?.category?.name}</td>
                            <td>{item.product?.unit?.name}</td>
                            <td className="text-end fw-bold">
                              {item.quantity.toLocaleString('fa-IR')}
                            </td>
                            <td className="text-end">
                              {item.minStock || item.product?.minStock || 0}
                            </td>
                            <td className="text-end">
                              {item.maxStock || item.product?.maxStock || 0}
                            </td>
                            <td className="text-end">
                              {formatCurrency(unitPrice)}
                            </td>
                            <td className="text-end fw-bold">
                              {formatCurrency(value)}
                            </td>
                            <td>
                              {isLowStock ? (
                                <span className="badge bg-warning">کمبود</span>
                              ) : (
                                <span className="badge bg-success">نرمال</span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Link 
                                  href={`/inventory/products/${item.productId}`}
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  مشاهده
                                </Link>
                                <Link 
                                  href={`/inventory/documents/create?productId=${item.productId}&warehouseId=${params.id}`}
                                  className="btn btn-sm btn-outline-success"
                                >
                                  تراکنش
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="table-secondary">
                      <tr>
                        <td colSpan="8" className="text-end fw-bold">جمع کل ارزش:</td>
                        <td className="text-end fw-bold">
                          {formatCurrency(
                            warehouse.stockItems.reduce(
                              (sum, item) => sum + (item.quantity * (item.product?.defaultPurchasePrice || 0)), 
                              0
                            )
                          )}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <div className="mb-3">
                    <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h5>انبار خالی است</h5>
                  <p className="mb-4">هنوز کالایی در این انبار ثبت نشده است.</p>
                  <Link 
                    href={`/inventory/documents/create?warehouseId=${params.id}`}
                    className="btn btn-primary"
                  >
                    ➕ ثبت اولین تراکنش
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* تب اطلاعات انبار */}
          {activeTab === 'info' && (
            <div className="row">
              <div className="col-md-6">
                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <th width="200">کد انبار:</th>
                      <td>{warehouse.code}</td>
                    </tr>
                    <tr>
                      <th>نام انبار:</th>
                      <td>{warehouse.name}</td>
                    </tr>
                    <tr>
                      <th>آدرس:</th>
                      <td>{warehouse.address || 'ثبت نشده'}</td>
                    </tr>
                    <tr>
                      <th>تلفن:</th>
                      <td>{warehouse.phone || 'ثبت نشده'}</td>
                    </tr>
                    <tr>
                      <th>مسئول انبار:</th>
                      <td>{warehouse.manager || 'ثبت نشده'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <th width="200">تاریخ ایجاد:</th>
                      <td>{new Date(warehouse.createdAt).toLocaleDateString('fa-IR')}</td>
                    </tr>
                    <tr>
                      <th>حساب تفصیلی:</th>
                      <td>
                        {warehouse.detailAccount ? (
                          <Link 
                            href={`/detail-accounts/${warehouse.detailAccount.id}`}
                            className="text-decoration-none"
                          >
                            {warehouse.detailAccount.code} - {warehouse.detailAccount.name}
                          </Link>
                        ) : (
                          'متصل نشده'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>توضیحات:</th>
                      <td>{warehouse.description || 'توضیحی ثبت نشده'}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="alert alert-info mt-3">
                  <h6 className="alert-heading">💡 اطلاعات فنی</h6>
                  <p className="mb-0 small">
                    ID انبار: <code>{warehouse.id}</code><br />
                    آخرین به‌روزرسانی: {new Date(warehouse.updatedAt || warehouse.createdAt).toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* تب اسناد اخیر */}
          {activeTab === 'documents' && (
            <div>
              <h5 className="mb-3">آخرین اسناد انبار</h5>
              
              {warehouse.inventoryDocuments && warehouse.inventoryDocuments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>شماره سند</th>
                        <th>تاریخ</th>
                        <th>نوع</th>
                        <th>توضیحات</th>
                        <th className="text-end">تعداد</th>
                        <th className="text-end">مبلغ</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouse.inventoryDocuments.map((doc) => (
                        <tr key={doc.id}>
                          <td className="font-monospace">{doc.documentNumber}</td>
                          <td>{new Date(doc.documentDate).toLocaleDateString('fa-IR')}</td>
                          <td>
                            <span className={`badge bg-${doc.type?.effect === 'increase' ? 'success' : 'danger'}`}>
                              {doc.type?.name}
                            </span>
                          </td>
                          <td>{doc.description?.substring(0, 50)}...</td>
                          <td className="text-end">{doc.totalQuantity}</td>
                          <td className="text-end">{formatCurrency(doc.totalAmount)}</td>
                          <td>
                            <Link 
                              href={`/inventory/documents/${doc.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              مشاهده
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <p>هنوز سندی برای این انبار ثبت نشده است.</p>
                  <Link 
                    href={`/inventory/documents/create?warehouseId=${params.id}`}
                    className="btn btn-primary"
                  >
                    ➕ ایجاد اولین سند
                  </Link>
                </div>
              )}
              
              <div className="mt-3">
                <Link 
                  href={`/inventory/documents?warehouseId=${params.id}`}
                  className="btn btn-outline-secondary"
                >
                  مشاهده همه اسناد
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* بخش عملیات خطرناک */}
      <div className="mt-4">
        <div className="alert alert-danger">
          <h5 className="alert-heading">⚠️ عملیات خطرناک</h5>
          <p className="mb-3">
            حذف انبار باعث پاک شدن تمام اطلاعات مرتبط با آن می‌شود. 
            این عمل غیرقابل بازگشت است و فقط در صورتی مجاز است که انبار هیچ سند یا موجودی نداشته باشد.
          </p>
          <button 
            onClick={handleDelete}
            className="btn btn-danger"
            disabled={warehouse.stockItems?.length > 0 || warehouse.inventoryDocuments?.length > 0}
          >
            🗑️ حذف انبار
          </button>
          {(warehouse.stockItems?.length > 0 || warehouse.inventoryDocuments?.length > 0) && (
            <p className="text-danger small mt-2">
              امکان حذف انبار وجود ندارد زیرا دارای {warehouse.stockItems?.length} کالا و {warehouse.inventoryDocuments?.length} سند است.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}