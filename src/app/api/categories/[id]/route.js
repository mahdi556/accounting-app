// src/app/api/categories/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request, { params }) {
  try {
    const { id } = params

    const category = await prisma.accountCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        subAccounts: true,
        children: true,
        parent: true
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'حساب کل یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { code, name, type, parentId } = body

    const category = await prisma.accountCategory.update({
      where: { id: parseInt(id) },
      data: {
        code,
        name,
        type,
        parentId: parentId ? parseInt(parentId) : null
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // بررسی وجود حساب‌های معین وابسته
    const subAccounts = await prisma.subAccount.count({
      where: { categoryId: parseInt(id) }
    })

    if (subAccounts > 0) {
      return NextResponse.json(
        { error: 'امکان حذف حساب کل به دلیل وجود حساب‌های معین وابسته وجود ندارد' },
        { status: 400 }
      )
    }

    await prisma.accountCategory.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: 'حساب کل حذف شد' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}