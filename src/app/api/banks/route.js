// src/app/api/banks/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

export async function GET() {
  try {
    const banks = await prisma.bank.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(banks)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, accountNumber, balance } = body

    const bank = await prisma.bank.create({
      data: {
        name,
        accountNumber,
        balance: parseFloat(balance) || 0
      }
    })

    return NextResponse.json(bank, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}