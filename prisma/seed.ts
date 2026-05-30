import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Makanan' },
      update: {},
      create: { name: 'Makanan', icon: 'utensils' },
    }),
    prisma.category.upsert({
      where: { name: 'Minuman' },
      update: {},
      create: { name: 'Minuman', icon: 'coffee' },
    }),
    prisma.category.upsert({
      where: { name: 'Snack' },
      update: {},
      create: { name: 'Snack', icon: 'cookie' },
    }),
  ]);
  console.log(`✅ ${categories.length} categories seeded`);

  // Seed Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'Admin NyamNyam',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user seeded: ${admin.email}`);

  // Seed Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-1' },
      update: {},
      create: {
        id: 'product-1',
        name: 'Nasi Goreng Spesial',
        description: 'Nasi goreng dengan telur, ayam, dan sayuran segar',
        price: 25000,
        image: 'https://via.placeholder.com/300x200?text=Nasi+Goreng',
        stock: 50,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-2' },
      update: {},
      create: {
        id: 'product-2',
        name: 'Mie Ayam Bakso',
        description: 'Mie ayam dengan bakso kenyal dan kuah gurih',
        price: 20000,
        image: 'https://via.placeholder.com/300x200?text=Mie+Ayam',
        stock: 30,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-3' },
      update: {},
      create: {
        id: 'product-3',
        name: 'Es Teh Manis',
        description: 'Teh manis dingin segar',
        price: 5000,
        image: 'https://via.placeholder.com/300x200?text=Es+Teh',
        stock: 100,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-4' },
      update: {},
      create: {
        id: 'product-4',
        name: 'Jus Alpukat',
        description: 'Jus alpukat segar dengan susu kental manis',
        price: 15000,
        image: 'https://via.placeholder.com/300x200?text=Jus+Alpukat',
        stock: 20,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-5' },
      update: {},
      create: {
        id: 'product-5',
        name: 'Kentang Goreng',
        description: 'Kentang goreng crispy dengan saus sambal',
        price: 12000,
        image: 'https://via.placeholder.com/300x200?text=Kentang+Goreng',
        stock: 40,
        categoryId: categories[2].id,
      },
    }),
  ]);
  console.log(`✅ ${products.length} products seeded`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });