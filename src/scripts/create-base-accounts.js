// src/scripts/create-cheque-accounts.js - بروزرسانی با کد جدید
import { prisma } from '@lib/prisma'

async function createChequeAccounts() {
  try {
    // پیدا کردن حساب کل دارایی‌ها
    const assetCategory = await prisma.accountCategory.findFirst({
      where: { code: '1' }
    })

    if (!assetCategory) {
      console.log('Creating asset category...')
      // ایجاد حساب کل دارایی‌ها
      await prisma.accountCategory.create({
        data: {
          code: '1',
          name: 'دارایی‌ها',
          type: 'asset'
        }
      })
    }

    // پیدا کردن حساب کل هزینه‌ها
    const expenseCategory = await prisma.accountCategory.findFirst({
      where: { code: '5' }
    })

    if (!expenseCategory) {
      console.log('Creating expense category...')
      // ایجاد حساب کل هزینه‌ها
      await prisma.accountCategory.create({
        data: {
          code: '5',
          name: 'هزینه‌ها',
          type: 'expense'
        }
      })
    }

    // ایجاد حساب معین چک‌های دریافتنی - با کد جدید
    await prisma.subAccount.upsert({
      where: { code: '1-02-0001' },
      update: {},
      create: {
        code: '1-02-0001',
        name: 'چک‌های دریافتنی',
        categoryId: assetCategory.id,
        balance: 0
      }
    })

    // ایجاد حساب معین چک‌های پرداختنی
    await prisma.subAccount.upsert({
      where: { code: '3-01-0001' },
      update: {},
      create: {
        code: '3-01-0001',
        name: 'چک‌های پرداختنی',
        categoryId: expenseCategory.id,
        balance: 0
      }
    })

    console.log('Cheque accounts created successfully:')
    console.log('- دریافتنی: 1-02-0001')
    console.log('- پرداختنی: 3-01-0001')

  } catch (error) {
    console.error('Error creating cheque accounts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// اجرای اسکریپت
if (require.main === module) {
  createChequeAccounts()
}

export { createChequeAccounts }