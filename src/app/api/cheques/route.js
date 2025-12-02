// src/app/api/cheques/route.js - نسخه کامل اصلاح شده و نهایی
import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
// فرض می‌کنیم تابع generateVoucherNumber و سایر ابزارهای مورد نیاز وجود دارند
import { generateVoucherNumber } from '@lib/utils' 

// =================================================================
// 💰 GET: دریافت لیست چک‌ها
// =================================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = {}
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }

    const cheques = await prisma.cheque.findMany({
      where,
      include: {
        person: { select: { id: true, name: true, type: true } },
        drawerAccount: { select: { id: true, code: true, name: true } },
        payeeAccount: { select: { id: true, code: true, name: true } },
        drawerDetailAccount: { select: { id: true, code: true, name: true, person: { select: { id: true, name: true } } } },
        payeeDetailAccount: { select: { id: true, code: true, name: true, person: { select: { id: true, name: true } } } },
        expenseDetailAccount: { select: { id: true, code: true, name: true, subAccount: true } }, 
        bankDetailAccount: { select: { id: true, code: true, name: true } }, 
        voucher: { select: { id: true, voucherNumber: true, voucherDate: true } }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const total = await prisma.cheque.count({ where })
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      cheques,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    })
  } catch (error) {
    console.error('Error in GET /api/cheques:', error)
    return NextResponse.json(
      { error: `خطا در دریافت اطلاعات چک‌ها: ${error.message}` },
      { status: 500 }
    )
  }
}

// =================================================================
// ✍️ POST: ایجاد چک و سند حسابداری
// =================================================================
export async function POST(request) {
  try {
    const body = await request.json()
    console.log('📥 دریافت داده‌های چک:', body)

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
      payeeDetailAccountId,
      bankDetailAccountId, // حساب بانک برای چک‌های پرداختنی
      issueReason, // 'settlement' یا 'expense'
      expenseDetailAccountId // حساب تفصیلی هزینه/خرید برای حالت expense
    } = body

    // اعتبارسنجی داده‌های اجباری پایه
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
      
      if (!bankDetailAccountId) {
         return NextResponse.json(
          { error: 'برای چک پرداختنی، انتخاب حساب بانک برای پیگیری الزامی است' },
          { status: 400 }
        )
      }

      // اعتبارسنجی حساب هزینه/خرید برای حالت expense
      if (issueReason === 'expense' && !expenseDetailAccountId) {
        return NextResponse.json(
          { error: 'برای صدور چک بابت هزینه/خرید، انتخاب حساب تفصیلی هزینه/خرید الزامی است' },
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
      status: 'pending',
      issueReason: issueReason || 'settlement'
    }

    // اضافه کردن ارتباط‌ها
    if (personId) chequeData.person = { connect: { id: parseInt(personId) } }
    if (drawerAccountId) chequeData.drawerAccount = { connect: { id: parseInt(drawerAccountId) } }
    if (payeeAccountId) chequeData.payeeAccount = { connect: { id: parseInt(payeeAccountId) } }
    if (drawerDetailAccountId) chequeData.drawerDetailAccount = { connect: { id: parseInt(drawerDetailAccountId) } }
    if (payeeDetailAccountId) chequeData.payeeDetailAccount = { connect: { id: parseInt(payeeDetailAccountId) } }
    if (bankDetailAccountId) chequeData.bankDetailAccount = { connect: { id: parseInt(bankDetailAccountId) } }
    if (expenseDetailAccountId) chequeData.expenseDetailAccount = { connect: { id: parseInt(expenseDetailAccountId) } } 

    // ایجاد چک و سند حسابداری در یک تراکنش
    const result = await prisma.$transaction(async (tx) => {
      // ایجاد چک
      const cheque = await tx.cheque.create({ data: chequeData })

      console.log(`✅ چک ایجاد شد: ${cheque.id}`)

      // ایجاد سند حسابداری بر اساس نوع چک
      if (type === 'payable') {
        await createVoucherForPayableCheque(tx, cheque, issueReason)
      } else if (type === 'receivable') {
        await createVoucherForReceivableCheque(tx, cheque)
      }

      return cheque
    })

    // گرفتن چک ایجاد شده با اطلاعات کامل
    const createdCheque = await prisma.cheque.findUnique({
      where: { id: result.id },
      include: {
        person: { select: { id: true, name: true, type: true } },
        drawerAccount: { select: { id: true, code: true, name: true } },
        payeeAccount: { select: { id: true, code: true, name: true } },
        drawerDetailAccount: { select: { id: true, code: true, name: true, person: { select: { id: true, name: true } } } },
        payeeDetailAccount: { select: { id: true, code: true, name: true, person: { select: { id: true, name: true } } } },
        expenseDetailAccount: { select: { id: true, code: true, name: true, subAccount: true } }, 
        bankDetailAccount: { select: { id: true, code: true, name: true } },
        voucher: { select: { id: true, voucherNumber: true, voucherDate: true, description: true } }
      }
    })

    console.log('✅ چک با موفقیت ثبت شد:', createdCheque.id)

    return NextResponse.json(createdCheque, { status: 201 })
  } catch (error) {
    console.error('❌ خطا در ایجاد چک:', error)
    return NextResponse.json(
      { error: `خطا در ایجاد چک: ${error.message}` },
      { status: 500 }
    )
  }
}

