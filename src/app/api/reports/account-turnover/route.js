// src/app/api/reports/account-turnover/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        
        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "تاریخ شروع و پایان باید مشخص باشد" },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);

        console.log("📊 Fetching account turnover data...");

        // **1. گرفتن تمام حساب‌های معین**
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
                // گرفتن حساب‌های تفصیلی هر حساب معین
                detailAccounts: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                code: "asc",
            },
        });

        console.log(`📋 Found ${subAccounts.length} sub-accounts`);

        // **2. محاسبه گردش برای هر حساب معین**
        const accountsWithTurnover = await Promise.all(
            subAccounts.map(async (account) => {
                // **الف: اگر حساب معین دارای حساب تفصیلی باشد، فقط گردش حساب‌های تفصیلی را محاسبه کنیم**
                if (account.detailAccounts.length > 0) {
                    // لیست IDهای حساب‌های تفصیلی
                    const detailAccountIds = account.detailAccounts.map(da => da.id);

                    // محاسبه مانده اول از حساب‌های تفصیلی
                    const initialDetailTurnover = await prisma.voucherItem.groupBy({
                        by: ["detailAccountId"],
                        where: {
                            detailAccountId: {
                                in: detailAccountIds,
                            },
                            voucher: {
                                voucherDate: {
                                    lt: start,
                                },
                            },
                        },
                        _sum: {
                            debit: true,
                            credit: true,
                        },
                    });

                    // محاسبه گردش دوره از حساب‌های تفصیلی
                    const periodDetailTurnover = await prisma.voucherItem.groupBy({
                        by: ["detailAccountId"],
                        where: {
                            detailAccountId: {
                                in: detailAccountIds,
                            },
                            voucher: {
                                voucherDate: {
                                    gte: start,
                                    lte: end,
                                },
                            },
                        },
                        _sum: {
                            debit: true,
                            credit: true,
                        },
                    });

                    // جمع‌آوری مانده اول
                    let initialDebit = 0;
                    let initialCredit = 0;
                    initialDetailTurnover.forEach(item => {
                        initialDebit += item._sum.debit || 0;
                        initialCredit += item._sum.credit || 0;
                    });

                    // جمع‌آوری گردش دوره
                    let periodDebit = 0;
                    let periodCredit = 0;
                    periodDetailTurnover.forEach(item => {
                        periodDebit += item._sum.debit || 0;
                        periodCredit += item._sum.credit || 0;
                    });

                    // تعداد تراکنش‌های دوره
                    const transactionCount = await prisma.voucherItem.count({
                        where: {
                            detailAccountId: {
                                in: detailAccountIds,
                            },
                            voucher: {
                                voucherDate: {
                                    gte: start,
                                    lte: end,
                                },
                            },
                        },
                    });

                    // محاسبه مانده‌ها بر اساس ماهیت حساب
                    let initialBalance;
                    let finalBalance;

                    if (
                        account.category.type === "asset" ||
                        account.category.type === "expense"
                    ) {
                        // ماهیت بدهکار
                        initialBalance = initialDebit - initialCredit;
                        finalBalance = initialBalance + periodDebit - periodCredit;
                    } else {
                        // ماهیت بستانکار
                        initialBalance = initialCredit - initialDebit;
                        finalBalance = initialBalance + periodCredit - periodDebit;
                    }

                    return {
                        id: account.id,
                        code: account.code,
                        name: account.name,
                        category: account.category,
                        hasDetailAccounts: true,
                        detailAccountsCount: account.detailAccounts.length,
                        initialBalance: initialBalance,
                        debitTurnover: periodDebit,
                        creditTurnover: periodCredit,
                        finalBalance: finalBalance,
                        transactionCount: transactionCount,
                    };
                }
                // **ب: اگر حساب معین حساب تفصیلی ندارد، خود حساب معین را محاسبه کنیم**
                else {
                    // مانده اول حساب معین
                    const initialTurnover = await prisma.voucherItem.groupBy({
                        by: ["subAccountId"],
                        where: {
                            subAccountId: account.id,
                            detailAccountId: null, // فقط آیتم‌هایی که حساب تفصیلی ندارند
                            voucher: {
                                voucherDate: {
                                    lt: start,
                                },
                            },
                        },
                        _sum: {
                            debit: true,
                            credit: true,
                        },
                    });

                    // گردش دوره حساب معین
                    const periodTurnover = await prisma.voucherItem.groupBy({
                        by: ["subAccountId"],
                        where: {
                            subAccountId: account.id,
                            detailAccountId: null, // فقط آیتم‌هایی که حساب تفصیلی ندارند
                            voucher: {
                                voucherDate: {
                                    gte: start,
                                    lte: end,
                                },
                            },
                        },
                        _sum: {
                            debit: true,
                            credit: true,
                        },
                    });

                    // تعداد تراکنش‌های دوره
                    const transactionCount = await prisma.voucherItem.count({
                        where: {
                            subAccountId: account.id,
                            detailAccountId: null,
                            voucher: {
                                voucherDate: {
                                    gte: start,
                                    lte: end,
                                },
                            },
                        },
                    });

                    const initialData = initialTurnover[0]?._sum || { debit: 0, credit: 0 };
                    const periodData = periodTurnover[0]?._sum || { debit: 0, credit: 0 };

                    let initialBalance;
                    let finalBalance;

                    if (
                        account.category.type === "asset" ||
                        account.category.type === "expense"
                    ) {
                        // ماهیت بدهکار
                        initialBalance = initialData.debit - initialData.credit;
                        finalBalance = initialBalance + periodData.debit - periodData.credit;
                    } else {
                        // ماهیت بستانکار
                        initialBalance = initialData.credit - initialData.debit;
                        finalBalance = initialBalance + periodData.credit - periodData.debit;
                    }

                    return {
                        id: account.id,
                        code: account.code,
                        name: account.name,
                        category: account.category,
                        hasDetailAccounts: false,
                        detailAccountsCount: 0,
                        initialBalance: initialBalance,
                        debitTurnover: periodData.debit,
                        creditTurnover: periodData.credit,
                        finalBalance: finalBalance,
                        transactionCount: transactionCount,
                    };
                }
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