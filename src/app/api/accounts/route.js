// src/app/api/accounts/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTurnover = searchParams.get("includeTurnover") === "true";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log("Fetching accounts with turnover:", {
      includeTurnover,
      startDate,
      endDate,
    });

    // شرط where برای فیلتر تاریخ
    const whereCondition = {};
    if (startDate && endDate) {
      whereCondition.voucherDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

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
        voucherItems: {
          include: {
            voucher: {
              select: {
                id: true,
                voucherDate: true,
                voucherNumber: true,
              },
            },
          },
          where: {
            voucher: whereCondition,
          },
        },
        detailAccounts: {
          include: {
            voucherItems: {
              include: {
                voucher: {
                  select: {
                    id: true,
                    voucherDate: true,
                    voucherNumber: true,
                  },
                },
              },
              where: {
                voucher: whereCondition,
              },
            },
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });

    console.log(`Found ${accounts.length} accounts with voucher items`);

    // اگر نیاز به محاسبه گردش داریم، اطلاعات کامل برگردانده شود
    if (includeTurnover) {
      const accountsWithTurnover = accounts.map((account) => {
        // محاسبه گردش برای حساب معین
        const subAccountDebit = account.voucherItems.reduce(
          (sum, item) => sum + (parseFloat(item.debit) || 0),
          0
        );
        const subAccountCredit = account.voucherItems.reduce(
          (sum, item) => sum + (parseFloat(item.credit) || 0),
          0
        );

        // محاسبه گردش برای حساب‌های تفصیلی مرتبط
        let detailAccountsDebit = 0;
        let detailAccountsCredit = 0;

        account.detailAccounts.forEach((detailAccount) => {
          detailAccountsDebit += detailAccount.voucherItems.reduce(
            (sum, item) => sum + (parseFloat(item.debit) || 0),
            0
          );
          detailAccountsCredit += detailAccount.voucherItems.reduce(
            (sum, item) => sum + (parseFloat(item.credit) || 0),
            0
          );
        });

        // جمع کل گردش
        const totalDebit = subAccountDebit + detailAccountsDebit;
        const totalCredit = subAccountCredit + detailAccountsCredit;

        // محاسبه مانده نهایی بر اساس نوع حساب
        let finalBalance;
        if (
          account.category.type === "asset" ||
          account.category.type === "expense"
        ) {
          finalBalance = totalDebit - totalCredit;
        } else {
          finalBalance = totalCredit - totalDebit;
        }

        return {
          ...account,
          initialBalance: 0, // در سیستم واقعی باید از دیتابیس خوانده شود
          debitTurnover: totalDebit,
          creditTurnover: totalCredit,
          finalBalance,
          transactionCount:
            account.voucherItems.length +
            account.detailAccounts.reduce(
              (sum, da) => sum + da.voucherItems.length,
              0
            ),
        };
      });

      return NextResponse.json(accountsWithTurnover);
    }

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error in GET /api/accounts:", error);
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