// =================================================================
// 🏦 تابع کمکی برای ایجاد سند چک پرداختنی (شامل منطق ۴ ردیفی)
// =================================================================
async function createVoucherForPayableCheque(tx, cheque, issueReason) {
  try {
    console.log(`🏦 شروع ایجاد سند برای چک پرداختنی: ${cheque.chequeNumber}`);

    // --- اطلاعات پایه ---
    const lastVoucher = await tx.voucher.findFirst({ orderBy: { id: 'desc' } });
    const voucherNumber = generateVoucherNumber(lastVoucher?.id || 0);

    // ۱. حساب چک‌های پرداختنی (3-01-0001)
    const chequesPayableAccount = await tx.subAccount.findFirst({
      where: { code: '3-01-0001' }
    });
    if (!chequesPayableAccount) {
      throw new Error('حساب چک‌های پرداختنی یافت نشد.');
    }

    // ۲. حساب گیرنده (واسط - معمولاً بستانکاران تجاری)
    let payeeAccount = null;
    let payeeDetailAccount = null;

    if (cheque.payeeDetailAccountId) {
      payeeDetailAccount = await tx.detailAccount.findUnique({
        where: { id: cheque.payeeDetailAccountId },
        include: { subAccount: true, person: true }
      });
      if (!payeeDetailAccount) throw new Error('حساب تفصیلی گیرنده یافت نشد');
      payeeAccount = payeeDetailAccount.subAccount;
    } else if (cheque.payeeAccountId) {
      payeeAccount = await tx.subAccount.findUnique({
        where: { id: cheque.payeeAccountId },
        include: { category: true }
      });
      if (!payeeAccount) throw new Error('حساب معین گیرنده یافت نشد');
    }
    if (!payeeAccount) throw new Error('حساب گیرنده یافت نشد');
    
    console.log(`👤 حساب گیرنده (واسط بستانکار): ${payeeAccount.code} - ${payeeAccount.name}`);


    // ۳. حساب هزینه/خرید (فقط در صورت issueReason === 'expense')
    let expenseAccount = null;
    let expenseDetailAccount = null;
    let isExpenseOrInventory = false;
    
    if (issueReason === 'expense' && cheque.expenseDetailAccountId) {
      expenseDetailAccount = await tx.detailAccount.findUnique({
        where: { id: cheque.expenseDetailAccountId },
        include: { subAccount: true, person: true }
      });
      
      if (!expenseDetailAccount) throw new Error('حساب تفصیلی هزینه/خرید یافت نشد.');
      
      expenseAccount = expenseDetailAccount.subAccount;
      console.log(`💰 حساب هزینه/خرید (بدهکار اصلی): ${expenseDetailAccount.code} - ${expenseDetailAccount.name}`);
      
      // تشخیص نوع حساب برای شرح
      if (expenseDetailAccount.code.startsWith('6') || expenseDetailAccount.code.startsWith('1-04')) {
        isExpenseOrInventory = true;
      }
    }

    // --- ایجاد سند ---
    const voucher = await tx.voucher.create({
      data: {
        voucherNumber,
        voucherDate: new Date(),
        description: `صدور چک پرداختنی شماره ${cheque.chequeNumber} - ${cheque.bankName} - ${cheque.payee || 'گیرنده'}`,
        totalAmount: cheque.amount,
        createdBy: 1
      }
    });

    console.log(`✅ سند ایجاد شد: ${voucherNumber}`);

    // --- منطق ایجاد ردیف‌های سند ---
    if (issueReason === 'expense' && isExpenseOrInventory && expenseAccount) {
      // 🎯 حالت ۱: چک برای هزینه جدید یا خرید موجودی کالا (۴ ردیف سند)
      console.log(`💳 ایجاد سند ۴ ردیفی برای چک هزینه/خرید`);
      
      await createFourLineVoucherItems(
        tx, 
        voucher, 
        cheque, 
        payeeAccount,
        payeeDetailAccount,
        chequesPayableAccount,
        expenseAccount,       // حساب معین هزینه/خرید
        expenseDetailAccount  // حساب تفصیلی هزینه/خرید
      );

    } else {
      // حالت ۲: چک برای تسویه بدهی معمولی (۲ ردیف سند)
      console.log('💳 ایجاد سند برای چک تسویه بدهی (۲ ردیف)');
      
      await createSettlementVoucherItems(tx, voucher, cheque, payeeAccount, payeeDetailAccount, chequesPayableAccount);
    }

    // اتصال سند به چک
    await tx.cheque.update({
      where: { id: cheque.id },
      data: { voucher: { connect: { id: voucher.id } } }
    });

    console.log(`✅ سند ${voucherNumber} با موفقیت ایجاد و به چک متصل شد`);

    return voucher;

  } catch (error) {
    console.error('❌ خطا در ایجاد سند برای چک پرداختنی:', error);
    throw error;
  }
}


