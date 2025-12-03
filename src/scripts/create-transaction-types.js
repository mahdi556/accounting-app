// scripts/create-transaction-types.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTransactionTypes() {
  try {
    const transactionTypes = [
      {
        code: 'PROD-CONSUME',
        name: 'مصرف تولید',
        effect: 'decrease',
        description: 'مصرف مواد اولیه در فرآیند تولید'
      },
      {
        code: 'PROD-OUTPUT',
        name: 'تولید محصول',
        effect: 'increase',
        description: 'ثبت محصول نهایی تولید شده'
      },
      {
        code: 'PURCHASE',
        name: 'خرید',
        effect: 'increase',
        description: 'خرید مواد اولیه یا کالا'
      },
      {
        code: 'SALE',
        name: 'فروش',
        effect: 'decrease',
        description: 'فروش کالا'
      },
      {
        code: 'TRANSFER-IN',
        name: 'انتقال ورودی',
        effect: 'increase',
        description: 'انتقال از انبار دیگر'
      },
      {
        code: 'TRANSFER-OUT',
        name: 'انتقال خروجی',
        effect: 'decrease',
        description: 'انتقال به انبار دیگر'
      },
      {
        code: 'ADJUST-IN',
        name: 'تعدیل افزایشی',
        effect: 'increase',
        description: 'تعدیل مثبت موجودی'
      },
      {
        code: 'ADJUST-OUT',
        name: 'تعدیل کاهشی',
        effect: 'decrease',
        description: 'تعدیل منفی موجودی'
      },
      {
        code: 'RETURN-IN',
        name: 'مرجوعی خرید',
        effect: 'decrease',
        description: 'مرجوعی خرید به تامین کننده'
      },
      {
        code: 'RETURN-OUT',
        name: 'مرجوعی فروش',
        effect: 'increase',
        description: 'مرجوعی از مشتری'
      }
    ]

    console.log('Creating/updating transaction types...')
    
    // دریافت انواع موجود برای جلوگیری از خطای duplicate
    const existingTypes = await prisma.inventoryTransactionType.findMany({
      select: { code: true }
    })
    const existingCodes = existingTypes.map(t => t.code)
    
    console.log('Existing codes:', existingCodes)
    
    for (const type of transactionTypes) {
      if (existingCodes.includes(type.code)) {
        // به‌روزرسانی اگر وجود دارد
        await prisma.inventoryTransactionType.update({
          where: { code: type.code },
          data: type
        })
        console.log(`✓ Updated: ${type.code} - ${type.name}`)
      } else {
        // ایجاد اگر وجود ندارد
        await prisma.inventoryTransactionType.create({ data: type })
        console.log(`✓ Created: ${type.code} - ${type.name}`)
      }
    }
    
    console.log('\n✅ Transaction types created/updated successfully!')
    
    // نمایش لیست نهایی
    const finalTypes = await prisma.inventoryTransactionType.findMany({
      orderBy: { code: 'asc' }
    })
    
    console.log('\n📋 Final transaction types:')
    console.table(finalTypes.map(t => ({
      Code: t.code,
      Name: t.name,
      Effect: t.effect,
      Description: t.description
    })))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    
    // اگر خطای duplicate بود، فقط اطلاعات موجود را نمایش بده
    if (error.code === 'P2002') {
      console.log('\n📊 Current transaction types in database:')
      const currentTypes = await prisma.inventoryTransactionType.findMany({
        orderBy: { code: 'asc' }
      })
      console.table(currentTypes.map(t => ({
        Code: t.code,
        Name: t.name,
        Effect: t.effect
      })))
    }
  } finally {
    await prisma.$disconnect()
  }
}

createTransactionTypes()