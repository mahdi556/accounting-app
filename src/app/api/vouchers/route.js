// app/api/vouchers/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        include: {
          items: {
            include: {
              subAccount: {
                include: {
                  category: true
                }
              },
              detailAccount: true,
              person: true
            }
          }
        },
        orderBy: { voucherDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.voucher.count()
    ])

    return NextResponse.json({
      vouchers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    // دریافت تاریخ از body
    const voucherDateRaw = body.voucherDate || body.voucher_date || null

    if (!voucherDateRaw) {
      return NextResponse.json(
        { error: "فیلد تاریخ سند الزامی است." },
        { status: 400 }
      )
    }

    // تبدیل تاریخ
    const parsedDate = new Date(voucherDateRaw)

    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "تاریخ سند معتبر نیست." },
        { status: 400 }
      )
    }

    const { description, items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "ردیف‌های سند نمی‌تواند خالی باشد." },
        { status: 400 }
      )
    }

    // اعتبارسنجی حساب‌ها
    for (const item of items) {
      if (!item.subAccountId && !item.detailAccountId) {
        return NextResponse.json(
          { error: "هر ردیف باید دارای حساب معین یا تفصیلی باشد." },
          { status: 400 }
        )
      }
    }

    // محاسبه جمع سند
    const totalAmount = items.reduce((sum, item) =>
      sum + (parseFloat(item.debit) || 0) + (parseFloat(item.credit) || 0)
    , 0)

    // تولید شماره سند
    const lastVoucher = await prisma.voucher.findFirst({
      orderBy: { id: 'desc' }
    })

    const voucherNumber = `V${String((lastVoucher?.id || 0) + 1).padStart(5, '0')}`

    // تراکنش دیتابیس
    const result = await prisma.$transaction(async (prisma) => {
      // ایجاد سند
      const voucher = await prisma.voucher.create({
        data: {
          voucherNumber,
          voucherDate: parsedDate,
          description: description || "",
          totalAmount,
          items: {
            create: items.map(item => ({
              subAccountId: item.subAccountId ? parseInt(item.subAccountId) : null,
              detailAccountId: item.detailAccountId ? parseInt(item.detailAccountId) : null,
              personId: item.personId ? parseInt(item.personId) : null,
              description: item.description || "",
              debit: parseFloat(item.debit) || 0,
              credit: parseFloat(item.credit) || 0
            }))
          }
        },
        include: {
          items: {
            include: {
              subAccount: {
                include: {
                  category: true
                }
              },
              detailAccount: true,
              person: true
            }
          }
        }
      })

      // به‌روزرسانی موجودی حساب‌ها
      for (const item of items) {
        const balanceChange = (parseFloat(item.debit) || 0) - (parseFloat(item.credit) || 0)
        
        // به‌روزرسانی حساب معین
        if (item.subAccountId) {
          await prisma.subAccount.update({
            where: { id: parseInt(item.subAccountId) },
            data: {
              balance: { increment: balanceChange }
            }
          })
        }
        
        // به‌روزرسانی حساب تفصیلی (اگر وجود دارد)
        if (item.detailAccountId) {
          await prisma.detailAccount.update({
            where: { id: parseInt(item.detailAccountId) },
            data: {
              balance: { increment: balanceChange }
            }
          })
        }
      }

      return voucher
    })

    console.log('✅ سند با موفقیت ثبت شد:', result.voucherNumber)
    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json(
      { error: error.message || "خطای سرور در ثبت سند" },
      { status: 500 }
    )
  }
}