// =================================================================
// 📝 تابع کمکی برای ایجاد ۴ ردیف سند (منطق اصلی)
// =================================================================
async function createFourLineVoucherItems(
  tx, 
  voucher, 
  cheque, 
  payeeAccount,         // حساب معین واسط (بستانکاران تجاری)
  payeeDetailAccount,   // حساب تفصیلی واسط (شخص گیرنده)
  chequesPayableAccount,
  expenseAccount,       // حساب معین هزینه/خرید (بدهکار اصلی)
  expenseDetailAccount  // حساب تفصیلی هزینه/خرید (بدهکار اصلی)
) {
  // اطلاعات حساب‌های واسط (شخص گیرنده/بستانکاران تجاری)
  const payeeSubAccountId = payeeAccount.id;
  const payeeDetailId = payeeDetailAccount?.id || null;
  const payeePersonId = payeeDetailAccount?.person?.id || null;

  // اطلاعات حساب بدهکار اصلی (هزینه/خرید)
  const expenseSubAccountId = expenseAccount.id;
  const expenseDetailId = expenseDetailAccount?.id || null;
  
  const expenseLabel = expenseDetailAccount?.code?.startsWith('6') ? 'هزینه' : 'موجودی کالا';
  
  console.log(`*** سند 4 ردیفی: بدهکار (${expenseLabel}) -> بستانکار (شخص) | بدهکار (شخص) -> بستانکار (چک) ***`);
  
  // --- ردیف ۱: بدهکار کردن حساب هزینه/خرید (ایجاد هزینه/خرید) ---
  await tx.voucherItem.create({
    data: {
      voucherId: voucher.id,
      subAccountId: expenseSubAccountId,
      detailAccountId: expenseDetailId,
      description: `۱. بدهکار: ثبت ${expenseLabel} بابت چک شماره ${cheque.chequeNumber}`,
      debit: cheque.amount,
      credit: 0
    }
  });
  console.log(`📝 ردیف ۱ - بدهکار ${expenseLabel}: ${cheque.amount} ریال`);

  // --- ردیف ۲: بستانکار کردن حساب طرف مقابل (ایجاد بدهی به شخص) ---
  await tx.voucherItem.create({
    data: {
      voucherId: voucher.id,
      subAccountId: payeeSubAccountId,
      detailAccountId: payeeDetailId,
      personId: payeePersonId,
      description: `۲. بستانکار: بدهی به ${cheque.payee} بابت ${expenseLabel}`,
      debit: 0,
      credit: cheque.amount
    }
  });
  console.log(`📝 ردیف ۲ - بستانکار طرف مقابل: ${cheque.amount} ریال`);

  // --- ردیف ۳: بدهکار کردن حساب طرف مقابل (تسویه بدهی ایجاد شده در ردیف ۲) ---
  await tx.voucherItem.create({
    data: {
      voucherId: voucher.id,
      subAccountId: payeeSubAccountId,
      detailAccountId: payeeDetailId,
      personId: payeePersonId,
      description: `۳. بدهکار: تسویه بدهی ${cheque.payee} با چک شماره ${cheque.chequeNumber}`,
      debit: cheque.amount,
      credit: 0
    }
  });
  console.log(`📝 ردیف ۳ - بدهکار طرف مقابل: ${cheque.amount} ریال`);

  // --- ردیف ۴: بستانکار کردن حساب چک‌های پرداختنی (ثبت چک) ---
  await tx.voucherItem.create({
    data: {
      voucherId: voucher.id,
      subAccountId: chequesPayableAccount.id,
      description: `۴. بستانکار: صدور چک پرداختنی شماره ${cheque.chequeNumber}`,
      debit: 0,
      credit: cheque.amount
    }
  });
  console.log(`📝 ردیف ۴ - بستانکار چک: ${cheque.amount} ریال`);

  // به‌روزرسانی مانده حساب‌ها
  await updateFourLineAccountBalances(
    tx, 
    expenseSubAccountId,    // حساب بدهکار اصلی (معین)
    chequesPayableAccount.id, // حساب بستانکار نهایی (معین)
    cheque.amount, 
    expenseDetailId,
    expenseLabel
  );
}

