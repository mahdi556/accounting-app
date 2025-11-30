// src/app/api/vouchers/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    console.log('Received voucher ID from params:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه سند ارسال نشده است' },
        { status: 400 }
      )
    }

    const voucherId = parseInt(id)
    if (isNaN(voucherId)) {
      return NextResponse.json(
        { error: 'شناسه سند باید عددی باشد' },
        { status: 400 }
      )
    }

    console.log('Searching for voucher with ID:', voucherId)

    const voucher = await prisma.voucher.findUnique({
      where: { 
        id: voucherId
      },
      include: {
        items: {
          include: {
            subAccount: true,
            person: true
          }
        }
      }
    })

    console.log('Query result:', voucher)

    if (!voucher) {
      return NextResponse.json(
        { error: 'سند یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json(voucher)
  } catch (error) {
    console.error('Error in GET voucher API:', error)
    return NextResponse.json(
      { error: `خطای سرور: ${error.message}` },
      { status: 500 }
    )
  }
}