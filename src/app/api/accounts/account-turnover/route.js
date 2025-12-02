// src/app/api/reports/account-turnover/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        
        // **1. تعریف تاریخ‌ها**
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        console.log("📊 Fetching account turnover data...");

        // **2. محاسبه گردش کل برای همه SubAccountها در یک کوئری تجمیعی**
        const turnoverData = await prisma.voucherItem.groupBy({
            by: ["subAccountId"],
            where: {
                voucher: {
                    voucherDate: {
                        gte: start,
                        lte: end,
                    },
                },
                // فیلتر کردن آیتم‌هایی که subAccountId یا detailAccountId دارند، به detailAccountId هم توجه کنید.
                OR: [
                    { subAccountId: { not: null } },
                    { detailAccountId: { not: null } },
                ],
            },
            _sum: {
                debit: true,
                credit: true,
            },
        });
        
        // **3. گرفتن تمام حساب‌های معین**
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
                // برای شناسایی detailAccountها که به subAccount وصل هستند
                detailAccounts: {
                    select: {
                        id: true
                    }
                },
            },
            orderBy: {
                code: "asc",
            },
        });

        console.log(`📋 Found ${subAccounts.length} sub-accounts`);

        // **4. گرفتن گردش detailAccountها و تجمیع بر اساس subAccountId**
        const detailAccountIds = subAccounts.flatMap(acc => acc.detailAccounts.map(da => da.id));
        
        let detailTurnoverMap = {};
        if (detailAccountIds.length > 0) {
            const rawDetailTurnover = await prisma.voucherItem.groupBy({
                by: ["detailAccountId"],
                where: {
                    detailAccountId: {
                        in: detailAccountIds
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

            // Map detailAccount turnover back to their SubAccount
            for (const item of rawDetailTurnover) {
                const detailAccount = await prisma.detailAccount.findUnique({
                    where: { id: item.detailAccountId },
                    select: { subAccountId: true }
                });

                if (detailAccount) {
                    const subId = detailAccount.subAccountId;
                    detailTurnoverMap[subId] = detailTurnoverMap[subId] || { debit: 0, credit: 0 };
                    detailTurnoverMap[subId].debit += item._sum.debit || 0;
                    detailTurnoverMap[subId].credit += item._sum.credit || 0;
                }
            }
        }
        
        const turnoverMap = turnoverData.reduce((acc, item) => {
            acc[item.subAccountId] = {
                debit: item._sum.debit || 0,
                credit: item._sum.credit || 0
            };
            return acc;
        }, {});


        // **5. ادغام داده‌ها و محاسبه مانده نهایی**
        const accountsWithTurnover = subAccounts.map((account) => {
            const subTurnover = turnoverMap[account.id] || { debit: 0, credit: 0 };
            const detailTurnover = detailTurnoverMap[account.id] || { debit: 0, credit: 0 };

            const totalDebit = subTurnover.debit + detailTurnover.debit;
            const totalCredit = subTurnover.credit + detailTurnover.credit;

            let finalBalance;
            if (
                account.category.type === "asset" ||
                account.category.type === "expense"
            ) {
                // ماهیت بدهکار (مانده = بدهکار - بستانکار)
                finalBalance = totalDebit - totalCredit;
            } else {
                // ماهیت بستانکار (مانده = بستانکار - بدهکار)
                finalBalance = totalCredit - totalDebit;
            }

            return {
                id: account.id,
                code: account.code,
                name: account.name,
                category: account.category,
                initialBalance: 0, // نیاز به کوئری جداگانه برای مانده اول دوره
                debitTurnover: totalDebit,
                creditTurnover: totalCredit,
                finalBalance: finalBalance,
                // در اینجا، تعداد تراکنش‌ها برای سادگی نادیده گرفته شد، می‌توان با یک کوئری جداگانه آن را محاسبه کرد.
                transactionCount: 0, 
            };
        });

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