// src/app/api/banks/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    console.log('Received bank ID from params:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه حساب بانکی ارسال نشده است' },
        { status: 400 }
      )
    }

    const bankId = parseInt(id)
    if (isNaN(bankId)) {
      return NextResponse.json(
        { error: 'شناسه حساب بانکی باید عددی باشد' },
        { status: 400 }
      )
    }

    console.log('Searching for bank with ID:', bankId)

    const bank = await prisma.bank.findUnique({
      where: { 
        id: bankId
      }
    })

    console.log('Query result:', bank)

    if (!bank) {
      return NextResponse.json(
        { error: 'حساب بانکی یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json(bank)
  } catch (error) {
    console.error('Error in GET bank API:', error)
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
        { error: 'شناسه حساب بانکی ارسال نشده است' },
        { status: 400 }
      )
    }

    const bankId = parseInt(id)
    if (isNaN(bankId)) {
      return NextResponse.json(
        { error: 'شناسه حساب بانکی باید عددی باشد' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, accountNumber, balance } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'نام حساب بانکی الزامی است' },
        { status: 400 }
      )
    }

    const bank = await prisma.bank.update({
      where: { id: bankId },
      data: {
        name: name.trim(),
        accountNumber: accountNumber?.trim() || null,
        balance: parseFloat(balance) || 0
      }
    })

    return NextResponse.json(bank)
  } catch (error) {
    console.error('Error updating bank:', error)
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
        { error: 'شناسه حساب بانکی ارسال نشده است' },
        { status: 400 }
      )
    }

    const bankId = parseInt(id)
    if (isNaN(bankId)) {
      return NextResponse.json(
        { error: 'شناسه حساب بانکی باید عددی باشد' },
        { status: 400 }
      )
    }

    await prisma.bank.delete({
      where: { id: bankId }
    })

    return NextResponse.json({ message: 'حساب بانکی حذف شد' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}