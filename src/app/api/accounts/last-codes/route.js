// src/app/api/accounts/last-codes/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request) {
  try {
    // آخرین کد حساب کل
    const lastCategory = await prisma.accountCategory.findFirst({
      orderBy: {
        code: 'desc'
      },
      select: {
        code: true
      }
    })

    // آخرین کد حساب معین
    const lastSubAccount = await prisma.subAccount.findFirst({
      orderBy: {
        code: 'desc'
      },
      select: {
        code: true
      }
    })

    // آخرین کد حساب تفصیلی
    const lastDetailAccount = await prisma.detailAccount.findFirst({
      orderBy: {
        code: 'desc'
      },
      select: {
        code: true
      }
    })

    const lastCodes = {
      category: lastCategory?.code || '0',
      subAccount: lastSubAccount?.code || '0',
      detailAccount: lastDetailAccount?.code || '0'
    }

    return NextResponse.json(lastCodes)
  } catch (error) {
    console.error('Error in GET /api/accounts/last-codes:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}