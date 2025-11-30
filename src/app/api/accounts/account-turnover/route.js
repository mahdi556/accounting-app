// src/app/api/reports/account-turnover/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log("📊 Fetching account turnover data...");

    // اول همه حساب‌های معین را بگیریم
    const subAccounts = await prisma.subAccount.findMany({
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

    console.log(`📋 Found ${subAccounts.length} sub-accounts`);

    // برای هر حساب، voucherItems را جداگانه بگیریم
    const accountsWithTurnover = await Promise.all(
      subAccounts.map(async (account) => {
        // گرفتن voucherItems برای این حساب معین
        const voucherItems = await prisma.voucherItem.findMany({
          where: {
            subAccountId: account.id,
            voucher: {
              voucherDate: {
                gte: startDate ? new Date(startDate) : undefined,
                lte: endDate ? new Date(endDate) : undefined,
              },
            },
          },
          include: {
            voucher: {
              select: {
                id: true,
                voucherDate: true,
                voucherNumber: true,
              },
            },
          },
        });

        // گرفتن voucherItems برای حساب‌های تفصیلی این حساب معین
        const detailAccounts = await prisma.detailAccount.findMany({
          where: {
            subAccountId: account.id,
          },
          select: {
            id: true,
          },
        });

        let detailVoucherItems = [];
        if (detailAccounts.length > 0) {
          detailVoucherItems = await prisma.voucherItem.findMany({
            where: {
              detailAccountId: {
                in: detailAccounts.map((da) => da.id),
              },
              voucher: {
                voucherDate: {
                  gte: startDate ? new Date(startDate) : undefined,
                  lte: endDate ? new Date(endDate) : undefined,
                },
              },
            },
            include: {
              voucher: {
                select: {
                  id: true,
                  voucherDate: true,
                  voucherNumber: true,
                },
              },
            },
          });
        }

        // محاسبه گردش
        const subAccountDebit = voucherItems.reduce(
          (sum, item) => sum + (parseFloat(item.debit) || 0),
          0
        );
        const subAccountCredit = voucherItems.reduce(
          (sum, item) => sum + (parseFloat(item.credit) || 0),
          0
        );

        const detailDebit = detailVoucherItems.reduce(
          (sum, item) => sum + (parseFloat(item.debit) || 0),
          0
        );
        const detailCredit = detailVoucherItems.reduce(
          (sum, item) => sum + (parseFloat(item.credit) || 0),
          0
        );

        const totalDebit = subAccountDebit + detailDebit;
        const totalCredit = subAccountCredit + detailCredit;

        // محاسبه مانده نهایی
        let finalBalance;
        if (
          account.category.type === "asset" ||
          account.category.type === "expense"
        ) {
          finalBalance = totalDebit - totalCredit;
        } else {
          finalBalance = totalCredit - totalDebit;
        }

        console.log(`💰 Account ${account.code}:`, {
          voucherItems: voucherItems.length,
          detailVoucherItems: detailVoucherItems.length,
          debit: totalDebit,
          credit: totalCredit,
          balance: finalBalance,
        });

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          category: account.category,
          initialBalance: 0,
          debitTurnover: totalDebit,
          creditTurnover: totalCredit,
          finalBalance: finalBalance,
          transactionCount: voucherItems.length + detailVoucherItems.length,
          voucherItems: voucherItems.length,
          detailVoucherItems: detailVoucherItems.length,
        };
      })
    );

    console.log("✅ Turnover calculation completed");

    return NextResponse.json(accountsWithTurnover);
  } catch (error) {
    console.error("❌ Error in account turnover API:", error);
    return NextResponse.json(
      { error: `خطا در محاسبه گردش حساب‌ها: ${error.message}` },
      { status: 500 }
    );
  }
}
