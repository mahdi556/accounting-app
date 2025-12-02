// src/lib/format.js
/**
 * تبدیل عدد به فرمت فارسی با جداکننده هزارگان
 * @param {number|string} number - عددی که باید فرمت شود
 * @param {boolean} withCurrency - آیا واحد پول اضافه شود؟
 * @returns {string} عدد فرمت شده به فارسی
 */
export const formatNumber = (number, withCurrency = false) => {
  if (number === null || number === undefined || number === '') return '0'
  
  // تبدیل به عدد
  const num = typeof number === 'string' ? parseFloat(number) : number
  
  // اگر عدد معتبر نباشد
  if (isNaN(num)) return '0'
  
  // فرمت عدد با جداکننده هزارگان
  const formatted = new Intl.NumberFormat('fa-IR').format(num)
  
  // اضافه کردن واحد پول اگر لازم باشد
  return withCurrency ? `${formatted} ریال` : formatted
}

/**
 * پاکسازی مقدار ورودی (حذف فقط جداکننده‌ها)
 * @param {string} value - مقدار ورودی
 * @returns {string} مقدار پاکسازی شده
 */
export const cleanInputValue = (value) => {
  if (!value) return ''
  
  // فقط جداکننده‌های فارسی و انگلیسی را حذف کن
  return value.replace(/[,]/g, '').replace(/[،]/g, '')
}

/**
 * تبدیل مقدار input به عدد
 * @param {string|number} value - مقدار ورودی از input
 * @returns {number} عدد تبدیل شده
 */
export const parseInputToNumber = (value) => {
  if (value === null || value === undefined) return 0
  
  // اگر عدد است، همان را برگردان
  if (typeof value === 'number') return value
  
  // اگر رشته است، تبدیل کن
  if (typeof value === 'string') {
    if (!value.trim()) return 0
    
    // فقط جداکننده‌ها را حذف کن، نه سایر کاراکترها
    const cleaned = cleanInputValue(value)
    
    // اگر رشته خالی شد، صفر برگردان
    if (!cleaned) return 0
    
    const num = parseFloat(cleaned)
    
    return isNaN(num) ? 0 : num
  }
  
  return 0
}

/**
 * فرمت کردن مقدار هنگام تایپ در input
 * @param {string} value - مقدار ورودی
 * @returns {string} مقدار فرمت شده
 */
export const formatWhileTyping = (value) => {
  if (!value) return ''
  
  // پاکسازی مقدار از جداکننده‌ها
  const cleaned = cleanInputValue(value)
  
  // اگر مقدار خالی است، برگردان
  if (!cleaned) return ''
  
  // فقط اعداد مجاز هستند - بررسی کن که فقط عدد باشد
  if (!/^\d*$/.test(cleaned)) {
    // اگر حاوی کاراکتر غیرعددی است، مقدار قبلی را برگردان
    return value.replace(/[^\d]/g, '')
  }
  
  // تبدیل به عدد و سپس فرمت کردن
  const num = parseFloat(cleaned)
  if (isNaN(num)) return ''
  
  return formatNumber(num)
}

/**
 * فرمت کردن مقدار وقتی کاربر از input خارج می‌شود
 * @param {string} value - مقدار ورودی
 * @returns {string} مقدار فرمت شده
 */
export const formatOnBlur = (value) => {
  if (!value) return ''
  
  const num = parseInputToNumber(value)
  return formatNumber(num)
}