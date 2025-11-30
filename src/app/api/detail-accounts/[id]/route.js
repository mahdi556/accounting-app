// src/app/api/detail-accounts/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه حساب تفصیلی ارسال نشده است' },
        { status: 400 }
      )
    }

    const detailAccountId = parseInt(id)
    if (isNaN(detailAccountId)) {
      return NextResponse.json(
        { error: 'شناسه حساب تفصیلی باید عددی باشد' },
        { status: 400 }
      )
    }

    const detailAccount = await prisma.detailAccount.findUnique({
      where: { 
        id: detailAccountId
      },
      include: {
        subAccount: {
          include: {
            category: true
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
            },
            person: {
              select: {
                id: true,
                name: true,
                type: true
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

    if (!detailAccount) {
      return NextResponse.json(
        { error: 'حساب تفصیلی یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json(detailAccount)
  } catch (error) {
    console.error('Error in GET detail account API:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}