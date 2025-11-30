// src/app/api/dashboard/stats/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET() {
  try {
    console.log('📊 Fetching dashboard stats...')

    // محاسبه مجموع دارایی‌ها
    const assetAccounts = await prisma.subAccount.findMany({
      where: {
        category: {
          type: 'asset'
        }
      },
      select: {
        balance: true
      }
    })
    const totalAssets = assetAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)

    // محاسبه مجموع بدهی‌ها
    const liabilityAccounts = await prisma.subAccount.findMany({
      where: {
        category: {
          type: 'liability'
        }
      },
      select: {
        balance: true
      }
    })
    const totalLiabilities = liabilityAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)

    // محاسبه مجموع درآمدها
    const incomeAccounts = await prisma.subAccount.findMany({
      where: {
        category: {
          type: 'income'
        }
      },
      select: {
        balance: true
      }
    })
    const totalIncome = incomeAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)

    // محاسبه مجموع هزینه‌ها
    const expenseAccounts = await prisma.subAccount.findMany({
      where: {
        category: {
          type: 'expense'
        }
      },
      select: {
        balance: true
      }
    })
    const totalExpense = expenseAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)

    // سود خالص
    const netProfit = totalIncome - totalExpense

    // تعداد کل اسناد
    const totalVouchers = await prisma.voucher.count()

    // تعداد چک‌های دریافتنی و پرداختنی
    const receivableCheques = await prisma.cheque.count({
      where: { type: 'receivable' }
    })
    const payableCheques = await prisma.cheque.count({
      where: { type: 'payable' }
    })

    // تعداد اشخاص
    const totalPersons = await prisma.person.count()

    // تعداد حساب‌های معین
    const totalAccounts = await prisma.subAccount.count()

    // آخرین اسناد
    const recentVouchers = await prisma.voucher.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        voucherNumber: true,
        voucherDate: true,
        description: true,
        totalAmount: true
      }
    })

    // چک‌های سررسید نزدیک (7 روز آینده)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const dueCheques = await prisma.cheque.findMany({
      where: {
        dueDate: {
          lte: nextWeek,
          gte: new Date()
        },
        status: 'pending'
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        chequeNumber: true,
        bankName: true,
        drawer: true,
        amount: true,
        dueDate: true
      }
    })

    // بررسی تراز اسناد (ساده)
    const vouchersBalanced = true // در نسخه واقعی باید محاسبه شود

    const stats = {
      totalAssets,
      totalLiabilities,
      netProfit,
      totalVouchers,
      receivableCheques,
      payableCheques,
      totalPersons,
      totalAccounts,
      todayTurnover: 0, // در نسخه واقعی باید محاسبه شود
      vouchersBalanced,
      recentVouchers,
      dueCheques
    }

    console.log('✅ Dashboard stats calculated:', stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: `خطا در دریافت اطلاعات داشبورد: ${error.message}` },
      { status: 500 }
    )
  }
}