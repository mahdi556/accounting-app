import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include");

    // دریافت حساب‌های تفصیلی با اطلاعات حساب معین
    const detailAccounts = await prisma.detailAccount.findMany({
      include: {
        subAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            category: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
        },
        person: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });

    // محاسبه موجودی واقعی هر حساب تفصیلی از روی تراکنش‌ها
    const accountsWithRealBalance = await Promise.all(
      detailAccounts.map(async (account) => {
        // جمع تمام بدهکارها و بستانکارهای این حساب تفصیلی
        const voucherItems = await prisma.voucherItem.findMany({
          where: {
            detailAccountId: account.id,
          },
          select: {
            debit: true,
            credit: true,
          },
        });

        // محاسبه موجودی واقعی
        let realBalance = 0;
        voucherItems.forEach((item) => {
          realBalance += (item.debit || 0) - (item.credit || 0);
        });

        // همچنین مانده حساب معین والد را هم بررسی کنیم
        const subAccountBalance = await prisma.subAccount.findUnique({
          where: { id: account.subAccountId },
          select: { balance: true },
        });

        return {
          ...account,
          balance: realBalance, // استفاده از موجودی محاسبه شده
          storedBalance: account.balance, // موجودی ذخیره شده در دیتابیس
          subAccountBalance: subAccountBalance?.balance || 0,
        };
      })
    );

    return NextResponse.json(accountsWithRealBalance);
  } catch (error) {
    console.error("Error in GET /api/detail-accounts:", error);
    return NextResponse.json(
      { error: `خطا در دریافت اطلاعات حساب‌های تفصیلی: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST بدون تغییر
export async function POST(request) {
  try {
    const body = await request.json();
    const { code, name, subAccountId } = body;

    const existingAccount = await prisma.detailAccount.findFirst({
      where: {
        code: code.trim(),
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: "حساب تفصیلی با این کد قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    const detailAccount = await prisma.detailAccount.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        subAccountId: parseInt(subAccountId),
      },
      include: {
        subAccount: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(detailAccount, { status: 201 });
  } catch (error) {
    console.error("Error creating detail account:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