// =================================================================
// 💰 تابع به‌روزرسانی مانده حساب‌ها برای سند ۴ ردیفی 
// =================================================================
async function updateFourLineAccountBalances(
  tx, 
  expenseSubAccountId,        // حساب معین هزینه/خرید
  chequesPayableAccountId,    // حساب معین چک‌های پرداختنی
  amount, 
  expenseDetailAccountId = null,
  accountLabel
) {
  // ۱. افزایش مانده حساب بدهکار (هزینه/خرید)
  await tx.subAccount.update({
    where: { id: expenseSubAccountId },
    data: { balance: { increment: amount } }
  });
  
  if (expenseDetailAccountId) {
    await tx.detailAccount.update({
      where: { id: expenseDetailAccountId },
      data: { balance: { increment: amount } }
    });
  }
  console.log(`📈 مانده حساب ${accountLabel} (بدهکار اصلی) افزایش یافت: ${amount} ریال`);

  // حساب واسط (طرف مقابل) در ردیف ۲ و ۳ خنثی می‌شود (۰) - به‌روزرسانی لازم نیست.

  // ۲. افزایش مانده حساب بستانکار نهایی (چک‌های پرداختنی)
  await tx.subAccount.update({
    where: { id: chequesPayableAccountId },
    data: { balance: { increment: amount } }
  });
  console.log(`📈 مانده حساب چک‌های پرداختنی افزایش یافت: ${amount} ریال`);

  console.log('✅ مانده حساب‌ها برای سند ۴ ردیفی با موفقیت به‌روزرسانی شد');
}


// =================================================================
// 🤝 تابع کمکی برای ایجاد ردیف‌های سند تسویه بدهی (۲ ردیف)
// =================================================================
async function createSettlementVoucherItems(tx, voucher, cheque, payeeAccount, payeeDetailAccount, chequesPayableAccount) {
  // اطلاعات حساب واسط (شخص گیرنده/بستانکاران تجاری)
  const payeeSubAccountId = payeeAccount.id;
  const payeeDetailId = payeeDetailAccount?.id || null;
  const payeePersonId = payeeDetailAccount?.person?.id || null;

  // ردیف ۱: بدهکار کردن حساب طرف مقابل (تسویه بدهی)
  const settlementDebitItem = {
    voucherId: voucher.id,
    subAccountId: payeeSubAccountId,
    description: `بابت چک پرداختنی شماره ${cheque.chequeNumber} - ${cheque.payee || 'طرف حساب'} (تسویه بدهی)`,
    debit: cheque.amount,
    credit: 0
  };

  if (payeeDetailId) {
    settlementDebitItem.detailAccountId = payeeDetailId;
    if (payeePersonId) {
      settlementDebitItem.personId = payeePersonId;
    }
  }

  await tx.voucherItem.create({ data: settlementDebitItem });
  console.log(`📝 ردیف ۱ - بدهکار طرف مقابل (تسویه): ${cheque.amount} ریال`);

  // ردیف ۲: بستانکار کردن حساب چک‌های پرداختنی (صدور چک)
  await tx.voucherItem.create({
    data: {
      voucherId: voucher.id,
      subAccountId: chequesPayableAccount.id,
      description: `بستانکار: چک پرداختنی شماره ${cheque.chequeNumber}`,
      debit: 0,
      credit: cheque.amount
    }
  });
  console.log(`📝 ردیف ۲ - بستانکار چک پرداختنی: ${cheque.amount} ریال`);

  // به‌روزرسانی مانده حساب‌ها
  await updateSettlementAccountBalances(tx, payeeSubAccountId, chequesPayableAccount.id, cheque.amount, payeeDetailId);
}

