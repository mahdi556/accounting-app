// src/components/PrintVoucher.jsx
'use client'
import { PersianDate } from '@lib/persianDate'
import { useEffect } from 'react'

const PrintVoucher = ({ voucher, onClose }) => {
  if (!voucher) return null

  // محاسبه جمع‌های ستون‌ها
  const totalDebit = voucher.items.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0)
  const totalCredit = voucher.items.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0)

  // تبدیل اعداد به فرمت فارسی
  const formatNumber = (num) => {
    return new Intl.NumberFormat('fa-IR').format(num)
  }

  // تبدیل عدد به حروف - بدون اضافه کردن "ریال"
  const numberToWords = (num) => {
    const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده']
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
    const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد']
    
    if (num === 0) return 'صفر'
    
    let words = ''
    
    // میلیون
    if (num >= 1000000) {
      words += numberToWords(Math.floor(num / 1000000)) + ' میلیون و '
      num %= 1000000
    }
    
    // هزار
    if (num >= 1000) {
      words += numberToWords(Math.floor(num / 1000)) + ' هزار و '
      num %= 1000
    }
    
    // صد
    if (num >= 100) {
      words += hundreds[Math.floor(num / 100)] + ' و '
      num %= 100
    }
    
    // ده و واحد
    if (num >= 20) {
      words += tens[Math.floor(num / 10)] + ' و '
      num %= 10
    } else if (num >= 10) {
      words += teens[num - 10] + ' و '
      num = 0
    }
    
    // واحد
    if (num > 0) {
      words += units[num] + ' و '
    }
    
    // حذف " و " اضافی از انتها
    if (words.endsWith(' و ')) {
      words = words.slice(0, -3)
    }
    
    return words
  }

  // پیدا کردن کد حساب کل از طریق سلسله مراتب
  const getCategoryCode = (item) => {
    if (item.subAccount?.category?.code) {
      return item.subAccount.category.code
    }
    if (item.detailAccount?.subAccount?.category?.code) {
      return item.detailAccount.subAccount.category.code
    }
    return '-'
  }

  // پیدا کردن کد حساب معین
  const getSubAccountCode = (item) => {
    if (item.subAccount?.code) {
      return item.subAccount.code
    }
    if (item.detailAccount?.subAccount?.code) {
      return item.detailAccount.subAccount.code
    }
    return '-'
  }

  // پیدا کردن کد حساب تفصیلی
  const getDetailAccountCode = (item) => {
    if (item.detailAccount?.code) {
      return item.detailAccount.code
    }
    return '-'
  }

  // پیدا کردن نام حساب
  const getAccountName = (item) => {
    if (item.detailAccount?.name) {
      return item.detailAccount.name
    }
    if (item.subAccount?.name) {
      return item.subAccount.name
    }
    return '-'
  }

  // تابع پرینت اختصاصی
  const handlePrint = () => {
    const printContent = document.getElementById('voucher-print-content')
    const originalContents = document.body.innerHTML
    
    document.body.innerHTML = printContent.innerHTML
    window.print()
    document.body.innerHTML = originalContents
    window.location.reload() // برای برگشت به حالت عادی
  }

  return (
    <div className="print-container">
      {/* دکمه‌های کنترل */}
      <div className="print-controls no-print">
        <button onClick={handlePrint} className="btn btn-primary">
          🖨️ پرینت سند
        </button>
        <button onClick={onClose} className="btn btn-secondary">
          بستن
        </button>
      </div>

      {/* محتوای اصلی برای نمایش در مودال */}
      <div className="voucher-preview">
        <div id="voucher-print-content" className="voucher-print-content">
          {/* محتوای پرینت */}
          <div className="voucher-print">
            {/* هدر سند */}
            <div className="print-header">
              <div className="journal-number">
                <span>[    ] :شماره دفتر روزنامه</span>
              </div>
              
              <div className="voucher-title">
                <div className="voucher-number">
                  <strong>شماره سند:</strong> {voucher.voucherNumber || 'تعیین نشده'}
                </div>
                <div className="voucher-type">
                  <strong>سند حسابداری</strong> ---
                </div>
              </div>
            </div>

            {/* شرح سند */}
            <div className="voucher-description">
              <strong>شرح سند:</strong>
              <div className="description-text">{voucher.description || 'شرح سند'}</div>
            </div>

            {/* جدول اقلام سند */}
            <table className="voucher-table">
              <thead>
                <tr>
                  <th width="8%">تفصیلی</th>
                  <th width="8%">معین</th>
                  <th width="8%">کل</th>
                  <th width="38%">نام حساب</th>
                  <th width="12%">مبلغ جزء</th>
                  <th width="13%">بدهکار</th>
                  <th width="13%">بستانکار</th>
                </tr>
              </thead>
              <tbody>
                {voucher.items && voucher.items.map((item, index) => (
                  <tr key={index}>
                    <td className="text-center">
                      {getDetailAccountCode(item)}
                    </td>
                    <td className="text-center">
                      {getSubAccountCode(item)}
                    </td>
                    <td className="text-center">
                      {getCategoryCode(item)}
                    </td>
                    <td>
                      <div className="account-name">
                        {getAccountName(item)}
                      </div>
                      {item.description && (
                        <div className="item-description">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="text-center">-</td>
                    <td className="text-left amount">
                      {item.debit > 0 ? formatNumber(item.debit) : ''}
                    </td>
                    <td className="text-left amount">
                      {item.credit > 0 ? formatNumber(item.credit) : ''}
                    </td>
                  </tr>
                ))}
                
                {/* خط جمع */}
                <tr className="total-row">
                  <td colSpan="5" className="text-center">
                    <strong>جمع:</strong>
                  </td>
                  <td className="text-left amount">
                    <strong>{formatNumber(totalDebit)}</strong>
                  </td>
                  <td className="text-left amount">
                    <strong>{formatNumber(totalCredit)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* فوتر سند */}
            <div className="print-footer">
              <div className="amount-in-words">
                <strong>مبلغ به حروف:</strong>
                <div className="words-text">{numberToWords(totalDebit)} ریال</div>
              </div>
              
              <div className="signatures">
                <div className="preparer">
                  <strong>تنظیم کننده:</strong> کاربر سیستم
                </div>
                <div className="date">
                  <strong>تاریخ:</strong> {PersianDate.format(voucher.voucherDate, 'jYYYY/jMM/jDD')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* استایل‌های پرینت */}
      <style jsx>{`
        .print-container {
          direction: rtl;
          font-family: 'Tahoma', 'Arial', sans-serif;
        }

        .print-controls {
          position: sticky;
          top: 10px;
          left: 10px;
          z-index: 1000;
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .no-print {
          @media print {
            display: none !important;
          }
        }

        .voucher-preview {
          background: white;
          border-radius: 8px;
          overflow: auto;
          max-height: 80vh;
        }

        .voucher-print-content {
          background: white;
        }

        .voucher-print {
          width: 21cm;
          min-height: 29.7cm;
          padding: 2cm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        .print-header {
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .journal-number {
          text-align: left;
          font-size: 12px;
          margin-bottom: 10px;
        }

        .voucher-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .voucher-number {
          font-size: 14px;
        }

        .voucher-type {
          font-size: 16px;
          font-weight: bold;
        }

        .voucher-description {
          margin: 20px 0;
          padding: 10px;
          border: 1px solid #ccc;
          background: #f9f9f9;
        }

        .description-text {
          margin-top: 5px;
          font-size: 13px;
        }

        .voucher-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 11px;
        }

        .voucher-table th {
          background: #e0e0e0;
          border: 1px solid #000;
          padding: 6px 4px;
          font-weight: bold;
          text-align: center;
        }

        .voucher-table td {
          border: 1px solid #000;
          padding: 8px 4px;
          vertical-align: top;
        }

        .account-name {
          font-weight: 500;
        }

        .item-description {
          font-size: 10px;
          color: #666;
          margin-top: 3px;
          font-style: italic;
        }

        .amount {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          direction: ltr;
          text-align: right;
        }

        .total-row {
          background: #f0f0f0;
          font-weight: bold;
        }

        .total-row td {
          border-top: 2px solid #000;
        }

        .print-footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #000;
          display: flex;
          justify-content: space-between;
        }

        .amount-in-words {
          flex: 2;
        }

        .words-text {
          margin-top: 5px;
          font-weight: bold;
          font-size: 13px;
          border: 1px solid #ccc;
          padding: 8px;
          background: #f9f9f9;
          min-height: 40px;
        }

        .signatures {
          flex: 1;
          text-align: left;
        }

        .preparer, .date {
          margin-bottom: 10px;
          font-size: 12px;
        }

        /* استایل‌های مخصوص پرینت */
        @media print {
          body * {
            visibility: hidden;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .voucher-print-content,
          .voucher-print-content * {
            visibility: visible;
          }
          
          .voucher-print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          
          .voucher-print {
            width: 100% !important;
            min-height: 100vh !important;
            padding: 1cm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          
          .print-controls,
          .no-print {
            display: none !important;
          }
        }

        @page {
          size: A4;
          margin: 1.5cm;
        }
      `}</style>
    </div>
  )
}

export default PrintVoucher