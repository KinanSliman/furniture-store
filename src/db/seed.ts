import * as dotenv from 'dotenv';
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

import { db } from './db';
import {
  users,
  categories,
  products,
  productImages,
  productCategories,
  orders,
  orderItems,
  orderStatusHistory,
  productReviews,
  discountCodes,
  addresses
} from './schema';
import { hashPassword } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Create Admin User
    console.log('Creating admin user...');
    const adminPasswordHash = await hashPassword('admin123');
    const [admin] = await db.insert(users).values({
      email: 'admin@store.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✅ Admin user created:', admin.email);

    // 2. Create Customer Users
    console.log('Creating customer users...');
    const customerPasswordHash = await hashPassword('customer123');
    const customerData = [
      { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe' },
      { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith' },
      { email: 'mike.wilson@example.com', firstName: 'Mike', lastName: 'Wilson' },
      { email: 'sarah.brown@example.com', firstName: 'Sarah', lastName: 'Brown' },
      { email: 'david.jones@example.com', firstName: 'David', lastName: 'Jones' },
    ];

    const customers = await db.insert(users).values(
      customerData.map((customer, index) => ({
        email: customer.email,
        passwordHash: customerPasswordHash,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: `555-010${index + 1}`,
        role: 'customer' as const,
        isActive: true,
        emailVerified: true,
        // Create some customers from last month for comparison
        createdAt: index < 2
          ? new Date(new Date().setMonth(new Date().getMonth() - 1))
          : new Date(),
        updatedAt: new Date(),
      }))
    ).returning();
    console.log(`✅ Created ${customers.length} customer users`);

    // 3. Create Categories
    console.log('Creating categories...');
    const categoryData = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home decor and garden supplies' },
      { name: 'Books', slug: 'books', description: 'Books and reading materials' },
      { name: 'Toys & Games', slug: 'toys-games', description: 'Toys and games for all ages' },
    ];

    const categoriesCreated = await db.insert(categories).values(
      categoryData.map((cat, index) => ({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: index,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    ).returning();
    console.log(`✅ Created ${categoriesCreated.length} categories`);

    // 4. Create Products
    console.log('Creating products...');
    const productData = [
      {
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
        shortDescription: 'Premium wireless headphones with noise cancellation',
        price: '129.99',
        compareAtPrice: '199.99',
        costPrice: '65.00',
        sku: 'WBH-001',
        stockQuantity: 45,
        categoryIndex: 0, // Electronics
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      },
      {
        name: 'Smart Fitness Watch',
        slug: 'smart-fitness-watch',
        description: 'Track your fitness goals with this advanced smartwatch featuring heart rate monitoring, GPS, and sleep tracking.',
        shortDescription: 'Advanced fitness tracking smartwatch',
        price: '249.99',
        compareAtPrice: '299.99',
        costPrice: '125.00',
        sku: 'SFW-002',
        stockQuantity: 30,
        categoryIndex: 0, // Electronics
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      },
      {
        name: 'Classic Cotton T-Shirt',
        slug: 'classic-cotton-tshirt',
        description: 'Comfortable 100% cotton t-shirt available in multiple colors. Perfect for everyday wear.',
        shortDescription: '100% cotton comfortable t-shirt',
        price: '24.99',
        compareAtPrice: '34.99',
        costPrice: '8.00',
        sku: 'CCT-003',
        stockQuantity: 150,
        categoryIndex: 1, // Clothing
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      },
      {
        name: 'Leather Messenger Bag',
        slug: 'leather-messenger-bag',
        description: 'Genuine leather messenger bag with multiple compartments. Perfect for work or travel.',
        shortDescription: 'Genuine leather professional bag',
        price: '159.99',
        compareAtPrice: '229.99',
        costPrice: '80.00',
        sku: 'LMB-004',
        stockQuantity: 8, // Low stock item
        lowStockThreshold: 10,
        categoryIndex: 1, // Clothing
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
      },
      {
        name: 'Ceramic Plant Pot Set',
        slug: 'ceramic-plant-pot-set',
        description: 'Set of 3 elegant ceramic plant pots with drainage holes. Perfect for indoor plants.',
        shortDescription: 'Set of 3 decorative plant pots',
        price: '39.99',
        compareAtPrice: '59.99',
        costPrice: '15.00',
        sku: 'CPP-005',
        stockQuantity: 0, // Out of stock item
        categoryIndex: 2, // Home & Garden
        image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800',
      },
      {
        name: 'LED Desk Lamp',
        slug: 'led-desk-lamp',
        description: 'Adjustable LED desk lamp with multiple brightness levels and color temperatures.',
        shortDescription: 'Adjustable LED desk lamp',
        price: '49.99',
        compareAtPrice: '79.99',
        costPrice: '22.00',
        sku: 'LDL-006',
        stockQuantity: 65,
        categoryIndex: 2, // Home & Garden
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
      },
      {
        name: 'The Complete Programming Guide',
        slug: 'complete-programming-guide',
        description: 'Comprehensive guide to modern programming covering multiple languages and best practices.',
        shortDescription: 'Complete programming reference book',
        price: '44.99',
        costPrice: '18.00',
        sku: 'CPG-007',
        stockQuantity: 88,
        categoryIndex: 3, // Books
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800',
      },
      {
        name: 'Puzzle Set Collection',
        slug: 'puzzle-set-collection',
        description: '1000-piece jigsaw puzzle featuring beautiful landscape photography.',
        shortDescription: '1000-piece jigsaw puzzle',
        price: '29.99',
        compareAtPrice: '39.99',
        costPrice: '12.00',
        sku: 'PSC-008',
        stockQuantity: 42,
        categoryIndex: 4, // Toys & Games
        image: 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=800',
      },
      {
        name: 'Educational STEM Robot Kit',
        slug: 'educational-stem-robot-kit',
        description: 'Build and program your own robot with this educational STEM kit. Perfect for kids 8+.',
        shortDescription: 'Programmable robot building kit',
        price: '89.99',
        compareAtPrice: '119.99',
        costPrice: '40.00',
        sku: 'SRK-009',
        stockQuantity: 25,
        categoryIndex: 4, // Toys & Games
        image: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=800',
      },
      {
        name: 'Portable Bluetooth Speaker',
        slug: 'portable-bluetooth-speaker',
        description: 'Waterproof portable speaker with 360-degree sound and 12-hour battery life.',
        shortDescription: 'Waterproof portable speaker',
        price: '79.99',
        compareAtPrice: '99.99',
        costPrice: '35.00',
        sku: 'PBS-010',
        stockQuantity: 55,
        categoryIndex: 0, // Electronics
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
      },
    ];

    const productsCreated = [];
    for (const prod of productData) {
      const [product] = await db.insert(products).values({
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        shortDescription: prod.shortDescription,
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        costPrice: prod.costPrice,
        sku: prod.sku,
        trackInventory: true,
        stockQuantity: prod.stockQuantity,
        lowStockThreshold: prod.lowStockThreshold || 5,
        isActive: true,
        isFeatured: Math.random() > 0.7, // 30% chance of being featured
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Add product image
      await db.insert(productImages).values({
        productId: product.id,
        url: prod.image,
        altText: prod.name,
        displayOrder: 0,
        isPrimary: true,
        createdAt: new Date(),
      });

      // Link product to category
      await db.insert(productCategories).values({
        productId: product.id,
        categoryId: categoriesCreated[prod.categoryIndex].id,
        createdAt: new Date(),
      });

      productsCreated.push(product);
    }
    console.log(`✅ Created ${productsCreated.length} products with images and categories`);

    // 5. Create Shipping Addresses for customers
    console.log('Creating shipping addresses...');
    const addressesCreated = [];
    for (let i = 0; i < 3; i++) {
      const [address] = await db.insert(addresses).values({
        userId: customers[i].id,
        type: 'shipping',
        firstName: customers[i].firstName!,
        lastName: customers[i].lastName!,
        address1: `${(i + 1) * 123} Main Street`,
        city: ['New York', 'Los Angeles', 'Chicago'][i],
        state: ['NY', 'CA', 'IL'][i],
        postalCode: ['10001', '90001', '60601'][i],
        country: 'US',
        phone: customers[i].phone!,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      addressesCreated.push(address);
    }
    console.log(`✅ Created ${addressesCreated.length} shipping addresses`);

    // 6. Create Orders (including orders from last month)
    console.log('Creating orders...');
    const now = new Date();
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));

    const orderData = [
      // Last month orders (for comparison)
      {
        userId: customers[0].id,
        email: customers[0].email,
        status: 'delivered' as const,
        paymentStatus: 'paid' as const,
        products: [
          { product: productsCreated[0], quantity: 1 },
          { product: productsCreated[2], quantity: 2 },
        ],
        shippingCost: '9.99',
        createdAt: new Date(lastMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
        addressIndex: 0,
      },
      {
        userId: customers[1].id,
        email: customers[1].email,
        status: 'delivered' as const,
        paymentStatus: 'paid' as const,
        products: [
          { product: productsCreated[1], quantity: 1 },
        ],
        shippingCost: '9.99',
        createdAt: new Date(lastMonth.getTime() + 10 * 24 * 60 * 60 * 1000),
        addressIndex: 1,
      },
      {
        userId: customers[2].id,
        email: customers[2].email,
        status: 'delivered' as const,
        paymentStatus: 'paid' as const,
        products: [
          { product: productsCreated[6], quantity: 1 },
          { product: productsCreated[7], quantity: 1 },
        ],
        shippingCost: '9.99',
        createdAt: new Date(lastMonth.getTime() + 20 * 24 * 60 * 60 * 1000),
        addressIndex: 2,
      },
      // Current month orders
      {
        userId: customers[0].id,
        email: customers[0].email,
        status: 'delivered' as const,
        paymentStatus: 'paid' as const,
        products: [
          { product: productsCreated[9], quantity: 1 },
        ],
        shippingCost: '9.99',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 15)),
        addressIndex: 0,
      },
      {
        userId: customers[1].id,
        email: customers[1].email,
        status: 'shipped' as const,
        paymentStatus: 'paid' as const,
        products: [
          { product: productsCreated[8], quantity: 1 },
          { product: productsCreated[7], quantity: 2 },
        ],
        shippingCost: '9.99',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
        addressIndex: 1,
      },
      {
        userId: customers[2].id,
        email: customers[2].email,
        status: 'processing' as const,
        paymentStatus: 'paid' as const,
        products: [
          { product: productsCreated[0], quantity: 1 },
          { product: productsCreated[2], quantity: 1 },
          { product: productsCreated[6], quantity: 1 },
        ],
        shippingCost: '9.99',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        addressIndex: 2,
      },
    ];

    const ordersCreated = [];
    for (const orderInfo of orderData) {
      // Calculate order totals
      const subtotal = orderInfo.products.reduce((sum, item) => {
        return sum + (parseFloat(item.product.price) * item.quantity);
      }, 0);
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + tax + parseFloat(orderInfo.shippingCost);

      const [order] = await db.insert(orders).values({
        orderNumber: generateOrderNumber(),
        userId: orderInfo.userId,
        email: orderInfo.email,
        status: orderInfo.status,
        paymentStatus: orderInfo.paymentStatus,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shippingCost: orderInfo.shippingCost,
        discountAmount: '0',
        total: total.toFixed(2),
        paymentMethod: 'stripe',
        shippingMethod: 'Standard Shipping',
        shippingAddressId: addressesCreated[orderInfo.addressIndex].id,
        billingAddressId: addressesCreated[orderInfo.addressIndex].id,
        createdAt: orderInfo.createdAt,
        updatedAt: orderInfo.createdAt,
      }).returning();

      // Create order items
      for (const item of orderInfo.products) {
        const itemPrice = parseFloat(item.product.price);
        const itemTotal = itemPrice * item.quantity;

        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku!,
          quantity: item.quantity,
          price: itemPrice.toFixed(2),
          discount: '0',
          tax: (itemTotal * 0.08).toFixed(2),
          total: itemTotal.toFixed(2),
          createdAt: orderInfo.createdAt,
        });
      }

      // Add status history
      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        status: orderInfo.status,
        note: `Order ${orderInfo.status}`,
        createdAt: orderInfo.createdAt,
      });

      ordersCreated.push(order);
    }
    console.log(`✅ Created ${ordersCreated.length} orders with items and status history`);

    // 7. Create Product Reviews
    console.log('Creating product reviews...');
    const reviewData = [
      {
        productIndex: 0,
        userIndex: 0,
        rating: 5,
        title: 'Excellent sound quality!',
        content: 'These headphones are amazing. The noise cancellation works perfectly and the battery life is impressive.',
      },
      {
        productIndex: 1,
        userIndex: 1,
        rating: 4,
        title: 'Great fitness tracker',
        content: 'Love this smartwatch! Tracks everything I need. Only wish the battery lasted a bit longer.',
      },
      {
        productIndex: 6,
        userIndex: 2,
        rating: 5,
        title: 'Must-have for developers',
        content: 'Comprehensive guide that covers everything. Highly recommend for both beginners and experienced programmers.',
      },
      {
        productIndex: 9,
        userIndex: 0,
        rating: 5,
        title: 'Perfect for outdoor use',
        content: 'Great sound quality and truly waterproof. Took it to the beach and it worked perfectly!',
      },
    ];

    for (const review of reviewData) {
      await db.insert(productReviews).values({
        productId: productsCreated[review.productIndex].id,
        userId: customers[review.userIndex].id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        isVerifiedPurchase: true,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`✅ Created ${reviewData.length} product reviews`);

    // 8. Create Discount Codes
    console.log('Creating discount codes...');
    const discountData = [
      {
        code: 'WELCOME10',
        type: 'percentage' as const,
        value: '10',
        minPurchase: '50',
        maxUses: 100,
      },
      {
        code: 'FREESHIP',
        type: 'free_shipping' as const,
        value: '0',
        minPurchase: '25',
        maxUses: null,
      },
      {
        code: 'SAVE20',
        type: 'fixed_amount' as const,
        value: '20',
        minPurchase: '100',
        maxUses: 50,
      },
    ];

    for (const discount of discountData) {
      await db.insert(discountCodes).values({
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minPurchase: discount.minPurchase,
        maxUses: discount.maxUses,
        usesCount: 0,
        maxUsesPerCustomer: 1,
        isActive: true,
        startsAt: new Date(),
        expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`✅ Created ${discountData.length} discount codes`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - 1 admin user (admin@store.com / admin123)`);
    console.log(`   - ${customers.length} customer users (password: customer123)`);
    console.log(`   - ${categoriesCreated.length} categories`);
    console.log(`   - ${productsCreated.length} products (1 out of stock, 1 low stock)`);
    console.log(`   - ${ordersCreated.length} orders (3 from last month, 3 from current month)`);
    console.log(`   - ${reviewData.length} product reviews`);
    console.log(`   - ${discountData.length} discount codes`);
    console.log('\n💡 You can now login with:');
    console.log('   Admin: admin@store.com / admin123');
    console.log('   Customer: john.doe@example.com / customer123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }

  process.exit(0);
}

seed();