// src/app/api/debug/voucher-items/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET() {
  try {
    console.log('🧪 Debug: Checking voucher items data...')

    // تعداد کل voucher items
    const totalVoucherItems = await prisma.voucherItem.count()
    
    // نمونه‌ای از voucher items
    const sampleVoucherItems = await prisma.voucherItem.findMany({
      take: 10,
      include: {
        subAccount: {
          select: {
            code: true,
            name: true
          }
        },
        voucher: {
          select: {
            voucherNumber: true,
            voucherDate: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    })

    // تعداد حساب‌ها
    const totalAccounts = await prisma.subAccount.count()

    // بررسی اینکه آیا حساب‌ها voucher items دارند
    const accountsWithItems = await prisma.subAccount.findMany({
      include: {
        _count: {
          select: {
            voucherItems: true
          }
        }
      },
      where: {
        voucherItems: {
          some: {}
        }
      }
    })

    const result = {
      message: 'دیتابیس تست شد',
      stats: {
        totalVoucherItems,
        totalAccounts,
        accountsWithVoucherItems: accountsWithItems.length,
        sampleVoucherItems: sampleVoucherItems.map(item => ({
          id: item.id,
          subAccount: item.subAccount?.code,
          debit: item.debit,
          credit: item.credit,
          voucher: item.voucher?.voucherNumber,
          date: item.voucher?.voucherDate
        }))
      }
    }

    console.log('🧪 Debug results:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json(
      { error: `خطا در تست دیتابیس: ${error.message}` },
      { status: 500 }
    )
  }
}