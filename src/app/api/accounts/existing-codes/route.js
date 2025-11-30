// src/app/api/accounts/existing-codes/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const parentCode = searchParams.get('parentCode')
    const accountType = searchParams.get('accountType')

    let existingCodes = []

    if (accountType === 'category' && parentCode) {
      // حساب‌های کل فرزند یک حساب کل والد
      existingCodes = await prisma.accountCategory.findMany({
        where: {
          code: {
            startsWith: parentCode + '-'
          }
        },
        select: {
          code: true
        },
        orderBy: {
          code: 'asc'
        }
      })
    } else if (accountType === 'subAccount' && parentCode) {
      // حساب‌های معین فرزند یک حساب کل
      existingCodes = await prisma.subAccount.findMany({
        where: {
          code: {
            startsWith: parentCode + '-'
          }
        },
        select: {
          code: true
        },
        orderBy: {
          code: 'asc'
        }
      })
    } else if (accountType === 'detailAccount' && parentCode) {
      // حساب‌های تفصیلی فرزند یک حساب معین
      existingCodes = await prisma.detailAccount.findMany({
        where: {
          code: {
            startsWith: parentCode + '-'
          }
        },
        select: {
          code: true
        },
        orderBy: {
          code: 'asc'
        }
      })
    }

    const codes = existingCodes.map(item => item.code)
    
    return NextResponse.json({ codes })
  } catch (error) {
    console.error('Error in GET /api/accounts/existing-codes:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}