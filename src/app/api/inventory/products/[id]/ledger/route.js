// src/app/api/inventory/products/[id]/ledger/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// در Next.js 13+ باید params را با await دریافت کنیم
export async function GET(request, { params }) {
  try {
    // دریافت params با await
    const { id } = await params;
    
    console.log('API Called for product ledger:', id);
    
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول نامعتبر است' },
        { status: 400 }
      );
    }
    
    // پارامترهای جستجو
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const warehouseId = searchParams.get('warehouseId');
    
    const skip = (page - 1) * limit;
    
    // ساخت فیلترها
    const where = {
      productId: productId
    };
    
    // فیلتر تاریخ
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }
    
    // فیلتر انبار
    if (warehouseId && !isNaN(parseInt(warehouseId))) {
      where.warehouseId = parseInt(warehouseId);
    }
    
    // دریافت اطلاعات محصول
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        unit: true,
        detailAccount: true
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }
    
    // دریافت تراکنش‌ها
    const [ledgers, total] = await Promise.all([
      prisma.inventoryLedger.findMany({
        where,
        include: {
          warehouse: {
            select: { id: true, code: true, name: true }
          },
          document: {
            include: {
              type: true,
              voucher: true,
              person: true
            }
          },
          person: {
            select: { id: true, name: true, type: true }
          }
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.inventoryLedger.count({ where })
    ]);
    
    // محاسبه موجودی انبارهای مختلف
    const stockByWarehouse = await prisma.stockItem.findMany({
      where: { productId: productId },
      include: {
        warehouse: true
      }
    });
    
    // محاسبه آمار کلی
    const stats = {
      totalIn: ledgers.reduce((sum, l) => sum + l.quantityIn, 0),
      totalOut: ledgers.reduce((sum, l) => sum + l.quantityOut, 0),
      totalValueIn: ledgers.reduce((sum, l) => sum + l.totalPrice, 0),
      currentBalance: stockByWarehouse.reduce((sum, item) => sum + item.quantity, 0),
      stockByWarehouse: stockByWarehouse.map(item => ({
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        quantity: item.quantity
      }))
    };
    
    // محاسبه موجودی سرانجام برای هر تراکنش
    let runningBalance = 0;
    const ledgersWithBalance = ledgers.map(ledger => {
      runningBalance += (ledger.quantityIn - ledger.quantityOut);
      return {
        ...ledger,
        balanceQuantity: runningBalance
      };
    }).reverse(); // برای نمایش از قدیم به جدید
    
    return NextResponse.json({
      success: true,
      product,
      ledgers: ledgersWithBalance,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in product ledger API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در دریافت کاردکس کالا',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}