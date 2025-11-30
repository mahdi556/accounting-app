// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding accounting data...')

  try {
    // حذف داده‌های موجود به ترتیب درست
    console.log('Cleaning existing data...')
    await prisma.voucherItem.deleteMany()
    await prisma.voucher.deleteMany()
    await prisma.subAccount.deleteMany()
    await prisma.accountCategory.deleteMany()
    await prisma.person.deleteMany()
    await prisma.bank.deleteMany()

    // ایجاد حساب‌های کل
    console.log('Creating account categories...')
    
    // دارایی‌ها
    const assetCategory = await prisma.accountCategory.create({
      data: {
        code: '1',
        name: 'دارایی‌های جاری',
        type: 'asset'
      }
    })

    const fixedAssetCategory = await prisma.accountCategory.create({
      data: {
        code: '2',
        name: 'دارایی‌های ثابت',
        type: 'asset'
      }
    })

    // بدهی‌ها
    const liabilityCategory = await prisma.accountCategory.create({
      data: {
        code: '3',
        name: 'بدهی‌های جاری',
        type: 'liability'
      }
    })

    // سرمایه
    const equityCategory = await prisma.accountCategory.create({
      data: {
        code: '4',
        name: 'سرمایه',
        type: 'equity'
      }
    })

    // درآمدها
    const incomeCategory = await prisma.accountCategory.create({
      data: {
        code: '5',
        name: 'درآمدهای عملیاتی',
        type: 'income'
      }
    })

    // هزینه‌ها
    const expenseCategory = await prisma.accountCategory.create({
      data: {
        code: '6',
        name: 'هزینه‌های عملیاتی',
        type: 'expense'
      }
    })

    // ایجاد حساب‌های معین
    console.log('Creating sub accounts...')

    // دارایی‌های جاری
    const currentAssetAccounts = await Promise.all([
      prisma.subAccount.create({
        data: {
          code: '101',
          name: 'صندوق',
          categoryId: assetCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '102',
          name: 'تنخواه گردان',
          categoryId: assetCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '103',
          name: 'بانک ملی',
          categoryId: assetCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '104',
          name: 'بانک ملت',
          categoryId: assetCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '105',
          name: 'حساب‌های دریافتنی',
          categoryId: assetCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '106',
          name: 'موجودی کالا',
          categoryId: assetCategory.id
        }
      })
    ])

    // دارایی‌های ثابت
    const fixedAssetAccounts = await Promise.all([
      prisma.subAccount.create({
        data: {
          code: '201',
          name: 'زمین',
          categoryId: fixedAssetCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '202',
          name: 'ساختمان',
          categoryId: fixedAssetCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '203',
          name: 'ماشین‌آلات',
          categoryId: fixedAssetCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '204',
          name: 'وسایل نقلیه',
          categoryId: fixedAssetCategory.id
        }
      })
    ])

    // بدهی‌های جاری
    const liabilityAccounts = await Promise.all([
      prisma.subAccount.create({
        data: {
          code: '301',
          name: 'حساب‌های پرداختنی',
          categoryId: liabilityCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '302',
          name: 'وام‌های کوتاه‌مدت',
          categoryId: liabilityCategory.id
        }
      })
    ])

    // سرمایه
    const equityAccounts = await Promise.all([
      prisma.subAccount.create({
        data: {
          code: '401',
          name: 'سرمایه اولیه',
          categoryId: equityCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '402',
          name: 'سود انباشته',
          categoryId: equityCategory.id
        }
      })
    ])

    // درآمدها
    const incomeAccounts = await Promise.all([
      prisma.subAccount.create({
        data: {
          code: '501',
          name: 'فروش محصولات',
          categoryId: incomeCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '502',
          name: 'فروش خدمات',
          categoryId: incomeCategory.id
        }
      })
    ])

    // هزینه‌ها
    const expenseAccounts = await Promise.all([
      prisma.subAccount.create({
        data: {
          code: '601',
          name: 'هزینه حقوق و دستمزد',
          categoryId: expenseCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '602',
          name: 'هزینه اجاره',
          categoryId: expenseCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '603',
          name: 'هزینه آب و برق',
          categoryId: expenseCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '604',
          name: 'هزینه تلفن و اینترنت',
          categoryId: expenseCategory.id
        }
      }),
      prisma.subAccount.create({
        data: {
          code: '605',
          name: 'هزینه حمل و نقل',
          categoryId: expenseCategory.id
        }
      })
    ])

    // ایجاد حساب‌های بانکی پیش‌فرض
    console.log('Creating default banks...')
    const defaultBanks = await Promise.all([
      prisma.bank.create({
        data: {
          name: 'بانک ملی - حساب جاری',
          accountNumber: '0100-1234567',
          balance: 10000000
        }
      }),
      prisma.bank.create({
        data: {
          name: 'بانک ملت - حساب پس‌انداز',
          accountNumber: '0120-7654321',
          balance: 5000000
        }
      }),
      prisma.bank.create({
        data: {
          name: 'صندوق شرکت',
          accountNumber: null,
          balance: 5000000
        }
      })
    ])

    // ایجاد اشخاص پیش‌فرض
    console.log('Creating default persons...')
    const defaultPersons = await Promise.all([
      prisma.person.create({
        data: {
          name: 'شرکت فناوری اطلاعات نوآور',
          type: 'customer',
          phone: '02188776655',
          email: 'info@novin-tech.com',
          address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳۴'
        }
      }),
      prisma.person.create({
        data: {
          name: 'شرکت تامین قطعات صنعتی',
          type: 'supplier',
          phone: '02177665544',
          email: 'sales@tamin-parts.com',
          address: 'اصفهان، شهرک صنعتی، بلوار اصلی'
        }
      }),
      prisma.person.create({
        data: {
          name: 'محمد رضایی',
          type: 'customer',
          phone: '09123456789',
          email: 'm.rezaei@email.com'
        }
      }),
      prisma.person.create({
        data: {
          name: 'علی محمدی - مدیر عامل',
          type: 'employee',
          phone: '09129876543',
          email: 'a.mohammadi@company.com'
        }
      })
    ])

    // ایجاد یک سند نمونه برای تست
    console.log('Creating sample voucher...')
    const sampleVoucher = await prisma.voucher.create({
      data: {
        voucherNumber: 'V00001',
        voucherDate: new Date('2024-01-15'),
        description: 'افتتاحیه حساب‌ها و سرمایه اولیه',
        totalAmount: 20000000,
        items: {
          create: [
            {
              subAccountId: currentAssetAccounts[2].id, // بانک ملی
              description: 'واریز سرمایه اولیه',
              debit: 10000000,
              credit: 0
            },
            {
              subAccountId: currentAssetAccounts[0].id, // صندوق
              description: 'تنظیم صندوق',
              debit: 5000000,
              credit: 0
            },
            {
              subAccountId: equityAccounts[0].id, // سرمایه اولیه
              description: 'سرمایه اولیه شرکت',
              debit: 0,
              credit: 15000000
            }
          ]
        }
      }
    })

    console.log('Seeding completed successfully!')
    console.log(`Created:`)
    console.log(`- 6 account categories`)
    console.log(`- ${currentAssetAccounts.length + fixedAssetAccounts.length + liabilityAccounts.length + equityAccounts.length + incomeAccounts.length + expenseAccounts.length} sub accounts`)
    console.log(`- ${defaultBanks.length} bank accounts`)
    console.log(`- ${defaultPersons.length} persons`)
    console.log(`- 1 sample voucher`)

  } catch (error) {
    console.error('Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:')
    console.error(e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })