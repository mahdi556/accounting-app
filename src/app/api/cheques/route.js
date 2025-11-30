// src/app/api/cheques/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import { generateVoucherNumber } from '@lib/utils'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // ساخت شرط where بر اساس فیلترها
    const where = {}
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }

    // گرفتن چک‌ها با اطلاعات مرتبط
    const cheques = await prisma.cheque.findMany({
      where,
      include: {
        person: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        drawerAccount: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        payeeAccount: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        drawerDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            person: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        payeeDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            person: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        voucher: {
          select: {
            id: true,
            voucherNumber: true,
            voucherDate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // گرفتن تعداد کل برای pagination
    const total = await prisma.cheque.count({ where })
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      cheques,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error in GET /api/cheques:', error)
    return NextResponse.json(
      { error: `خطا در دریافت اطلاعات چک‌ها: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      chequeNumber, 
      bankName, 
      branchName, 
      amount, 
      issueDate, 
      dueDate,
      drawer, 
      payee, 
      type, 
      description, 
      personId,
      drawerAccountId, 
      payeeAccountId,
      drawerDetailAccountId, 
      payeeDetailAccountId
    } = body

    console.log('Creating new cheque:', {
      chequeNumber, type, amount, drawer, payee, personId
    })

    // اعتبارسنجی داده‌های اجباری
    if (!chequeNumber || !bankName || !amount || !issueDate || !dueDate || !drawer) {
      return NextResponse.json(
        { error: 'پر کردن فیلدهای ستاره‌دار الزامی است' },
        { status: 400 }
      )
    }

    // اعتبارسنجی نوع چک و حساب‌های مرتبط
    if (type === 'receivable') {
      if (!drawerAccountId && !drawerDetailAccountId) {
        return NextResponse.json(
          { error: 'برای چک دریافتنی، انتخاب حساب صادرکننده (معین یا تفصیلی) الزامی است' },
          { status: 400 }
        )
      }
    }

    if (type === 'payable') {
      if (!payeeAccountId && !payeeDetailAccountId) {
        return NextResponse.json(
          { error: 'برای چک پرداختنی، انتخاب حساب گیرنده (معین یا تفصیلی) الزامی است' },
          { status: 400 }
        )
      }
    }

    // بررسی تکراری نبودن شماره چک
    const existingCheque = await prisma.cheque.findFirst({
      where: {
        chequeNumber: chequeNumber.trim()
      }
    })

    if (existingCheque) {
      return NextResponse.json(
        { error: 'شماره چک تکراری است' },
        { status: 400 }
      )
    }

    // آماده کردن داده‌ها برای ایجاد
    const chequeData = {
      chequeNumber: chequeNumber.trim(),
      bankName: bankName.trim(),
      branchName: branchName?.trim() || null,
      amount: parseFloat(amount),
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      drawer: drawer.trim(),
      payee: payee?.trim() || null,
      type,
      description: description?.trim() || null,
      status: 'pending'
    }

    // اضافه کردن ارتباط‌ها اگر وجود دارند
    if (personId) {
      chequeData.person = {
        connect: { id: parseInt(personId) }
      }
    }

    if (drawerAccountId) {
      chequeData.drawerAccount = {
        connect: { id: parseInt(drawerAccountId) }
      }
    }

    if (payeeAccountId) {
      chequeData.payeeAccount = {
        connect: { id: parseInt(payeeAccountId) }
      }
    }

    if (drawerDetailAccountId) {
      chequeData.drawerDetailAccount = {
        connect: { id: parseInt(drawerDetailAccountId) }
      }
    }

    if (payeeDetailAccountId) {
      chequeData.payeeDetailAccount = {
        connect: { id: parseInt(payeeDetailAccountId) }
      }
    }

    // ایجاد چک و سند حسابداری در یک تراکنش
    const result = await prisma.$transaction(async (tx) => {
      // ایجاد چک
      const cheque = await tx.cheque.create({
        data: chequeData
      })

      // ایجاد سند حسابداری بر اساس نوع چک
      if (type === 'payable') {
        await createVoucherForPayableCheque(tx, cheque)
      } else if (type === 'receivable') {
        await createVoucherForReceivableCheque(tx, cheque)
      }

      return cheque
    })

    // گرفتن چک ایجاد شده با اطلاعات کامل
    const createdCheque = await prisma.cheque.findUnique({
      where: { id: result.id },
      include: {
        person: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        drawerAccount: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        payeeAccount: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        drawerDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            person: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        payeeDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            person: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        voucher: {
          select: {
            id: true,
            voucherNumber: true,
            voucherDate: true,
            description: true
          }
        }
      }
    })

    console.log('Cheque created successfully:', createdCheque.id)

    return NextResponse.json(createdCheque, { status: 201 })
  } catch (error) {
    console.error('Error creating cheque:', error)
    return NextResponse.json(
      { error: `خطا در ایجاد چک: ${error.message}` },
      { status: 500 }
    )
  }
}

// تابع کمکی برای ایجاد سند حسابداری برای چک پرداختنی
async function createVoucherForPayableCheque(tx, cheque) {
  try {
    // پیدا کردن آخرین شماره سند
    const lastVoucher = await tx.voucher.findFirst({
      orderBy: {
        id: 'desc'
      }
    })

    const voucherNumber = generateVoucherNumber(lastVoucher?.id || 0)

    // حساب چک‌های پرداختنی (بدهکار)
    const chequesPayableAccount = await tx.subAccount.findFirst({
      where: {
        code: '3-01-0001' // حساب چک‌های پرداختنی
      }
    })

    if (!chequesPayableAccount) {
      throw new Error('حساب چک‌های پرداختنی یافت نشد')
    }

    // تعیین حساب بستانکار - گیرنده چک (اولویت با حساب تفصیلی است)
    let creditAccount = null
    let creditDetailAccount = null
    let creditAccountName = ''

    if (cheque.payeeDetailAccountId) {
      // استفاده از حساب تفصیلی
      creditDetailAccount = await tx.detailAccount.findUnique({
        where: { id: cheque.payeeDetailAccountId },
        include: { 
          subAccount: true,
          person: true
        }
      })
      creditAccount = creditDetailAccount.subAccount
      creditAccountName = creditDetailAccount.name
    } else if (cheque.payeeAccountId) {
      // استفاده از حساب معین
      creditAccount = await tx.subAccount.findUnique({
        where: { id: cheque.payeeAccountId },
        include: { category: true }
      })
      creditAccountName = creditAccount.name
    }

    if (!creditAccount) {
      throw new Error('حساب گیرنده یافت نشد')
    }

    // ایجاد سند
    const voucher = await tx.voucher.create({
      data: {
        voucherNumber,
        voucherDate: new Date(),
        description: `ثبت چک پرداختنی شماره ${cheque.chequeNumber} - ${cheque.bankName}`,
        totalAmount: cheque.amount,
        createdBy: 1 // TODO: از کاربر واقعی استفاده شود
      }
    })

    // ایجاد ردیف‌های سند

    // ردیف بدهکار (چک‌های پرداختنی)
    await tx.voucherItem.create({
      data: {
        voucherId: voucher.id,
        subAccountId: chequesPayableAccount.id,
        description: `چک پرداختنی شماره ${cheque.chequeNumber}`,
        debit: cheque.amount,
        credit: 0
      }
    })

    // ردیف بستانکار - با اولویت حساب تفصیلی
    const creditItemData = {
      voucherId: voucher.id,
      subAccountId: creditAccount.id,
      description: `بابت چک پرداختنی شماره ${cheque.chequeNumber}`,
      debit: 0,
      credit: cheque.amount
    }

    // اگر حساب تفصیلی داشتیم، آن را به ردیف سند اضافه می‌کنیم
    if (creditDetailAccount) {
      creditItemData.detailAccountId = creditDetailAccount.id
      
      // اگر حساب تفصیلی به شخصی متصل است، شخص را هم اضافه می‌کنیم
      if (creditDetailAccount.person) {
        creditItemData.personId = creditDetailAccount.person.id
      }
    }

    await tx.voucherItem.create({
      data: creditItemData
    })

    // اتصال سند به چک
    await tx.cheque.update({
      where: { id: cheque.id },
      data: { 
        voucher: {
          connect: { id: voucher.id }
        }
      }
    })

    // به‌روزرسانی مانده حساب‌ها
    await updateAccountBalancesForPayable(tx, chequesPayableAccount.id, creditAccount.id, cheque.amount, creditDetailAccount?.id)

    console.log('Voucher created for payable cheque:', {
      voucherNumber,
      debitAccount: chequesPayableAccount.code,
      creditAccount: creditDetailAccount ? creditDetailAccount.code : creditAccount.code,
      amount: cheque.amount
    })

    return voucher
  } catch (error) {
    console.error('Error creating voucher for payable cheque:', error)
    throw error
  }
}

// تابع کمکی برای ایجاد سند حسابداری برای چک دریافتنی
async function createVoucherForReceivableCheque(tx, cheque) {
  try {
    // پیدا کردن آخرین شماره سند
    const lastVoucher = await tx.voucher.findFirst({
      orderBy: {
        id: 'desc'
      }
    })

    const voucherNumber = generateVoucherNumber(lastVoucher?.id || 0)

    // حساب چک‌های دریافتنی (بستانکار) - با کد جدید
    const chequesReceivableAccount = await tx.subAccount.findFirst({
      where: {
        code: '1-02-0001' // حساب چک‌های دریافتنی - کد اصلاح شده
      }
    })

    if (!chequesReceivableAccount) {
      throw new Error('حساب چک‌های دریافتنی یافت نشد')
    }

    // تعیین حساب بدهکار - صادرکننده چک (اولویت با حساب تفصیلی است)
    let debitAccount = null
    let debitDetailAccount = null
    let debitAccountName = ''

    if (cheque.drawerDetailAccountId) {
      // استفاده از حساب تفصیلی
      debitDetailAccount = await tx.detailAccount.findUnique({
        where: { id: cheque.drawerDetailAccountId },
        include: { 
          subAccount: true,
          person: true
        }
      })
      debitAccount = debitDetailAccount.subAccount
      debitAccountName = debitDetailAccount.name
    } else if (cheque.drawerAccountId) {
      // استفاده از حساب معین
      debitAccount = await tx.subAccount.findUnique({
        where: { id: cheque.drawerAccountId },
        include: { category: true }
      })
      debitAccountName = debitAccount.name
    }

    if (!debitAccount) {
      throw new Error('حساب صادرکننده یافت نشد')
    }

    // ایجاد سند
    const voucher = await tx.voucher.create({
      data: {
        voucherNumber,
        voucherDate: new Date(),
        description: `ثبت چک دریافتنی شماره ${cheque.chequeNumber} - ${cheque.bankName}`,
        totalAmount: cheque.amount,
        createdBy: 1 // TODO: از کاربر واقعی استفاده شود
      }
    })

    // ایجاد ردیف‌های سند

    // ردیف بدهکار - صادرکننده چک (با اولویت حساب تفصیلی)
    const debitItemData = {
      voucherId: voucher.id,
      subAccountId: debitAccount.id,
      description: `چک دریافتنی شماره ${cheque.chequeNumber} - ${cheque.drawer}`,
      debit: cheque.amount,
      credit: 0
    }

    // اگر حساب تفصیلی داشتیم، آن را به ردیف سند اضافه می‌کنیم
    if (debitDetailAccount) {
      debitItemData.detailAccountId = debitDetailAccount.id
      
      // اگر حساب تفصیلی به شخصی متصل است، شخص را هم اضافه می‌کنیم
      if (debitDetailAccount.person) {
        debitItemData.personId = debitDetailAccount.person.id
      }
    }

    await tx.voucherItem.create({
      data: debitItemData
    })

    // ردیف بستانکار (چک‌های دریافتنی)
    await tx.voucherItem.create({
      data: {
        voucherId: voucher.id,
        subAccountId: chequesReceivableAccount.id,
        description: `بابت چک دریافتنی شماره ${cheque.chequeNumber}`,
        debit: 0,
        credit: cheque.amount
      }
    })

    // اتصال سند به چک
    await tx.cheque.update({
      where: { id: cheque.id },
      data: { 
        voucher: {
          connect: { id: voucher.id }
        }
      }
    })

    // به‌روزرسانی مانده حساب‌ها
    await updateAccountBalancesForReceivable(tx, debitAccount.id, chequesReceivableAccount.id, cheque.amount, debitDetailAccount?.id)

    console.log('Voucher created for receivable cheque:', {
      voucherNumber,
      debitAccount: debitDetailAccount ? debitDetailAccount.code : debitAccount.code,
      creditAccount: chequesReceivableAccount.code,
      amount: cheque.amount
    })

    return voucher
  } catch (error) {
    console.error('Error creating voucher for receivable cheque:', error)
    throw error
  }
}

// تابع کمکی برای به‌روزرسانی مانده حساب‌های چک پرداختنی
async function updateAccountBalancesForPayable(tx, debitAccountId, creditAccountId, amount, creditDetailAccountId = null) {
  // افزایش مانده حساب بدهکار (چک‌های پرداختنی)
  await tx.subAccount.update({
    where: { id: debitAccountId },
    data: {
      balance: {
        increment: amount
      }
    }
  })

  // کاهش مانده حساب معین بستانکار
  await tx.subAccount.update({
    where: { id: creditAccountId },
    data: {
      balance: {
        decrement: amount
      }
    }
  })

  // اگر حساب تفصیلی داشتیم، مانده آن را هم به‌روزرسانی کنیم
  if (creditDetailAccountId) {
    await tx.detailAccount.update({
      where: { id: creditDetailAccountId },
      data: {
        balance: {
          decrement: amount
        }
      }
    })
  }
}

// تابع کمکی برای به‌روزرسانی مانده حساب‌های چک دریافتنی
async function updateAccountBalancesForReceivable(tx, debitAccountId, creditAccountId, amount, debitDetailAccountId = null) {
  // افزایش مانده حساب بدهکار (صادرکننده چک)
  await tx.subAccount.update({
    where: { id: debitAccountId },
    data: {
      balance: {
        increment: amount
      }
    }
  })

  // افزایش مانده حساب تفصیلی بدهکار (اگر وجود دارد)
  if (debitDetailAccountId) {
    await tx.detailAccount.update({
      where: { id: debitDetailAccountId },
      data: {
        balance: {
          increment: amount
        }
      }
    })
  }

  // افزایش مانده حساب بستانکار (چک‌های دریافتنی)
  await tx.subAccount.update({
    where: { id: creditAccountId },
    data: {
      balance: {
        increment: amount
      }
    }
  })
}

// تابع برای به‌روزرسانی وضعیت چک
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه چک ارسال نشده است' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, description } = body

    if (!status) {
      return NextResponse.json(
        { error: 'وضعیت جدید ارسال نشده است' },
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

    // بررسی وجود چک
    const existingCheque = await prisma.cheque.findUnique({
      where: { id: chequeId }
    })

    if (!existingCheque) {
      return NextResponse.json(
        { error: 'چک یافت نشد' },
        { status: 404 }
      )
    }

    // به‌روزرسانی وضعیت چک
    const updatedCheque = await prisma.cheque.update({
      where: { id: chequeId },
      data: {
        status,
        description: description || existingCheque.description,
        updatedAt: new Date()
      },
      include: {
        person: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        drawerAccount: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        payeeAccount: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        drawerDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            person: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        payeeDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            person: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        voucher: {
          select: {
            id: true,
            voucherNumber: true,
            voucherDate: true
          }
        }
      }
    })

    console.log('Cheque status updated:', { id: chequeId, status })

    return NextResponse.json(updatedCheque)
  } catch (error) {
    console.error('Error updating cheque status:', error)
    return NextResponse.json(
      { error: `خطا در به‌روزرسانی وضعیت چک: ${error.message}` },
      { status: 500 }
    )
  }
}