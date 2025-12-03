// src/app/api/inventory/products/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

// GET: دریافت محصول بر اساس ID
export async function GET(request, { params }) {
  try {
    // دریافت params با await - این خط حیاتی است!
    const { id } = await params;
    const productId = parseInt(id);
    
    console.log('Fetching product ID:', productId);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول نامعتبر است' },
        { status: 400 }
      );
    }
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        unit: true,
        detailAccount: true,
        stockItems: {
          include: {
            warehouse: true
          }
        },
        priceHistory: {
          orderBy: { effectiveDate: 'desc' },
          take: 10
        },
        inventoryLedgers: {
          orderBy: { transactionDate: 'desc' },
          take: 20,
          include: {
            warehouse: true,
            document: true
          }
        }
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }
    
    // محاسبه موجودی کل
    const stockItems = await prisma.stockItem.findMany({
      where: { productId: productId },
      select: { quantity: true }
    });
    
    const totalStock = stockItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    return NextResponse.json({
      ...product,
      totalStock,
      hasLowStock: totalStock <= product.minStock
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در دریافت اطلاعات محصول',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT: ویرایش محصول
export async function PUT(request, { params }) {
  try {
    // دریافت params با await
    const { id } = await params;
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول نامعتبر است' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // بررسی وجود محصول
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی تکراری نبودن کد (اگر تغییر کرده)
    if (data.code && data.code !== existingProduct.code) {
      const duplicate = await prisma.product.findUnique({
        where: { code: data.code }
      });
      
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'کد محصول تکراری است' },
          { status: 400 }
        );
      }
    }
    
    // ویرایش محصول
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        code: data.code,
        name: data.name,
        barcode: data.barcode,
        categoryId: data.categoryId,
        unitId: data.unitId,
        defaultPurchasePrice: data.defaultPurchasePrice,
        defaultSalePrice: data.defaultSalePrice,
        defaultWholesalePrice: data.defaultWholesalePrice,
        minStock: data.minStock,
        maxStock: data.maxStock,
        detailAccountId: data.detailAccountId
      },
      include: {
        category: true,
        unit: true
      }
    });
    
    // اگر قیمت تغییر کرده، سابقه جدید ایجاد شود
    if (data.defaultPurchasePrice !== existingProduct.defaultPurchasePrice ||
        data.defaultSalePrice !== existingProduct.defaultSalePrice) {
      await prisma.productPriceHistory.create({
        data: {
          productId: product.id,
          purchasePrice: data.defaultPurchasePrice || 0,
          salePrice: data.defaultSalePrice,
          wholesalePrice: data.defaultWholesalePrice
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'محصول با موفقیت ویرایش شد',
      data: product
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در ویرایش محصول',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE: حذف محصول
export async function DELETE(request, { params }) {
  try {
    // دریافت params با await
    const { id } = await params;
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول نامعتبر است' },
        { status: 400 }
      );
    }
    
    // بررسی وجود محصول
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stockItems: true,
        inventoryLedgers: true
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی اینکه محصول در تراکنش‌ها استفاده نشده باشد
    if (product.inventoryLedgers.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'امکان حذف محصول به دلیل وجود تراکنش‌های مرتبط وجود ندارد' 
        },
        { status: 400 }
      );
    }
    
    // حذف محصول
    await prisma.product.delete({
      where: { id: productId }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'محصول با موفقیت حذف شد' 
    });
    
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در حذف محصول',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}