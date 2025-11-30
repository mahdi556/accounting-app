// src/app/api/detail-accounts/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include');
    
    const detailAccounts = await prisma.detailAccount.findMany({
      include: {
        subAccount: {
          select: {
            id: true, // اضافه کردن این خط
            code: true,
            name: true,
            category: {
              select: {
                id: true, // اضافه کردن این خط
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

    return NextResponse.json(detailAccounts);
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