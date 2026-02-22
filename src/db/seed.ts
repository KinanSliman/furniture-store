import * as dotenv from 'dotenv';
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
  addresses,
  siteSettings,
} from './schema';
import { hashPassword } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';

async function seed() {
  console.log('🌱 Starting furniture store seed...');

  try {
    // ── Site Settings ────────────────────────────────────────────────────────
    console.log('Inserting site settings...');
    const settingsData = [
      { key: 'store_name', value: 'Lumina Living', type: 'string' },
      { key: 'store_email', value: 'hello@luminaliving.com', type: 'string' },
      { key: 'store_phone', value: '+1 (800) 555-0100', type: 'string' },
      { key: 'store_address', value: '220 Design District, New York, NY 10001', type: 'string' },
      { key: 'currency', value: 'USD', type: 'string' },
      { key: 'currency_symbol', value: '$', type: 'string' },
      { key: 'default_tax_rate', value: '0.08', type: 'string' },
    ];
    for (const s of settingsData) {
      await db.insert(siteSettings).values({ key: s.key, value: s.value, type: s.type }).onConflictDoNothing();
    }
    console.log('✅ Site settings inserted');

    // ── Admin User ────────────────────────────────────────────────────────────
    console.log('Creating admin user...');
    const adminHash = await hashPassword('admin123');
    const [admin] = await db.insert(users).values({
      email: 'admin@luminaliving.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'Lumina',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    }).returning();
    console.log('✅ Admin:', admin.email);

    // ── Customer Users ────────────────────────────────────────────────────────
    console.log('Creating customers...');
    const custHash = await hashPassword('customer123');
    const customerData = [
      { email: 'emma.thompson@example.com', firstName: 'Emma', lastName: 'Thompson', phone: '555-0201' },
      { email: 'liam.carter@example.com', firstName: 'Liam', lastName: 'Carter', phone: '555-0202' },
      { email: 'sophia.lee@example.com', firstName: 'Sophia', lastName: 'Lee', phone: '555-0203' },
      { email: 'noah.patel@example.com', firstName: 'Noah', lastName: 'Patel', phone: '555-0204' },
      { email: 'olivia.martin@example.com', firstName: 'Olivia', lastName: 'Martin', phone: '555-0205' },
    ];
    const customers = await db.insert(users).values(
      customerData.map((c, i) => ({
        email: c.email,
        passwordHash: custHash,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        role: 'customer' as const,
        isActive: true,
        emailVerified: true,
        createdAt: i < 2
          ? new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
          : new Date(),
      }))
    ).returning();
    console.log(`✅ Created ${customers.length} customers`);

    // ── Categories ────────────────────────────────────────────────────────────
    console.log('Creating categories...');
    const catData = [
      {
        name: 'Living Room', slug: 'living-room',
        nameEn: 'Living Room', nameAr: 'غرفة المعيشة',
        descriptionEn: 'Sofas, coffee tables, entertainment units and accent pieces',
        descriptionAr: 'أرائك وطاولات قهوة ووحدات ترفيهية وقطع تزيينية',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
      },
      {
        name: 'Bedroom', slug: 'bedroom',
        nameEn: 'Bedroom', nameAr: 'غرفة النوم',
        descriptionEn: 'Beds, wardrobes, nightstands and dressers',
        descriptionAr: 'أسرة وخزائن وطاولات سرير وخزائن ملابس',
        image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
      },
      {
        name: 'Dining Room', slug: 'dining-room',
        nameEn: 'Dining Room', nameAr: 'غرفة الطعام',
        descriptionEn: 'Dining tables, chairs, benches and sideboards',
        descriptionAr: 'طاولات طعام وكراسي ومقاعد وخزائن جانبية',
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800',
      },
      {
        name: 'Home Office', slug: 'home-office',
        nameEn: 'Home Office', nameAr: 'مكتب منزلي',
        descriptionEn: 'Desks, office chairs, bookshelves and storage',
        descriptionAr: 'مكاتب وكراسي مكتبية ورفوف كتب وتخزين',
        image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800',
      },
      {
        name: 'Outdoor', slug: 'outdoor',
        nameEn: 'Outdoor', nameAr: 'الخارجي',
        descriptionEn: 'Patio furniture, garden chairs and outdoor loungers',
        descriptionAr: 'أثاث الفناء وكراسي الحديقة وكراسي الاسترخاء الخارجية',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      },
      {
        name: 'Lighting', slug: 'lighting',
        nameEn: 'Lighting', nameAr: 'الإضاءة',
        descriptionEn: 'Floor lamps, pendant lights, table lamps and sconces',
        descriptionAr: 'مصابيح أرضية ومعلقة وطاولية وجدارية',
        image: 'https://images.unsplash.com/photo-1513506003901-1e6a35749a5f?w=800',
      },
    ];

    const catsCreated = await db.insert(categories).values(
      catData.map((c, i) => ({
        name: c.name, slug: c.slug,
        nameEn: c.nameEn, nameAr: c.nameAr,
        descriptionEn: c.descriptionEn, descriptionAr: c.descriptionAr,
        imageUrl: c.image,
        displayOrder: i, isActive: true,
      }))
    ).returning();
    console.log(`✅ Created ${catsCreated.length} categories`);

    // ── Products ──────────────────────────────────────────────────────────────
    console.log('Creating products...');

    const productData = [
      // LIVING ROOM
      {
        name: 'Havana Modular Sofa',
        slug: 'havana-modular-sofa',
        nameEn: 'Havana Modular Sofa',
        nameAr: 'أريكة هافانا المعيارية',
        descriptionEn: 'A supremely comfortable modular sofa upholstered in premium bouclé fabric. Mix and match sections to create your perfect seating arrangement. Solid oak legs, removable covers.',
        descriptionAr: 'أريكة معيارية مريحة للغاية مغطاة بقماش بوكليه المميز. امزج وطابق الأقسام لإنشاء ترتيب الجلوس المثالي. أرجل من خشب البلوط الصلب وأغطية قابلة للإزالة.',
        shortDescriptionEn: 'Premium bouclé modular sofa with oak legs',
        price: '2899.00', compareAtPrice: '3499.00', costPrice: '1200.00',
        sku: 'LR-SOF-001', stockQuantity: 12, lowStockThreshold: 3,
        categoryIndex: 0, isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200', alt: 'Havana Modular Sofa front view', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200', alt: 'Havana Modular Sofa detail', isPrimary: false },
        ],
        attributes: { material: 'Bouclé', frame: 'Solid Oak', colors: ['Cream', 'Charcoal', 'Sage Green'] },
      },
      {
        name: 'Arc Floor Lamp',
        slug: 'arc-floor-lamp',
        nameEn: 'Arc Floor Lamp',
        nameAr: 'مصباح أرضي قوسي',
        descriptionEn: 'A dramatic arc floor lamp with a matte black steel base and linen shade. Adjustable height and shade angle. Perfect for reading nooks and living room corners.',
        descriptionAr: 'مصباح أرضي قوسي مثير مع قاعدة من الفولاذ الأسود المطفي وظل من الكتان. ارتفاع وزاوية قابلان للتعديل.',
        shortDescriptionEn: 'Arc floor lamp, matte black steel with linen shade',
        price: '329.00', compareAtPrice: '429.00', costPrice: '120.00',
        sku: 'LG-ARC-001', stockQuantity: 28, lowStockThreshold: 5,
        categoryIndex: 5, isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1513506003901-1e6a35749a5f?w=1200', alt: 'Arc Floor Lamp', isPrimary: true },
        ],
        attributes: { material: 'Steel + Linen', finish: 'Matte Black', height: '175cm' },
      },
      {
        name: 'Marble & Walnut Coffee Table',
        slug: 'marble-walnut-coffee-table',
        nameEn: 'Marble & Walnut Coffee Table',
        nameAr: 'طاولة قهوة من الرخام والجوز',
        descriptionEn: 'A statement coffee table featuring a genuine Calacatta marble top on a hand-crafted solid walnut base. Each piece is unique due to the natural stone veining.',
        descriptionAr: 'طاولة قهوة أنيقة تضم سطحًا من رخام كالاكاتا الحقيقي على قاعدة من خشب الجوز الصلب المصنوع يدويًا.',
        shortDescriptionEn: 'Calacatta marble top on solid walnut base',
        price: '1249.00', compareAtPrice: '1599.00', costPrice: '500.00',
        sku: 'LR-TBL-001', stockQuantity: 7, lowStockThreshold: 3,
        categoryIndex: 0, isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1611486212355-d276af4581c0?w=1200', alt: 'Marble Coffee Table', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200', alt: 'Coffee Table detail', isPrimary: false },
        ],
        attributes: { topMaterial: 'Calacatta Marble', base: 'Solid Walnut', dimensions: '120×60×45 cm' },
      },
      {
        name: 'Oslo Accent Chair',
        slug: 'oslo-accent-chair',
        nameEn: 'Oslo Accent Chair',
        nameAr: 'كرسي أوسلو التزييني',
        descriptionEn: 'Inspired by Scandinavian design, the Oslo accent chair features a curved backrest in hand-stitched leather and solid beech legs. Timeless, elegant, supremely comfortable.',
        descriptionAr: 'مستوحى من التصميم الاسكندنافي، يتميز كرسي أوسلو بمسند ظهر منحنٍ بجلد مخيط يدويًا وأرجل من خشب الزان الصلب.',
        shortDescriptionEn: 'Scandinavian leather accent chair, solid beech legs',
        price: '849.00', compareAtPrice: '1099.00', costPrice: '320.00',
        sku: 'LR-CHR-001', stockQuantity: 18, lowStockThreshold: 4,
        categoryIndex: 0, isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200', alt: 'Oslo Accent Chair', isPrimary: true },
        ],
        attributes: { material: 'Full-grain Leather', legs: 'Solid Beech', colors: ['Cognac', 'Black', 'Ivory'] },
      },

      // BEDROOM
      {
        name: 'Kyoto Platform Bed',
        slug: 'kyoto-platform-bed',
        nameEn: 'Kyoto Platform Bed',
        nameAr: 'سرير كيوتو المنصة',
        descriptionEn: 'Low-profile platform bed with a Japanese-inspired slatted headboard in natural oak. No box spring needed. Available in Queen and King. Clean lines, warm aesthetic.',
        descriptionAr: 'سرير منصة منخفض الارتفاع مع لوح رأس من الخشب الطبيعي مستوحى من اليابان. لا يحتاج إلى صندوق نوم.',
        shortDescriptionEn: 'Japanese-inspired platform bed in solid oak',
        price: '1599.00', compareAtPrice: '1999.00', costPrice: '650.00',
        sku: 'BR-BED-001', stockQuantity: 9, lowStockThreshold: 3,
        categoryIndex: 1, isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200', alt: 'Kyoto Platform Bed', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200', alt: 'Kyoto Bed detail', isPrimary: false },
        ],
        attributes: { material: 'Solid Oak', sizes: ['Queen', 'King'], finish: 'Natural' },
      },
      {
        name: 'Linen Cloud Duvet Set',
        slug: 'linen-cloud-duvet-set',
        nameEn: 'Linen Cloud Duvet Set',
        nameAr: 'طقم لحاف كلاود من الكتان',
        descriptionEn: 'Stone-washed European flax linen duvet cover and pillowcases. Breathable, temperature-regulating, and gets softer with every wash. OEKO-TEX certified.',
        descriptionAr: 'غطاء لحاف وأغطية وسائد من كتان الكتان الأوروبي المغسول بالحجر. مسامي ومنظم للحرارة ويصبح أكثر نعومة مع كل غسيل.',
        shortDescriptionEn: 'Stone-washed linen duvet cover set, OEKO-TEX',
        price: '189.00', compareAtPrice: '249.00', costPrice: '65.00',
        sku: 'BR-LIN-001', stockQuantity: 55, lowStockThreshold: 10,
        categoryIndex: 1, isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200', alt: 'Linen Duvet Set', isPrimary: true },
        ],
        attributes: { material: '100% European Linen', sizes: ['Queen', 'King'], colors: ['Oat', 'Dusty Rose', 'Sage', 'White'] },
      },
      {
        name: 'Walnut Nightstand',
        slug: 'walnut-nightstand',
        nameEn: 'Walnut Nightstand',
        nameAr: 'طاولة سرير من خشب الجوز',
        descriptionEn: 'A minimalist nightstand crafted from solid black walnut with a single deep drawer and open lower shelf. Integrated USB charging port. Built to last generations.',
        descriptionAr: 'طاولة سرير مينيمالية مصنوعة من خشب الجوز الأسود الصلب مع درج عميق واحد ورف سفلي مفتوح ومنفذ شحن USB متكامل.',
        shortDescriptionEn: 'Solid black walnut nightstand with USB charger',
        price: '449.00', compareAtPrice: '549.00', costPrice: '180.00',
        sku: 'BR-NST-001', stockQuantity: 22, lowStockThreshold: 5,
        categoryIndex: 1, isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200', alt: 'Walnut Nightstand', isPrimary: true },
        ],
        attributes: { material: 'Solid Black Walnut', finish: 'Oil', features: ['USB Port', '1 Drawer', 'Open Shelf'] },
      },

      // DINING ROOM
      {
        name: 'Castello Dining Table',
        slug: 'castello-dining-table',
        nameEn: 'Castello Dining Table',
        nameAr: 'طاولة طعام كاستيلو',
        descriptionEn: 'A generous oval dining table with a solid travertine top and bronzed stainless steel base. Seats 6–8 comfortably. A sculptural centrepiece for any dining room.',
        descriptionAr: 'طاولة طعام بيضاوية سخية مع سطح من الحجر الجيري الصلب وقاعدة من الفولاذ المقاوم للصدأ البرونزي. تتسع لـ 6-8 أشخاص بشكل مريح.',
        shortDescriptionEn: 'Oval travertine dining table, seats 6–8',
        price: '3299.00', compareAtPrice: '4199.00', costPrice: '1400.00',
        sku: 'DR-TBL-001', stockQuantity: 5, lowStockThreshold: 2,
        categoryIndex: 2, isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200', alt: 'Castello Dining Table', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1200', alt: 'Dining Table with chairs', isPrimary: false },
        ],
        attributes: { top: 'Travertine', base: 'Bronzed Steel', seats: '6–8', dimensions: '220×110 cm' },
      },
      {
        name: 'Lola Dining Chair',
        slug: 'lola-dining-chair',
        nameEn: 'Lola Dining Chair',
        nameAr: 'كرسي طعام لولا',
        descriptionEn: 'A sophisticated dining chair with a curved back in bouclé fabric, solid ash legs, and subtle brass accents. Stackable for easy storage. Sold individually.',
        descriptionAr: 'كرسي طعام أنيق مع ظهر منحنٍ من قماش البوكليه وأرجل من خشب الرماد الصلب ولمسات نحاسية خفية.',
        shortDescriptionEn: 'Bouclé dining chair with solid ash legs',
        price: '379.00', compareAtPrice: '479.00', costPrice: '140.00',
        sku: 'DR-CHR-001', stockQuantity: 48, lowStockThreshold: 8,
        categoryIndex: 2, isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200', alt: 'Lola Dining Chair', isPrimary: true },
        ],
        attributes: { material: 'Bouclé + Ash', colors: ['Ivory', 'Caramel', 'Forest Green'], stackable: true },
      },

      // HOME OFFICE
      {
        name: 'Studio Standing Desk',
        slug: 'studio-standing-desk',
        nameEn: 'Studio Standing Desk',
        nameAr: 'مكتب ستوديو قابل للرفع',
        descriptionEn: 'Electric height-adjustable desk with a solid bamboo top and powder-coated steel frame. Dual motor, 4 memory presets, anti-collision technology. 140×70 cm desktop.',
        descriptionAr: 'مكتب كهربائي قابل للتعديل بسطح من الخيزران الصلب وإطار من الفولاذ المطلي. محركان مزدوجان وأربعة إعدادات ذاكرة.',
        shortDescriptionEn: 'Electric bamboo standing desk, dual motor',
        price: '799.00', compareAtPrice: '999.00', costPrice: '320.00',
        sku: 'HO-DSK-001', stockQuantity: 20, lowStockThreshold: 4,
        categoryIndex: 3, isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200', alt: 'Studio Standing Desk', isPrimary: true },
        ],
        attributes: { top: 'Solid Bamboo', frame: 'Powder-coated Steel', motorType: 'Dual', colors: ['Black', 'White', 'Silver'] },
      },
      {
        name: 'Ember Ergonomic Chair',
        slug: 'ember-ergonomic-chair',
        nameEn: 'Ember Ergonomic Chair',
        nameAr: 'كرسي إمبر المريح',
        descriptionEn: 'A fully ergonomic task chair with lumbar support, adjustable armrests, headrest, and breathable mesh back. 12-year warranty. Designed to keep you comfortable through long work sessions.',
        descriptionAr: 'كرسي عمل مريح بالكامل مع دعم قطني ومسند ذراع قابل للتعديل ومسند رأس وظهر شبكي قابل للتنفس. ضمان 12 عامًا.',
        shortDescriptionEn: 'Full-mesh ergonomic chair, 12-year warranty',
        price: '649.00', compareAtPrice: '849.00', costPrice: '250.00',
        sku: 'HO-CHR-001', stockQuantity: 31, lowStockThreshold: 6,
        categoryIndex: 3, isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=1200', alt: 'Ember Ergonomic Chair', isPrimary: true },
        ],
        attributes: { back: 'Breathable Mesh', lumbar: true, headrest: true, armrests: '4D', colors: ['Black', 'Grey', 'Navy'] },
      },

      // OUTDOOR
      {
        name: 'Riviera Lounge Set',
        slug: 'riviera-lounge-set',
        nameEn: 'Riviera Lounge Set',
        nameAr: 'مجموعة ريفيرا للاسترخاء',
        descriptionEn: 'A 4-piece all-weather outdoor lounge set with a powder-coated aluminium frame and quick-dry polyester cushions. Includes 2-seater sofa, 2 armchairs, and a coffee table.',
        descriptionAr: 'مجموعة استرخاء خارجية من 4 قطع لجميع الأحوال الجوية مع إطار من الألومنيوم المطلي ووسائد بوليستر سريعة الجفاف.',
        shortDescriptionEn: '4-piece all-weather aluminium lounge set',
        price: '2199.00', compareAtPrice: '2799.00', costPrice: '900.00',
        sku: 'OD-SET-001', stockQuantity: 6, lowStockThreshold: 2,
        categoryIndex: 4, isFeatured: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', alt: 'Riviera Lounge Set', isPrimary: true },
        ],
        attributes: { frame: 'Powder-coated Aluminium', cushions: 'Quick-dry Polyester', pieces: 4, colors: ['Off-White', 'Charcoal'] },
      },
      {
        name: 'Teak Garden Bench',
        slug: 'teak-garden-bench',
        nameEn: 'Teak Garden Bench',
        nameAr: 'مقعد حديقة من خشب الساج',
        descriptionEn: 'Classic 3-seater outdoor bench crafted from sustainably-sourced Grade A teak. Naturally weather-resistant, no treatment needed. Seats 3 adults comfortably.',
        descriptionAr: 'مقعد خارجي كلاسيكي لثلاثة أشخاص مصنوع من خشب الساج الدرجة الأولى المستدام. مقاوم للطقس طبيعيًا، لا يحتاج إلى معالجة.',
        shortDescriptionEn: 'Sustainably-sourced Grade A teak bench',
        price: '589.00', compareAtPrice: '749.00', costPrice: '220.00',
        sku: 'OD-BCH-001', stockQuantity: 14, lowStockThreshold: 3,
        categoryIndex: 4, isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1200', alt: 'Teak Garden Bench', isPrimary: true },
        ],
        attributes: { material: 'Grade A Teak', seats: 3, treatment: 'None required', certified: 'FSC' },
      },

      // LIGHTING
      {
        name: 'Rattan Pendant Light',
        slug: 'rattan-pendant-light',
        nameEn: 'Rattan Pendant Light',
        nameAr: 'مصباح معلق من الروطان',
        descriptionEn: 'Hand-woven natural rattan pendant with a warm amber interior. Creates beautiful, dappled light. Cord length adjustable up to 120 cm. E27 socket, bulb not included.',
        descriptionAr: 'معلق روطان طبيعي منسوج يدويًا مع داخل كهرماني دافئ. يخلق ضوءًا جميلاً ومتلألئًا. طول الحبل قابل للتعديل حتى 120 سم.',
        shortDescriptionEn: 'Hand-woven natural rattan pendant, E27',
        price: '149.00', compareAtPrice: '199.00', costPrice: '50.00',
        sku: 'LG-PND-001', stockQuantity: 42, lowStockThreshold: 8,
        categoryIndex: 5, isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=1200', alt: 'Rattan Pendant Light', isPrimary: true },
        ],
        attributes: { material: 'Natural Rattan', socket: 'E27', cordLength: '120cm', diameter: '45cm' },
      },
      {
        name: 'Marble Table Lamp',
        slug: 'marble-table-lamp',
        nameEn: 'Marble Table Lamp',
        nameAr: 'مصباح طاولة من الرخام',
        descriptionEn: 'A refined table lamp with a solid white marble base and a pleated linen shade. The natural stone base means each lamp is unique. Matte gold fittings. H 48 cm.',
        descriptionAr: 'مصباح طاولة أنيق مع قاعدة من الرخام الأبيض الصلب وظل من الكتان المطوي. قاعدة الحجر الطبيعي تجعل كل مصباح فريدًا.',
        shortDescriptionEn: 'Solid marble base table lamp, pleated linen shade',
        price: '219.00', compareAtPrice: '279.00', costPrice: '80.00',
        sku: 'LG-TBL-001', stockQuantity: 19, lowStockThreshold: 4,
        categoryIndex: 5, isFeatured: false,
        images: [
          { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200', alt: 'Marble Table Lamp', isPrimary: true },
        ],
        attributes: { base: 'White Marble', shade: 'Pleated Linen', fittings: 'Matte Gold', height: '48cm' },
      },
    ];

    const productsCreated = [];
    for (const prod of productData) {
      const [product] = await db.insert(products).values({
        name: prod.name, slug: prod.slug,
        nameEn: prod.nameEn, nameAr: prod.nameAr,
        descriptionEn: prod.descriptionEn, descriptionAr: prod.descriptionAr,
        shortDescriptionEn: prod.shortDescriptionEn,
        description: prod.descriptionEn,
        shortDescription: prod.shortDescriptionEn,
        price: prod.price, compareAtPrice: prod.compareAtPrice ?? null,
        costPrice: prod.costPrice, sku: prod.sku,
        trackInventory: true, stockQuantity: prod.stockQuantity,
        lowStockThreshold: prod.lowStockThreshold,
        isActive: true, isFeatured: prod.isFeatured,
        attributes: prod.attributes,
        metaTitleEn: prod.nameEn,
        metaDescriptionEn: prod.shortDescriptionEn,
      }).returning();

      for (let i = 0; i < prod.images.length; i++) {
        await db.insert(productImages).values({
          productId: product.id,
          url: prod.images[i].url,
          altText: prod.images[i].alt,
          displayOrder: i,
          isPrimary: prod.images[i].isPrimary,
        });
      }

      await db.insert(productCategories).values({
        productId: product.id,
        categoryId: catsCreated[prod.categoryIndex].id,
      });

      productsCreated.push(product);
    }
    console.log(`✅ Created ${productsCreated.length} products`);

    // ── Addresses ──────────────────────────────────────────────────────────────
    console.log('Creating addresses...');
    const addressRows = [];
    const addrData = [
      { city: 'New York', state: 'NY', zip: '10001', addr: '45 Park Avenue', country: 'US' },
      { city: 'Los Angeles', state: 'CA', zip: '90210', addr: '801 Rodeo Drive', country: 'US' },
      { city: 'Chicago', state: 'IL', zip: '60601', addr: '233 Michigan Ave', country: 'US' },
    ];
    for (let i = 0; i < 3; i++) {
      const [addr] = await db.insert(addresses).values({
        userId: customers[i].id,
        type: 'shipping',
        firstName: customers[i].firstName!,
        lastName: customers[i].lastName!,
        address1: addrData[i].addr,
        city: addrData[i].city, state: addrData[i].state,
        postalCode: addrData[i].zip, country: addrData[i].country,
        phone: customers[i].phone!, isDefault: true,
      }).returning();
      addressRows.push(addr);
    }
    console.log(`✅ Created ${addressRows.length} addresses`);

    // ── Orders ─────────────────────────────────────────────────────────────────
    console.log('Creating orders...');
    const lastMonth = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    const orderData2 = [
      {
        userId: customers[0].id, email: customers[0].email, addrIdx: 0,
        status: 'delivered' as const, paymentStatus: 'paid' as const,
        products: [{ product: productsCreated[0], quantity: 1 }, { product: productsCreated[2], quantity: 1 }],
        shippingCost: '0.00', createdAt: new Date(lastMonth.getTime() + 3 * 86400000),
      },
      {
        userId: customers[1].id, email: customers[1].email, addrIdx: 1,
        status: 'delivered' as const, paymentStatus: 'paid' as const,
        products: [{ product: productsCreated[4], quantity: 1 }],
        shippingCost: '0.00', createdAt: new Date(lastMonth.getTime() + 12 * 86400000),
      },
      {
        userId: customers[2].id, email: customers[2].email, addrIdx: 2,
        status: 'delivered' as const, paymentStatus: 'paid' as const,
        products: [{ product: productsCreated[7], quantity: 1 }, { product: productsCreated[8], quantity: 2 }],
        shippingCost: '49.99', createdAt: new Date(lastMonth.getTime() + 22 * 86400000),
      },
      {
        userId: customers[0].id, email: customers[0].email, addrIdx: 0,
        status: 'shipped' as const, paymentStatus: 'paid' as const,
        products: [{ product: productsCreated[9], quantity: 1 }, { product: productsCreated[1], quantity: 1 }],
        shippingCost: '0.00', createdAt: new Date(Date.now() - 10 * 86400000),
      },
      {
        userId: customers[1].id, email: customers[1].email, addrIdx: 1,
        status: 'processing' as const, paymentStatus: 'paid' as const,
        products: [{ product: productsCreated[11], quantity: 1 }, { product: productsCreated[14], quantity: 1 }],
        shippingCost: '0.00', createdAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        userId: customers[2].id, email: customers[2].email, addrIdx: 2,
        status: 'pending' as const, paymentStatus: 'pending' as const,
        products: [{ product: productsCreated[0], quantity: 1 }],
        shippingCost: '0.00', createdAt: new Date(Date.now() - 1 * 86400000),
      },
    ];

    for (const ord of orderData2) {
      const subtotal = ord.products.reduce((s, i) => s + parseFloat(i.product.price) * i.quantity, 0);
      const tax = subtotal * 0.08;
      const total = subtotal + tax + parseFloat(ord.shippingCost);
      const [order] = await db.insert(orders).values({
        orderNumber: generateOrderNumber(),
        userId: ord.userId, email: ord.email,
        status: ord.status, paymentStatus: ord.paymentStatus,
        subtotal: subtotal.toFixed(2), tax: tax.toFixed(2),
        shippingCost: ord.shippingCost, discountAmount: '0',
        total: total.toFixed(2),
        paymentMethod: 'stripe', shippingMethod: 'White Glove Delivery',
        shippingAddressId: addressRows[ord.addrIdx].id,
        billingAddressId: addressRows[ord.addrIdx].id,
        createdAt: ord.createdAt, updatedAt: ord.createdAt,
      }).returning();

      for (const item of ord.products) {
        const p = parseFloat(item.product.price);
        await db.insert(orderItems).values({
          orderId: order.id, productId: item.product.id,
          productName: item.product.name, sku: item.product.sku!,
          quantity: item.quantity, price: p.toFixed(2),
          discount: '0', tax: (p * item.quantity * 0.08).toFixed(2),
          total: (p * item.quantity).toFixed(2),
          createdAt: ord.createdAt,
        });
      }

      await db.insert(orderStatusHistory).values({
        orderId: order.id, status: ord.status,
        note: `Order ${ord.status}`, createdAt: ord.createdAt,
      });
    }
    console.log(`✅ Created ${orderData2.length} orders`);

    // ── Reviews ────────────────────────────────────────────────────────────────
    console.log('Creating reviews...');
    const reviewsData = [
      { prodIdx: 0, userIdx: 0, rating: 5, title: 'Absolute perfection', content: 'The Havana sofa completely transformed our living room. The bouclé fabric is incredibly soft and the modular design made it so easy to configure. Zero regrets.' },
      { prodIdx: 4, userIdx: 1, rating: 5, title: 'Best furniture purchase we\'ve ever made', content: 'The Kyoto bed is stunning in person. Photos don\'t do it justice. The craftsmanship is impeccable and it arrived perfectly packaged. Delivery team were also excellent.' },
      { prodIdx: 7, userIdx: 2, rating: 4, title: 'Jaw-dropping centrepiece', content: 'The Castello table is truly a work of art. Four stars because it took 6 weeks to arrive, but honestly worth the wait. It seats eight of us for dinner without feeling cramped.' },
      { prodIdx: 9, userIdx: 0, rating: 5, title: 'Worth every penny', content: 'I was hesitant about the price for a desk but the Studio Standing Desk has genuinely changed my working life. Smooth, quiet motor, beautiful bamboo top, and the memory presets are spot on.' },
      { prodIdx: 10, userIdx: 1, rating: 5, title: 'My back has never been happier', content: 'I\'ve tried four office chairs over the past decade and the Ember is in a different league. The lumbar support is just right and it stays comfortable after 10+ hours.' },
      { prodIdx: 2, userIdx: 2, rating: 5, title: 'Showstopper', content: 'Every single person who visits asks about this coffee table. The marble veining is unique and the walnut base is the perfect complement. Heavy but worth it.' },
    ];
    for (const r of reviewsData) {
      await db.insert(productReviews).values({
        productId: productsCreated[r.prodIdx].id,
        userId: customers[r.userIdx].id,
        rating: r.rating, title: r.title, content: r.content,
        isVerifiedPurchase: true, isApproved: true,
      });
    }
    console.log(`✅ Created ${reviewsData.length} reviews`);

    // ── Discount Codes ─────────────────────────────────────────────────────────
    console.log('Creating discount codes...');
    await db.insert(discountCodes).values([
      {
        code: 'WELCOME10', type: 'percentage', value: '10',
        minPurchase: '500', maxUses: 200, usesCount: 0,
        maxUsesPerCustomer: 1, isActive: true,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 86400000),
        firstTimeCustomerOnly: true,
      },
      {
        code: 'FREESHIP', type: 'free_shipping', value: '0',
        minPurchase: '800', usesCount: 0,
        maxUsesPerCustomer: 3, isActive: true,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 86400000),
      },
      {
        code: 'LUMINA200', type: 'fixed_amount', value: '200',
        minPurchase: '2000', maxUses: 50, usesCount: 0,
        maxUsesPerCustomer: 1, isActive: true,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 45 * 86400000),
      },
    ]);
    console.log('✅ Created 3 discount codes');

    console.log('\n🎉 Furniture store seed complete!');
    console.log('\n📊 Summary:');
    console.log('   Admin: admin@luminaliving.com / admin123');
    console.log('   Customers: emma.thompson@example.com / customer123');
    console.log(`   ${catsCreated.length} categories, ${productsCreated.length} products, ${orderData2.length} orders`);
    console.log('   Discount codes: WELCOME10, FREESHIP, LUMINA200');

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }

  process.exit(0);
}

seed();
