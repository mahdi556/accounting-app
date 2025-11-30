// src/app/api/categories/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.accountCategory.findMany({
      include: {
        children: {
          include: {
            children: true,
            subAccounts: true
          }
        },
        subAccounts: {
          include: {
            voucherItems: true
          }
        },
        parent: true
      },
      orderBy: [
        { code: 'asc' }
      ]
    })

    // محاسبه موجودی برای هر حساب معین
    const categoriesWithBalance = categories.map(category => {
      const subAccountsWithBalance = category.subAccounts.map(subAccount => {
        const balance = subAccount.voucherItems.reduce((sum, item) => {
          return sum + (item.debit - item.credit)
        }, 0)
        
        return {
          ...subAccount,
          balance
        }
      })

      return {
        ...category,
        subAccounts: subAccountsWithBalance
      }
    })

    return NextResponse.json(categoriesWithBalance)
  } catch (error) {
    console.error('Error in GET /api/categories:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { code, name, type, parentId } = body

    // بررسی تکراری نبودن کد
    const existingCategory = await prisma.accountCategory.findFirst({
      where: {
        code: code.trim()
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'حساب کل با این کد قبلاً ثبت شده است' },
        { status: 400 }
      )
    }

    const category = await prisma.accountCategory.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        type,
        parentId: parentId ? parseInt(parentId) : null
      },
      include: {
        children: true,
        parent: true,
        subAccounts: true
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}