import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@kuliner.com' },
    update: {},
    create: {
      email: 'admin@kuliner.com',
      password: adminPassword,
      name: 'Admin Utama',
      role: 'ADMIN',
    },
  });

  // Customer contoh
  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: userPassword,
      name: 'Budi Santoso',
      role: 'CUSTOMER',
    },
  });

  // Categories
  const categories = [
    { name: 'Makanan', icon: '🍔' },
    { name: 'Minuman', icon: '🥤' },
    { name: 'Snack', icon: '🍟' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Products (contoh)
  const foodCat = await prisma.category.findUnique({ where: { name: 'Makanan' } });
  const drinkCat = await prisma.category.findUnique({ where: { name: 'Minuman' } });
  if (foodCat && drinkCat) {
    await prisma.product.createMany({
      data: [
        { name: 'Nasi Goreng', description: 'Nasi goreng spesial', price: 25000, stock: 50, image: 'https://placehold.co/400x300', categoryId: foodCat.id },
        { name: 'Mie Ayam', description: 'Mie ayam bakso', price: 20000, stock: 40, image: 'https://placehold.co/400x300', categoryId: foodCat.id },
        { name: 'Es Teh Manis', description: 'Teh manis dingin', price: 5000, stock: 100, image: 'https://placehold.co/400x300', categoryId: drinkCat.id },
        { name: 'Jus Jeruk', description: 'Jeruk peras', price: 12000, stock: 30, image: 'https://placehold.co/400x300', categoryId: drinkCat.id },
      ],
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());