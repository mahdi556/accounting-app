'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InventoryReportsPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    totalTransactions: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportStats();
  }, []);

  const fetchReportStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/reports/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching report stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    {
      title: 'گزارش موجودی انبار',
      description: 'مشاهده موجودی کالاها در انبارهای مختلف',
      icon: 'bi-box-seam',
      href: '/inventory/reports/stock-status',
      color: 'border-primary text-primary',
      badge: 'primary'
    },
    {
      title: 'گزارش گردش کالا',
      description: 'گزارش خرید، فروش و گردش کالاها',
      icon: 'bi-arrow-left-right',
      href: '/inventory/reports/inventory-turnover',
      color: 'border-success text-success',
      badge: 'success'
    },
    {
      title: 'گزارش کاردکس',
      description: 'سابقه ورود و خروج کالاها به تفکیک انبار',
      icon: 'bi-journal-text',
      href: '/inventory/reports/stock-movement',
      color: 'border-purple text-purple',
      badge: 'purple'
    },
    {
      title: 'کالاهای کم موجود',
      description: 'لیست کالاهایی که موجودی آنها به حداقل رسیده',
      icon: 'bi-exclamation-triangle',
      href: '/inventory/reports/low-stock',
      color: 'border-warning text-warning',
      badge: 'warning'
    },
    {
      title: 'گزارش ارزش موجودی',
      description: 'ارزش ریالی موجودی کالاها در انبار',
      icon: 'bi-cash-coin',
      href: '/inventory/reports/inventory-value',
      color: 'border-info text-info',
      badge: 'info'
    },
    {
      title: 'گزارش کالاهای راکد',
      description: 'کالاهایی که در بازه زمانی مشخص حرکتی نداشته‌اند',
      icon: 'bi-graph-down',
      href: '/inventory/reports/slow-moving',
      color: 'border-secondary text-secondary',
      badge: 'secondary'
    }
  ];

  const quickReports = [
    {
      title: 'خروجی Excel موجودی',
      icon: 'bi-file-earmark-excel',
      href: '/api/inventory/reports/stock-status/export?format=excel',
      format: 'Excel',
      color: 'text-success',
      bgColor: 'bg-success bg-opacity-10'
    },
    {
      title: 'خروجی PDF ارزش',
      icon: 'bi-file-earmark-pdf',
      href: '/api/inventory/reports/inventory-value/export?format=pdf',
      format: 'PDF',
      color: 'text-danger',
      bgColor: 'bg-danger bg-opacity-10'
    },
    {
      title: 'خروجی CSV تراکنش‌ها',
      icon: 'bi-file-earmark-text',
      href: '/api/inventory/reports/transactions/export?format=csv',
      format: 'CSV',
      color: 'text-info',
      bgColor: 'bg-info bg-opacity-10'
    }
  ];

  return (
    <div className="container-fluid py-4">
      {/* هدر */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-2">
            <i className="bi bi-bar-chart text-primary me-2"></i>
            گزارشات انبارداری
          </h1>
          <p className="text-muted mb-0">گزارشات جامع و تحلیلی سیستم انبارداری</p>
        </div>
        <div>
          <button 
            onClick={fetchReportStats}
            className="btn btn-outline-secondary d-flex align-items-center"
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            {loading ? 'در حال بارگذاری...' : 'بروزرسانی'}
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
                  {loading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-6"></span>
                    </div>
                  ) : (
                    <h3 className="fw-bold mb-0">{stats.totalProducts.toLocaleString()}</h3>
                  )}
                  <div className="text-muted small mt-1">
                    <i className="bi bi-box me-1"></i>
                    کالای ثبت شده
                  </div>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-box-seam text-primary fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0 py-2">
              <Link href="/inventory/products" className="text-decoration-none small">
                مشاهده لیست کالاها
                <i className="bi bi-arrow-left me-2"></i>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">تعداد انبارها</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-6"></span>
                    </div>
                  ) : (
                    <h3 className="fw-bold mb-0">{stats.totalWarehouses.toLocaleString()}</h3>
                  )}
                  <div className="text-muted small mt-1">
                    <i className="bi bi-buildings me-1"></i>
                    انبار فعال
                  </div>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-buildings text-success fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0 py-2">
              <Link href="/inventory/warehouses" className="text-decoration-none small">
                مشاهده لیست انبارها
                <i className="bi bi-arrow-left me-2"></i>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">تراکنش‌های انبار</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-6"></span>
                    </div>
                  ) : (
                    <h3 className="fw-bold mb-0">{stats.totalTransactions.toLocaleString()}</h3>
                  )}
                  <div className="text-muted small mt-1">
                    <i className="bi bi-journal-text me-1"></i>
                    سند انبار ثبت شده
                  </div>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-journal-text text-info fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0 py-2">
              <Link href="/inventory/documents" className="text-decoration-none small">
                مشاهده اسناد
                <i className="bi bi-arrow-left me-2"></i>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">ارزش کل موجودی</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-6"></span>
                    </div>
                  ) : (
                    <h3 className="fw-bold mb-0">{stats.totalValue.toLocaleString('fa-IR')}</h3>
                  )}
                  <div className="text-muted small mt-1">
                    <i className="bi bi-currency-rial me-1"></i>
                    ریال
                  </div>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-currency-rial text-warning fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0 py-2">
              <Link href="/inventory/reports/inventory-value" className="text-decoration-none small">
                جزئیات ارزش
                <i className="bi bi-arrow-left me-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* گزارشات اصلی */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0">
            <i className="bi bi-list-stars text-primary me-2"></i>
            گزارشات اصلی
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {reports.map((report, index) => (
              <div key={index} className="col-xl-4 col-md-6">
                <Link 
                  href={report.href}
                  className="card border h-100 text-decoration-none hover-shadow"
                >
                  <div className="card-body">
                    <div className="d-flex align-items-start">
                      <div className={`${report.bgColor} d-flex align-items-center justify-content-center rounded-circle me-3`} 
                           style={{ width: '50px', height: '50px' }}>
                        <i className={`${report.icon} ${report.color.split(' ')[2]} fs-4`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title fw-bold mb-0">{report.title}</h6>
                          <span className={`badge bg-${report.badge} bg-opacity-10 text-${report.badge}`}>
                            گزارش
                          </span>
                        </div>
                        <p className="text-muted small mb-2">{report.description}</p>
                        <div className="text-end">
                          <span className="text-primary small">
                            مشاهده گزارش
                            <i className="bi bi-arrow-left me-2"></i>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* خروجی سریع گزارشات */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0">
            <i className="bi bi-download text-success me-2"></i>
            خروجی سریع گزارشات
          </h5>
          <p className="text-muted mb-0 small">دانلود گزارشات در قالب‌های مختلف</p>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {quickReports.map((report, index) => (
              <div key={index} className="col-md-4">
                <a 
                  href={report.href}
                  className="card border h-100 text-decoration-none hover-lift"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="card-body text-center py-4">
                    <div className={`${report.bgColor} d-inline-flex align-items-center justify-content-center rounded-circle mb-3`} 
                         style={{ width: '60px', height: '60px' }}>
                      <i className={`${report.icon} ${report.color} fs-3`}></i>
                    </div>
                    <h6 className="card-title fw-bold mb-2">{report.title}</h6>
                    <p className="text-muted small mb-3">فرمت {report.format}</p>
                    <div className="text-center">
                      <span className="btn btn-sm btn-outline-secondary">
                        <i className="bi bi-download me-1"></i>
                        دانلود
                      </span>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* نکات مهم */}
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h6 className="card-title mb-0">
                <i className="bi bi-info-circle text-info me-2"></i>
                نکات مهم
              </h6>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item border-0 px-0 py-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  گزارش موجودی به صورت لحظه‌ای به‌روزرسانی می‌شود
                </li>
                <li className="list-group-item border-0 px-0 py-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  امکان فیلتر بر اساس تاریخ، انبار و کالا وجود دارد
                </li>
                <li className="list-group-item border-0 px-0 py-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  گزارشات با دقت ۹۹% تهیه می‌شوند
                </li>
                <li className="list-group-item border-0 px-0 py-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  قابلیت چاپ تمام گزارشات وجود دارد
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h6 className="card-title mb-0">
                <i className="bi bi-lightning-charge text-warning me-2"></i>
                دسترسی سریع
              </h6>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                <Link href="/inventory/documents" className="btn btn-outline-primary btn-sm">
                  <i className="bi bi-journal-text me-1"></i>
                  اسناد انبار
                </Link>
                <Link href="/inventory/products" className="btn btn-outline-success btn-sm">
                  <i className="bi bi-box-seam me-1"></i>
                  مدیریت کالاها
                </Link>
                <Link href="/inventory/warehouses" className="btn btn-outline-info btn-sm">
                  <i className="bi bi-buildings me-1"></i>
                  انبارها
                </Link>
                <Link href="/inventory" className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-house me-1"></i>
                  داشبورد انبار
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS اضافی */}
      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }
        .bg-purple {
          background-color: #6f42c1;
        }
        .text-purple {
          color: #6f42c1;
        }
        .border-purple {
          border-color: #6f42c1!important;
        }
      `}</style>
    </div>
  );
}