// src/app/inventory/warehouses/[id]/stock/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function WarehouseStockPage() {
  const router = useRouter();
  const params = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📡 دریافت داده برای انبار ID:', params.id);
      
      // ۱. دریافت اطلاعات انبار و محصولات به صورت موازی
      const [warehouseResponse, productsResponse] = await Promise.all([
        fetch(`/api/inventory/warehouses/${params.id}`),
        fetch('/api/inventory/products?limit=100')
      ]);
      
      // ۲. پردازش پاسخ انبار
      if (!warehouseResponse.ok) {
        throw new Error('خطا در دریافت اطلاعات انبار');
      }
      
      const warehouseData = await warehouseResponse.json();
      console.log('🏭 داده انبار:', {
        success: warehouseData.success,
        name: warehouseData.data?.name,
        stockItemsCount: warehouseData.data?.stockItems?.length
      });
      
      if (!warehouseData.success) {
        throw new Error(warehouseData.error || 'خطا در داده انبار');
      }
      
      setWarehouse(warehouseData.data);
      
      // ۳. پردازش پاسخ محصولات
      let products = [];
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        products = productsData.products || [];
        console.log('📦 تعداد محصولات دریافتی:', products.length);
      }
      
      setAllProducts(products);
      
      // ۴. ایجاد لیست کامل StockItems
      const existingStockItems = warehouseData.data.stockItems || [];
      console.log('📊 StockItem های موجود:', existingStockItems.length);
      
      // اگر محصولات داریم، همه را نمایش بده (حتی با موجودی صفر)
      if (products.length > 0) {
        const completeStockItems = products.map(product => {
          // پیدا کردن StockItem موجود
          const existingItem = existingStockItems.find(
            item => item.productId === product.id
          );
          
          if (existingItem) {
            return existingItem;
          }
          
          // ایجاد ساختار برای محصولات بدون StockItem
          return {
            id: -product.id, // ID منفی برای نشان دادن ساخته‌شده
            productId: product.id,
            warehouseId: parseInt(params.id),
            quantity: 0,
            minStock: product.minStock || 0,
            maxStock: product.maxStock || 0,
            product: {
              id: product.id,
              code: product.code,
              name: product.name,
              barcode: product.barcode,
              defaultPurchasePrice: product.defaultPurchasePrice || 0,
              defaultSalePrice: product.defaultSalePrice || 0,
              minStock: product.minStock || 0,
              maxStock: product.maxStock || 0,
              unit: product.unit || { name: 'عدد' },
              category: product.category || { name: 'عمومی' }
            }
          };
        });
        
        console.log('✅ لیست کامل StockItems:', completeStockItems.length);
        setStockItems(completeStockItems);
      } else {
        // اگر محصولی نداریم، فقط StockItem های موجود را نمایش بده
        setStockItems(existingStockItems);
      }
      
    } catch (error) {
      console.error('❌ خطا در دریافت داده:', error);
      setError(error.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const getStockValue = (item) => {
    const unitPrice = item.product?.defaultPurchasePrice || 0;
    return (item.quantity || 0) * unitPrice;
  };

  const getFilteredItems = () => {
    const items = stockItems || [];
    switch(filter) {
      case 'low':
        return items.filter(item => {
          const minStock = item.minStock || item.product?.minStock || 0;
          return item.quantity <= minStock;
        });
      case 'normal':
        return items.filter(item => {
          const minStock = item.minStock || item.product?.minStock || 0;
          return item.quantity > minStock;
        });
      default:
        return items;
    }
  };

  const filteredItems = getFilteredItems();
  const totalValue = filteredItems.reduce((sum, item) => sum + getStockValue(item), 0);
  const totalQuantity = filteredItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  const lowStockItems = (stockItems || []).filter(item => {
    const minStock = item.minStock || item.product?.minStock || 0;
    return item.quantity <= minStock;
  });

  const handleCreateStockItem = async (productId) => {
    if (!confirm('آیا می‌خواهید برای این محصول موجودی ایجاد کنید؟')) {
      return;
    }
    
    try {
      const response = await fetch('/api/inventory/initialize-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          warehouseId: params.id,
          quantity: 0,
          unitPrice: 0,
          description: 'ایجاد رکورد StockItem'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('رکورد موجودی ایجاد شد');
        fetchData(); // رفرش داده‌ها
      } else {
        alert(data.error || 'خطا در ایجاد رکورد');
      }
    } catch (error) {
      console.error('Error creating stock item:', error);
      alert('خطا در ارتباط با سرور');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال دریافت اطلاعات موجودی...</p>
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
            <button onClick={fetchData} className="btn btn-outline-danger">
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
    <div className="container-fluid py-4">
      {/* دیباگ پنل */}
      <div className="alert alert-info mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>💡 اطلاعات دیباگ:</strong>
            <div className="small mt-1">
              انبار: <code>{warehouse.name}</code> | 
              محصولات: <code>{allProducts.length}</code> | 
              StockItems: <code>{stockItems.length}</code> |
              فیلتر: <code>{filter}</code>
            </div>
          </div>
          <button 
            onClick={() => console.log({
              warehouse,
              allProducts,
              stockItems,
              filteredItems,
              params
            })}
            className="btn btn-sm btn-outline-info"
          >
            نمایش در کنسول
          </button>
        </div>
      </div>

      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary bg-gradient p-3 rounded-3 me-3">
            <i className="bi bi-box-seam text-white fs-4"></i>
          </div>
          <div>
            <h1 className="h3 fw-bold mb-1">موجودی انبار</h1>
            <div className="text-muted">
              <span className="badge bg-primary me-2">{warehouse.code}</span>
              <span>{warehouse.name}</span>
              {warehouse.manager && (
                <span className="ms-3">
                  <i className="bi bi-person me-1"></i>
                  مسئول: {warehouse.manager}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="btn-group" role="group">
          <Link
            href={`/inventory/documents/create?warehouseId=${params.id}`}
            className="btn btn-success d-flex align-items-center"
          >
            <i className="bi bi-plus-circle me-2"></i>
            تراکنش جدید
          </Link>
          <button
            onClick={() => router.push('/inventory/warehouses')}
            className="btn btn-outline-secondary d-flex align-items-center"
          >
            <i className="bi bi-arrow-right me-2"></i>
            بازگشت
          </button>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">تعداد کالاها</h6>
                  <h3 className="fw-bold mb-0 text-primary">{stockItems.length}</h3>
                  <small className="text-muted">محصولات ثبت شده</small>
                </div>
                <div className="text-primary">
                  <i className="bi bi-box fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">موجودی کل</h6>
                  <h3 className="fw-bold mb-0 text-success">
                    {filteredItems.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()}
                  </h3>
                  <small className="text-muted">تعداد واحدها</small>
                </div>
                <div className="text-success">
                  <i className="bi bi-calculator fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">ارزش کل</h6>
                  <h3 className="fw-bold mb-0 text-info">
                    {totalValue.toLocaleString()}
                    <small className="fs-6"> ریال</small>
                  </h3>
                  <small className="text-muted">ارزش موجودی</small>
                </div>
                <div className="text-info">
                  <i className="bi bi-currency-exchange fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">کمبود موجودی</h6>
                  <h3 className="fw-bold mb-0 text-warning">{lowStockItems.length}</h3>
                  <small className="text-muted">نیاز به سفارش</small>
                </div>
                <div className="text-warning">
                  <i className="bi bi-exclamation-triangle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فیلترها */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3">
                <span className="fw-medium">فیلتر:</span>
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFilter('all')}
                  >
                    همه ({stockItems.length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${filter === 'normal' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setFilter('normal')}
                  >
                    مناسب ({stockItems.length - lowStockItems.length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${filter === 'low' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setFilter('low')}
                  >
                    کمبود ({lowStockItems.length})
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex justify-content-end gap-2">
                <button 
                  onClick={fetchData}
                  className="btn btn-outline-secondary btn-sm"
                  title="بروزرسانی"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* جدول موجودی */}
      <div className="card border-0 shadow">
        <div className="card-body p-0">
          {filteredItems.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-box-seam display-1 text-muted mb-3"></i>
              <h5 className="text-muted mb-3">
                {filter === 'all' ? 'هیچ محصولی یافت نشد' : 
                 filter === 'low' ? 'کالای کم‌موجود یافت نشد' : 
                 'کالای با موجودی مناسب یافت نشد'}
              </h5>
              <Link 
                href={`/inventory/documents/create?warehouseId=${params.id}`}
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-2"></i>
                ایجاد اولین تراکنش
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>کد</th>
                    <th>نام کالا</th>
                    <th>واحد</th>
                    <th className="text-end">موجودی</th>
                    <th className="text-end">قیمت خرید</th>
                    <th className="text-end">ارزش</th>
                    <th className="text-end">حداقل</th>
                    <th>وضعیت</th>
                    <th className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isLowStock = item.quantity <= (item.minStock || item.product?.minStock || 0);
                    const hasStockItem = item.id > 0; // اگر ID مثبت است، StockItem واقعی دارد
                    const stockValue = getStockValue(item);
                    
                    return (
                      <tr key={item.id || `temp-${item.productId}`} 
                          className={!hasStockItem ? 'table-secondary' : ''}>
                        <td>
                          <span className="badge bg-light text-dark font-monospace">
                            {item.product?.code}
                          </span>
                        </td>
                        <td>
                          <div className="fw-medium">{item.product?.name}</div>
                          {!hasStockItem && (
                            <small className="text-danger">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              فاقد رکورد StockItem
                            </small>
                          )}
                        </td>
                        <td>
                          {item.product?.unit?.name ? (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary">
                              {item.product.unit.name}
                            </span>
                          ) : 'عدد'}
                        </td>
                        <td className="text-end">
                          <span className={`fw-bold ${isLowStock ? 'text-danger' : 'text-success'}`}>
                            {item.quantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-end">
                          {item.product?.defaultPurchasePrice?.toLocaleString() || 0} ریال
                        </td>
                        <td className="text-end fw-bold">
                          {stockValue.toLocaleString()} ریال
                        </td>
                        <td className="text-end">
                          {item.minStock || item.product?.minStock || 0}
                        </td>
                        <td>
                          {isLowStock ? (
                            <span className="badge bg-warning">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              کمبود
                            </span>
                          ) : (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i>
                              مناسب
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              onClick={() => router.push(`/inventory/products/${item.productId}`)}
                              className="btn btn-outline-primary"
                              title="مشاهده کالا"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            
                            {hasStockItem ? (
                              <>
                                <button
                                  onClick={() => router.push(`/inventory/documents/create?productId=${item.productId}&warehouseId=${params.id}&type=TRANSFER`)}
                                  className="btn btn-outline-info"
                                  title="انتقال کالا"
                                >
                                  <i className="bi bi-arrow-left-right"></i>
                                </button>
                                <button
                                  onClick={() => router.push(`/inventory/documents/create?productId=${item.productId}&warehouseId=${params.id}&type=ADJUSTMENT_PLUS`)}
                                  className="btn btn-outline-success"
                                  title="افزایش موجودی"
                                >
                                  <i className="bi bi-plus"></i>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleCreateStockItem(item.productId)}
                                className="btn btn-outline-warning"
                                title="ایجاد رکورد موجودی"
                              >
                                <i className="bi bi-plus-circle"></i>
                                ایجاد
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* اطلاعات اضافی */}
      <div className="mt-4">
        <div className="alert alert-light border">
          <h6 className="mb-2">📋 نکات مهم:</h6>
          <ul className="mb-0">
            <li>ردیف‌های <strong>خاکستری</strong> فاقد رکورد StockItem در دیتابیس هستند</li>
            <li>برای این محصولات باید از دکمه <strong>"ایجاد"</strong> استفاده کنید</li>
            <li>محصول <strong>"شکر"</strong> باید موجودی 4800 نشان دهد</li>
            <li>محصول <strong>"نبات"</strong> باید موجودی 0 نشان دهد (فاقد StockItem)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}