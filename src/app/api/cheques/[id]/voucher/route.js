// src/app/api/cheques/[id]/voucher/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه چک ارسال نشده است' },
        { status: 400 }
      )
    }

    const chequeId = parseInt(id)
    if (isNaN(chequeId)) {
      return NextResponse.json(
        { error: 'شناسه چک باید عددی باشد' },
        { status: 400 }
      )
    }

    // پیدا کردن چک و سند مرتبط
    const cheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
      include: {
        voucher: {
          include: {
            items: {
              include: {
                subAccount: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                },
                detailAccount: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                },
                person: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!cheque) {
      return NextResponse.json(
        { error: 'چک یافت نشد' },
        { status: 404 }
      )
    }

    if (!cheque.voucher) {
      return NextResponse.json(
        { error: 'برای این چک سندی صادر نشده است' },
        { status: 404 }
      )
    }

    return NextResponse.json(cheque.voucher)
  } catch (error) {
    console.error('Error fetching cheque voucher:', error)
    return NextResponse.json(
      { error: `خطا در دریافت اطلاعات سند: ${error.message}` },
      { status: 500 }
    )
  }
}