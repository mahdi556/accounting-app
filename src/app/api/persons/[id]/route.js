// src/app/api/persons/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log("Received ID from params:", id);

    if (!id) {
      return NextResponse.json(
        { error: "شناسه شخص ارسال نشده است" },
        { status: 400 }
      );
    }

    const personId = parseInt(id);
    if (isNaN(personId)) {
      return NextResponse.json(
        { error: "شناسه شخص باید عددی باشد" },
        { status: 400 }
      );
    }

    console.log("Searching for person with ID:", personId);

    const person = await prisma.person.findUnique({
      where: {
        id: personId,
      },
      include: {
        detailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            balance: true,
          },
        },
        voucherItems: {
          include: {
            voucher: {
              select: {
                id: true,
                voucherNumber: true,
                voucherDate: true,
                description: true,
              },
            },
            subAccount: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log("Query result:", person);

    if (!person) {
      return NextResponse.json({ error: "شخص یافت نشد" }, { status: 404 });
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error("Error in GET person API:", error);
    return NextResponse.json(
      { error: `خطای سرور: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "شناسه شخص ارسال نشده است" },
        { status: 400 }
      );
    }

    const personId = parseInt(id);
    if (isNaN(personId)) {
      return NextResponse.json(
        { error: "شناسه شخص باید عددی باشد" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, type, phone, email, address } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "نام شخص الزامی است" },
        { status: 400 }
      );
    }

    // بررسی تکراری نبودن نام (به جز خود شخص)
    const existingPerson = await prisma.person.findFirst({
      where: {
        name: name.trim(),
        NOT: {
          id: personId,
        },
      },
    });

    if (existingPerson) {
      return NextResponse.json(
        { error: "شخص دیگری با این نام وجود دارد" },
        { status: 400 }
      );
    }

    const person = await prisma.person.update({
      where: { id: personId },
      data: {
        name: name.trim(),
        type,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
      },
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error("Error updating person:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "شناسه شخص ارسال نشده است" },
        { status: 400 }
      );
    }

    const personId = parseInt(id);
    if (isNaN(personId)) {
      return NextResponse.json(
        { error: "شناسه شخص باید عددی باشد" },
        { status: 400 }
      );
    }

    await prisma.person.delete({
      where: { id: personId },
    });

    return NextResponse.json({ message: "شخص حذف شد" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
