// src/lib/utils.js

// فرمت کردن عدد به صورت مالی
export function formatCurrency(amount, currency = 'ریال') {
  return `${amount.toLocaleString('fa-IR')} ${currency}`
}

// فرمت تاریخ
export function formatDate(date, locale = 'fa-IR') {
  return new Date(date).toLocaleDateString(locale)
}

// بررسی تراز بودن سند
export function isVoucherBalanced(items) {
  const totalDebit = items.reduce((sum, item) => sum + parseFloat(item.debit || 0), 0)
  const totalCredit = items.reduce((sum, item) => sum + parseFloat(item.credit || 0), 0)
  return Math.abs(totalDebit - totalCredit) < 0.01 // تحمل خطای اعشاری
}

// تولید شماره سند خودکار
export function generateVoucherNumber(lastVoucherId = 0) {
  return `V${String(lastVoucherId + 1).padStart(5, '0')}`
}

// اعتبارسنجی کد حساب
export function isValidAccountCode(code) {
  return /^\d{1,10}$/.test(code)
}