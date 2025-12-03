// scripts/check-database-status.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDatabaseStatus() {
  try {
    console.log('🔍 بررسی وضعیت دیتابیس...\n')
    
    // ۱. بررسی انبارها
    const warehouses = await prisma.warehouse.findMany()
    console.log(`🏭 تعداد انبارها: ${warehouses.length}`)
    warehouses.forEach(w => console.log(`   - ${w.code}: ${w.name} (ID: ${w.id})`))
    
    // ۲. بررسی محصولات
    const products = await prisma.product.findMany()
    console.log(`\n📦 تعداد محصولات: ${products.length}`)
    products.slice(0, 5).forEach(p => console.log(`   - ${p.code}: ${p.name} (ID: ${p.id})`))
    
    // ۳. بررسی StockItem (موجودی)
    const stockItems = await prisma.stockItem.findMany({
      include: {
        warehouse: true,
        product: true
      }
    })
    console.log(`\n📊 تعداد رکوردهای StockItem: ${stockItems.length}`)
    stockItems.forEach(item => {
      console.log(`   - ${item.product?.code}: ${item.product?.name} در ${item.warehouse?.name}: ${item.quantity}`)
    })
    
    // ۴. بررسی اسناد انبار
    const inventoryDocs = await prisma.inventoryDocument.findMany({
      take: 5
    })
    console.log(`\n📝 تعداد اسناد انبار: ${await prisma.inventoryDocument.count()}`)
    console.log(`   آخرین اسناد: ${inventoryDocs.length > 0 ? 'دارد' : 'ندارد'}`)
    
    // ۵. اگر StockItem خالی است، نمونه ایجاد کنیم
    if (stockItems.length === 0) {
      console.log('\n⚠️  هیچ رکورد StockItem وجود ندارد!')
      console.log('   باید تراکنش انبار ایجاد کنید.')
      
      // بررسی آیا می‌توانیم نمونه ایجاد کنیم؟
      if (warehouses.length > 0 && products.length > 0) {
        console.log('   ایجاد نمونه StockItem...')
        try {
          const sampleStock = await prisma.stockItem.create({
            data: {
              productId: products[0].id,
              warehouseId: warehouses[0].id,
              quantity: 100,
              minStock: 10,
              maxStock: 1000
            }
          })
          console.log(`   ✅ نمونه ایجاد شد: ID ${sampleStock.id}`)
        } catch (error) {
          console.log('   ❌ خطا در ایجاد نمونه:', error.message)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ خطا:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseStatus()