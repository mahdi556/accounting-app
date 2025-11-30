// src/lib/codeGenerator.js

/**
 * تولید کد جدید بر اساس نوع حساب و والد
 */
export function generateNextCode(accountType, parentAccount = null, existingCodes = {}) {
  if (accountType === 'category') {
    return generateCategoryCode(parentAccount, existingCodes.category)
  } else if (accountType === 'subAccount') {
    return generateSubAccountCode(parentAccount, existingCodes.subAccount)
  } else if (accountType === 'detailAccount') {
    return generateDetailAccountCode(parentAccount, existingCodes.detailAccount)
  }
  return '001'
}

/**
 * تولید کد برای حساب کل
 */
function generateCategoryCode(parentCategory, lastCategoryCode = '0') {
  // اگر والد داریم، کد را بر اساس والد تولید می‌کنیم
  if (parentCategory) {
    const parentCode = parentCategory.code
    // پیدا کردن آخرین فرزند والد
    const childrenCodes = getChildrenCodes(parentCode, 'category')
    const lastChildNumber = getLastChildNumber(childrenCodes)
    const nextNumber = lastChildNumber + 1
    return `${parentCode}-${nextNumber.toString().padStart(2, '0')}`
  }
  
  // حساب کل اصلی - بر اساس نوع
  const lastCode = parseInt(lastCategoryCode.split('-')[0]) || 0
  const nextNumber = lastCode + 1
  return nextNumber.toString()
}

/**
 * تولید کد برای حساب معین
 */
function generateSubAccountCode(parentCategory, lastSubAccountCode = '0') {
  if (!parentCategory) return '001'
  
  const parentCode = parentCategory.code
  // پیدا کردن آخرین حساب معین این حساب کل
  const childrenCodes = getChildrenCodes(parentCode, 'subAccount')
  const lastChildNumber = getLastChildNumber(childrenCodes)
  const nextNumber = lastChildNumber + 1
  return `${parentCode}-${nextNumber.toString().padStart(4, '0')}`
}

/**
 * تولید کد برای حساب تفصیلی
 */
function generateDetailAccountCode(parentSubAccount, lastDetailAccountCode = '0') {
  if (!parentSubAccount) return '001'
  
  const parentCode = parentSubAccount.code
  // پیدا کردن آخرین حساب تفصیلی این حساب معین
  const childrenCodes = getChildrenCodes(parentCode, 'detailAccount')
  const lastChildNumber = getLastChildNumber(childrenCodes)
  const nextNumber = lastChildNumber + 1
  return `${parentCode}-${nextNumber.toString().padStart(2, '0')}`
}

/**
 * پیدا کردن کدهای فرزندان یک والد
 */
function getChildrenCodes(parentCode, accountType) {
  // این تابع باید از دیتابیس کدهای موجود را بخواند
  // فعلاً یک نمونه ساده برمی‌گردانیم
  return []
}

/**
 * پیدا کردن آخرین شماره فرزند
 */
function getLastChildNumber(childrenCodes) {
  if (childrenCodes.length === 0) return 0
  
  const lastCode = childrenCodes[childrenCodes.length - 1]
  const parts = lastCode.split('-')
  const lastPart = parts[parts.length - 1]
  return parseInt(lastPart) || 0
}

/**
 * فرمت زیبا برای نمایش کد
 */
export function formatCodeForDisplay(code) {
  return code
}