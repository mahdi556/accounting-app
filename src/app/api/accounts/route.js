// src/app/api/accounts/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

// **تابع کمکی جدید برای محاسبه گردش و مانده**
const calculateTurnoverAndBalance = (account, whereCondition) => {
  // این تابع باید منطق شما را اجرا کند تا account.balance را محاسبه کند.
  // برای سادگی، فعلاً از منطق موجود استفاده می‌کنیم.

  // 1. جمع‌آوری همه آیتم‌های سند
  const allVoucherItems = [
    ...account.voucherItems,
    ...account.detailAccounts.flatMap((da) => da.voucherItems),
  ];

  // 2. محاسبه گردش
  const totalDebit = allVoucherItems.reduce(
    (sum, item) => sum + (parseFloat(item.debit) || 0),
    0
  );
  const totalCredit = allVoucherItems.reduce(
    (sum, item) => sum + (parseFloat(item.credit) || 0),
    0
  );

  // 3. محاسبه مانده نهایی بر اساس ماهیت حساب
  let finalBalance;
  // فرض بر این است که asset و expense ماهیت بدهکار دارند، و بقیه بستانکار.
  if (
    account.category.type === "asset" ||
    account.category.type === "expense"
  ) {
    finalBalance = totalDebit - totalCredit;
  } else {
    finalBalance = totalCredit - totalDebit;
  }

  // 4. محاسبه تعداد تراکنش‌ها
  const transactionCount = allVoucherItems.length;

  return {
    ...account,
    // **فیلد مورد نیاز کلاینت**
    balance: finalBalance,
    // فیلدهای اضافی برای گزارش (اگرچه در اینجا لازم نیستند)
    debitTurnover: totalDebit,
    creditTurnover: totalCredit,
    transactionCount: transactionCount,
    // حذف داده‌های خام برای سبکی پاسخ
    voucherItems: undefined,
    detailAccounts: undefined,
  };
};

export async function GET(request) {
  try {
    // گرفتن تمام حساب‌های معین
    const accounts = await prisma.subAccount.findMany({
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });

    console.log(`📊 Found ${accounts.length} accounts`);

    // محاسبه مانده برای هر حساب با استفاده از groupBy برای بهینه‌سازی
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        // **1. بررسی وجود حساب‌های تفصیلی برای این حساب معین**
        const detailAccounts = await prisma.detailAccount.findMany({
          where: {
            subAccountId: account.id,
          },
          select: {
            id: true,
          },
        });

        const detailAccountIds = detailAccounts.map((da) => da.id);

        // **2. محاسبه گردش‌ها بر اساس وجود یا عدم وجود حساب تفصیلی**
        let totalDebit = 0;
        let totalCredit = 0;
        let transactionCount = 0;

        if (detailAccountIds.length > 0) {
          // **حالت الف: حساب دارای حساب تفصیلی است**
          // محاسبه گردش حساب‌های تفصیلی
          const detailTurnover = await prisma.voucherItem.groupBy({
            by: ["detailAccountId"],
            where: {
              detailAccountId: {
                in: detailAccountIds,
              },
            },
            _sum: {
              debit: true,
              credit: true,
            },
            _count: true,
          });

          detailTurnover.forEach((item) => {
            totalDebit += item._sum.debit || 0;
            totalCredit += item._sum.credit || 0;
            transactionCount += item._count || 0;
          });
        } else {
          // **حالت ب: حساب تفصیلی ندارد**
          // محاسبه گردش مستقیم حساب معین
          const subAccountTurnover = await prisma.voucherItem.groupBy({
            by: ["subAccountId"],
            where: {
              subAccountId: account.id,
              detailAccountId: null, // فقط آیتم‌های مستقیم
            },
            _sum: {
              debit: true,
              credit: true,
            },
            _count: true,
          });

          if (subAccountTurnover.length > 0) {
            totalDebit = subAccountTurnover[0]._sum.debit || 0;
            totalCredit = subAccountTurnover[0]._sum.credit || 0;
            transactionCount = subAccountTurnover[0]._count || 0;
          }
        }

        // **3. محاسبه مانده نهایی بر اساس ماهیت حساب**
        let balance;
        if (
          account.category.type === "asset" ||
          account.category.type === "expense"
        ) {
          // ماهیت بدهکار: مانده = بدهکار - بستانکار
          balance = totalDebit - totalCredit;
        } else {
          // ماهیت بستانکار: مانده = بستانکار - بدهکار
          balance = totalCredit - totalDebit;
        }

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          category: account.category,
          balance: balance,
          transactionCount: transactionCount,
          hasDetailAccounts: detailAccountIds.length > 0,
          detailAccountsCount: detailAccountIds.length,
          debit: totalDebit,
          credit: totalCredit,
        };
      })
    );

    return NextResponse.json(accountsWithBalance);
  } catch (error) {
    console.error("❌ Error in GET /api/accounts:", error);
    return NextResponse.json(
      { error: `خطا در دریافت اطلاعات حساب‌ها: ${error.message}` },
      { status: 500 }
    );
  }
}
export async function POST(request) {
  try {
    const body = await request.json();
    const { code, name, categoryId } = body;

    // بررسی تکراری نبودن کد حساب
    const existingAccount = await prisma.subAccount.findFirst({
      where: {
        code: code.trim(),
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: "حساب با این کد قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    const account = await prisma.subAccount.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        categoryId: parseInt(categoryId),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