// =================================================================
// 🤝 تابع به‌روزرسانی مانده حساب‌ها برای سند تسویه بدهی
// =================================================================
async function updateSettlementAccountBalances(tx, payeeAccountId, chequesPayableAccountId, amount, payeeDetailAccountId = null) {
  // ۱. کاهش مانده حساب بدهکار (طرف مقابل) - برای تسویه بدهی، باید مانده بستانکاری/بدهی کاهش یابد.
  await tx.subAccount.update({
    where: { id: payeeAccountId },
    data: { balance: { decrement: amount } }
  });
  
  if (payeeDetailAccountId) {
    await tx.detailAccount.update({
      where: { id: payeeDetailAccountId },
      data: { balance: { decrement: amount } }
    });
  }
  console.log(`📉 مانده حساب طرف مقابل کاهش یافت: ${amount} ریال`);


  // ۲. افزایش مانده حساب بستانکار (چک‌های پرداختنی)
  await tx.subAccount.update({
    where: { id: chequesPayableAccountId },
    data: { balance: { increment: amount } }
  });
  console.log(`📈 مانده حساب چک‌های پرداختنی افزایش یافت: ${amount} ریال`);

  console.log('✅ مانده حساب‌ها برای سند تسویه بدهی با موفقیت به‌روزرسانی شد');
}


// =================================================================
// 💸 تابع کمکی برای ایجاد سند چک دریافتنی
// =================================================================
async function createVoucherForReceivableCheque(tx, cheque) {
  try {
    console.log(`💰 شروع ایجاد سند برای چک دریافتنی: ${cheque.chequeNumber}`);

    // --- اطلاعات پایه ---
    const lastVoucher = await tx.voucher.findFirst({ orderBy: { id: 'desc' } });
    const voucherNumber = generateVoucherNumber(lastVoucher?.id || 0);

    // ۱. حساب چک‌های دریافتنی (1-02-0001)
    const chequesReceivableAccount = await tx.subAccount.findFirst({
      where: { code: '1-02-0001' }
    });
    if (!chequesReceivableAccount) {
      throw new Error('حساب چک‌های دریافتنی یافت نشد.');
    }

    // ۲. تعیین حساب صادرکننده
    let drawerAccount = null;
    let drawerDetailAccount = null;

    if (cheque.drawerDetailAccountId) {
      drawerDetailAccount = await tx.detailAccount.findUnique({
        where: { id: cheque.drawerDetailAccountId },
        include: { subAccount: true, person: true }
      });
      if (!drawerDetailAccount) throw new Error('حساب تفصیلی صادرکننده یافت نشد');
      drawerAccount = drawerDetailAccount.subAccount;
    } else if (cheque.drawerAccountId) {
      drawerAccount = await tx.subAccount.findUnique({
        where: { id: cheque.drawerAccountId },
        include: { category: true }
      });
      if (!drawerAccount) throw new Error('حساب معین صادرکننده یافت نشد');
    }
    if (!drawerAccount) throw new Error('حساب صادرکننده یافت نشد');


    // --- ایجاد سند ---
    const voucher = await tx.voucher.create({
      data: {
        voucherNumber,
        voucherDate: new Date(),
        description: `دریافت چک دریافتنی شماره ${cheque.chequeNumber} - ${cheque.bankName} - ${cheque.drawer}`,
        totalAmount: cheque.amount,
        createdBy: 1
      }
    });
    console.log(`✅ سند ایجاد شد: ${voucherNumber}`);


    // ردیف ۱: بدهکار کردن حساب چک‌های دریافتنی
    await tx.voucherItem.create({
      data: {
        voucherId: voucher.id,
        subAccountId: chequesReceivableAccount.id,
        description: `۱. بدهکار: چک دریافتنی شماره ${cheque.chequeNumber} - ${cheque.drawer}`,
        debit: cheque.amount,
        credit: 0
      }
    });
    console.log(`📝 ردیف ۱ - بدهکار چک دریافتنی ایجاد شد: ${cheque.amount} ریال`);

    // ردیف ۲: بستانکار کردن حساب طرف مقابل (کاهش مطالبات)
    const creditItemData = {
      voucherId: voucher.id,
      subAccountId: drawerAccount.id,
      description: `۲. بستانکار: بابت چک دریافتنی شماره ${cheque.chequeNumber}`,
      debit: 0,
      credit: cheque.amount
    }

    if (drawerDetailAccount) {
      creditItemData.detailAccountId = drawerDetailAccount.id;
      if (drawerDetailAccount.person) {
        creditItemData.personId = drawerDetailAccount.person.id;
      }
    }

    await tx.voucherItem.create({ data: creditItemData });
    console.log(`📝 ردیف ۲ - بستانکار صادرکننده ایجاد شد: ${cheque.amount} ریال`);

    // اتصال سند به چک
    await tx.cheque.update({
      where: { id: cheque.id },
      data: { voucher: { connect: { id: voucher.id } } }
    });

    // به‌روزرسانی مانده حساب‌ها
    await updateReceivableAccountBalances(tx, chequesReceivableAccount.id, drawerAccount.id, cheque.amount, drawerDetailAccount?.id);

    console.log(`✅ سند ${voucherNumber} با موفقیت ایجاد و به چک متصل شد`);

    return voucher;
  } catch (error) {
    console.error('❌ خطا در ایجاد سند برای چک دریافتنی:', error);
    throw error;
  }
}

