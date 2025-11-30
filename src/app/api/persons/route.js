// src/app/api/persons/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET() {
  try {
    console.log('Fetching persons from database...')
    
    const persons = await prisma.person.findMany({
      include: {
        detailAccount: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('Found persons:', persons.length)
    
    return NextResponse.json(persons)
  } catch (error) {
    console.error('Error in GET /api/persons:', error)
    return NextResponse.json(
      { error: `خطا در دریافت اطلاعات اشخاص: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, type, phone, address, email } = body

    console.log('Creating new person:', { name, type })

    // اعتبارسنجی داده‌ها
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'نام شخص الزامی است' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: 'نوع شخص الزامی است' },
        { status: 400 }
      )
    }

    // بررسی تکراری نبودن نام
    const existingPerson = await prisma.person.findFirst({
      where: {
        name: name.trim()
      }
    })

    if (existingPerson) {
      return NextResponse.json(
        { error: 'شخص دیگری با این نام وجود دارد' },
        { status: 400 }
      )
    }

    // پیدا کردن حساب معین والد (1-03-0001) - مشتریان
    const parentSubAccount = await prisma.subAccount.findFirst({
      where: {
        code: '1-03-0001'
      }
    })

    if (!parentSubAccount) {
      return NextResponse.json(
        { error: 'حساب معین مشتریان (1-03-0001) یافت نشد. لطفاً ابتدا حساب معین مشتریان را ایجاد کنید.' },
        { status: 400 }
      )
    }

    // پیدا کردن آخرین کد حساب تفصیلی تحت این حساب معین
    const lastDetailAccount = await prisma.detailAccount.findFirst({
      where: {
        code: {
          startsWith: '1-03-0001-'
        }
      },
      orderBy: {
        code: 'desc'
      }
    })

    // تولید کد جدید برای حساب تفصیلی
    let nextCode = '1-03-0001-01'
    if (lastDetailAccount) {
      const lastCode = lastDetailAccount.code
      const parts = lastCode.split('-')
      if (parts.length === 4) {
        const lastNumber = parseInt(parts[3])
        if (!isNaN(lastNumber)) {
          const nextNumber = lastNumber + 1
          nextCode = `1-03-0001-${nextNumber.toString().padStart(2, '0')}`
        }
      }
    }

    console.log('Generated detail account code:', nextCode)

    // ایجاد شخص و حساب تفصیلی مرتبط در یک تراکنش
    const result = await prisma.$transaction(async (tx) => {
      // ایجاد حساب تفصیلی
      const detailAccount = await tx.detailAccount.create({
        data: {
          code: nextCode,
          name: name.trim(),
          subAccountId: parentSubAccount.id,
          balance: 0
        }
      })

      // ایجاد شخص با ارتباط به حساب تفصیلی
      const person = await tx.person.create({
        data: {
          name: name.trim(),
          type,
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          email: email?.trim() || null,
          detailAccountId: detailAccount.id
        },
        include: {
          detailAccount: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      })

      return person
    })

    console.log('Person and detail account created successfully:', {
      personId: result.id,
      detailAccountCode: result.detailAccount.code,
      personName: result.name
    })
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating person:', error)
    return NextResponse.json(
      { error: `خطا در ایجاد شخص: ${error.message}` },
      { status: 500 }
    )
  }
}