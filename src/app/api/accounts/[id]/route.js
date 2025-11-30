// src/app/api/accounts/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request, { params }) {
  try {
    // استفاده از await برای params در App Router جدید
    const { id } = await params
    console.log('Received account ID from params:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه حساب ارسال نشده است' },
        { status: 400 }
      )
    }

    const accountId = parseInt(id)
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'شناسه حساب باید عددی باشد' },
        { status: 400 }
      )
    }

    console.log('Searching for account with ID:', accountId)

    const account = await prisma.subAccount.findUnique({
      where: { 
        id: accountId
      },
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true
          }
        },
        voucherItems: {
          include: {
            voucher: {
              select: {
                id: true,
                voucherNumber: true,
                voucherDate: true,
                description: true
              }
            }
          },
          orderBy: {
            voucher: {
              voucherDate: 'desc'
            }
          }
        }
      }
    })

    console.log('Query result:', account)

    if (!account) {
      return NextResponse.json(
        { error: 'حساب یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error in GET account API:', error)
    return NextResponse.json(
      { error: `خطای سرور: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه حساب ارسال نشده است' },
        { status: 400 }
      )
    }

    const accountId = parseInt(id)
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'شناسه حساب باید عددی باشد' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { code, name, categoryId } = body

    if (!code || !name || !categoryId) {
      return NextResponse.json(
        { error: 'کد، نام و حساب کل الزامی هستند' },
        { status: 400 }
      )
    }

    const account = await prisma.subAccount.update({
      where: { id: accountId },
      data: {
        code: code.trim(),
        name: name.trim(),
        categoryId: parseInt(categoryId)
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه حساب ارسال نشده است' },
        { status: 400 }
      )
    }

    const accountId = parseInt(id)
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'شناسه حساب باید عددی باشد' },
        { status: 400 }
      )
    }

    // بررسی وجود تراکنش‌های مرتبط
    const relatedItems = await prisma.voucherItem.count({
      where: { subAccountId: accountId }
    })

    if (relatedItems > 0) {
      return NextResponse.json(
        { error: 'امکان حذف حساب به دلیل وجود تراکنش‌های مرتبط وجود ندارد' },
        { status: 400 }
      )
    }

    await prisma.subAccount.delete({
      where: { id: accountId }
    })

    return NextResponse.json({ message: 'حساب حذف شد' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}