// =================================================================
// 💰 تابع به‌روزرسانی مانده حساب‌ها برای چک دریافتنی
// =================================================================
async function updateReceivableAccountBalances(tx, debitAccountId, creditAccountId, amount, creditDetailAccountId = null) {
  // ۱. افزایش مانده حساب بدهکار (چک‌های دریافتنی)
  await tx.subAccount.update({
    where: { id: debitAccountId },
    data: { balance: { increment: amount } }
  });

  // ۲. کاهش مانده حساب بستانکار (طرف مقابل) - کاهش مطالبات
  await tx.subAccount.update({
    where: { id: creditAccountId },
    data: { balance: { decrement: amount } }
  });
  
  if (creditDetailAccountId) {
    await tx.detailAccount.update({
      where: { id: creditDetailAccountId },
      data: { balance: { decrement: amount } }
    });
  }
  console.log('✅ مانده حساب‌های دریافتنی با موفقیت به‌روزرسانی شد');
}

// =================================================================
// 🔁 PATCH: به‌روزرسانی وضعیت چک (وصول/برگشت)
// *توجه*: منطق وصول یا برگشت چک و ایجاد سند حسابداری مرتبط با این رویداد باید در اینجا اضافه شود.
// =================================================================
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action') // 'collect' برای وصول، 'return' برای برگشت

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه چک ارسال نشده است' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, description } = body

    const chequeId = parseInt(id)
    if (isNaN(chequeId)) {
      return NextResponse.json(
        { error: 'شناسه چک باید عددی باشد' },
        { status: 400 }
      )
    }

    const existingCheque = await prisma.cheque.findUnique({
      where: { id: chequeId }
    })

    if (!existingCheque) {
      return NextResponse.json(
        { error: 'چک یافت نشد' },
        { status: 404 }
      )
    }
    
    // در این قسمت باید منطق ایجاد سند برای وصول یا برگشت چک اضافه شود.
    // به عنوان مثال:
    // if (action === 'collect' && existingCheque.type === 'receivable') {
    //    await createVoucherForChequeCollection(tx, existingCheque, body.bankDetailAccountId);
    // }

    // به‌روزرسانی ساده وضعیت
    const updatedCheque = await prisma.cheque.update({
      where: { id: chequeId },
      data: {
        status: status || existingCheque.status,
        description: description || existingCheque.description,
        updatedAt: new Date()
      },
      include: {
        person: { select: { id: true, name: true, type: true } },
        drawerAccount: { select: { id: true, code: true, name: true } },
        payeeAccount: { select: { id: true, code: true, name: true } },
        drawerDetailAccount: { select: { id: true, code: true, name: true, person: { select: { id: true, name: true } } } },
        payeeDetailAccount: { select: { id: true, code: true, name: true, person: { select: { id: true, name: true } } } },
        voucher: { select: { id: true, voucherNumber: true, voucherDate: true } }
      }
    })

    console.log('✅ وضعیت چک به‌روزرسانی شد:', { id: chequeId, status })

    return NextResponse.json(updatedCheque)
  } catch (error) {
    console.error('❌ خطا در به‌روزرسانی وضعیت چک:', error)
    return NextResponse.json(
      { error: `خطا در به‌روزرسانی وضعیت چک: ${error.message}` },
      { status: 500 }
    )
  }
}