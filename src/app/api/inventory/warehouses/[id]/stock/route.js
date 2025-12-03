// src/app/api/inventory/warehouses/[id]/stock/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    // دریافت params با await
    const { id } = await params;
    const warehouseId = parseInt(id);
    
    console.log('Fetching warehouse stock for ID:', warehouseId);
    
    if (isNaN(warehouseId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه انبار نامعتبر است' },
        { status: 400 }
      );
    }
    
    // بررسی وجود انبار
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        phone: true,
        manager: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: 'انبار یافت نشد' },
        { status: 404 }
      );
    }
    
    // دریافت موجودی کالاها در این انبار
    const stockItems = await prisma.stockItem.findMany({
      where: { warehouseId: warehouseId },
      include: {
        product: {
          include: {
            unit: true,
            category: true,
            priceHistory: {
              orderBy: { effectiveDate: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: {
        product: {
          code: 'asc'
        }
      }
    });
    
    // محاسبه آمار
    const totalValue = stockItems.reduce((sum, item) => {
      const unitPrice = item.product?.priceHistory?.[0]?.purchasePrice || 
                       item.product?.defaultPurchasePrice || 0;
      return sum + (item.quantity * unitPrice);
    }, 0);
    
    const totalQuantity = stockItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const lowStockItems = stockItems.filter(item => {
      const minStock = item.minStock || item.product?.minStock || 0;
      return item.quantity <= minStock;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        warehouse,
        stockItems,
        stats: {
          totalItems: stockItems.length,
          totalValue,
          totalQuantity,
          lowStockCount: lowStockItems.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching warehouse stock:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در دریافت موجودی انبار',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}