// src/app/api/inventory/warehouses/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

// GET: دریافت اطلاعات انبار
export async function GET(request, { params }) {
  try {
    // دریافت params با await
    const { id } = await params;
    const warehouseId = parseInt(id);
    
    console.log('Fetching warehouse ID:', warehouseId);
    
    if (isNaN(warehouseId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه انبار نامعتبر است' },
        { status: 400 }
      );
    }
    
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        detailAccount: {
          include: {
            subAccount: true
          }
        },
        stockItems: {
          include: {
            product: {
              include: {
                unit: true,
                category: true
              }
            }
          }
        },
        inventoryDocuments: {
          take: 10,
          orderBy: { documentDate: 'desc' },
          include: {
            type: true
          }
        }
      }
    });
    
    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: 'انبار یافت نشد' },
        { status: 404 }
      );
    }
    
    // محاسبه آمار انبار
    const totalStockValue = warehouse.stockItems.reduce(
      (sum, item) => sum + (item.quantity * (item.product?.defaultPurchasePrice || 0)), 
      0
    );
    
    const totalProducts = warehouse.stockItems.length;
    const lowStockCount = warehouse.stockItems.filter(
      item => item.quantity <= (item.product?.minStock || 0)
    ).length;
    
    return NextResponse.json({
      success: true,
      data: {
        ...warehouse,
        stats: {
          totalStockValue,
          totalProducts,
          lowStockCount
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در دریافت اطلاعات انبار',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT: ویرایش انبار
export async function PUT(request, { params }) {
  try {
    // دریافت params با await
    const { id } = await params;
    const warehouseId = parseInt(id);
    
    if (isNaN(warehouseId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه انبار نامعتبر است' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // بررسی وجود انبار
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });
    
    if (!existingWarehouse) {
      return NextResponse.json(
        { success: false, error: 'انبار یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی تکراری نبودن کد (اگر تغییر کرده)
    if (data.code && data.code !== existingWarehouse.code) {
      const duplicate = await prisma.warehouse.findUnique({
        where: { code: data.code }
      });
      
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'کد انبار تکراری است' },
          { status: 400 }
        );
      }
    }
    
    // ویرایش انبار
    const warehouse = await prisma.warehouse.update({
      where: { id: warehouseId },
      data: {
        code: data.code,
        name: data.name,
        address: data.address,
        phone: data.phone,
        manager: data.manager,
        description: data.description,
        detailAccountId: data.detailAccountId || null
      },
      include: {
        detailAccount: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'انبار با موفقیت ویرایش شد',
      data: warehouse
    });
    
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در ویرایش انبار',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE: حذف انبار
export async function DELETE(request, { params }) {
  try {
    // دریافت params با await
    const { id } = await params;
    const warehouseId = parseInt(id);
    
    if (isNaN(warehouseId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه انبار نامعتبر است' },
        { status: 400 }
      );
    }
    
    // بررسی وجود انبار
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        inventoryDocuments: true,
        stockItems: true
      }
    });
    
    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: 'انبار یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی اینکه انبار در اسناد استفاده نشده باشد
    if (warehouse.inventoryDocuments.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'امکان حذف انبار به دلیل وجود اسناد مرتبط وجود ندارد' 
        },
        { status: 400 }
      );
    }
    
    // حذف انبار
    await prisma.warehouse.delete({
      where: { id: warehouseId }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'انبار با موفقیت حذف شد' 
    });
    
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در حذف انبار',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}