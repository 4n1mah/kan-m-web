import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany();
  await prisma.product.createMany({
    data: [
      {
        name: "Torta Romántica de Fresa",
        description: "Bizcocho artesanal con crema de fresas naturales y pétalos comestibles.",
        category: "cakes",
        imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
        price: 65,
      },
      {
        name: "Macarons Surtidos",
        description: "Doce macarons en sabores de temporada, perfectos para regalo.",
        category: "desserts",
        imageUrl: "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800",
        price: 28,
      },
      {
        name: "Mesa Dulce para Bodas",
        description: "Curaduría completa de postres, cupcakes y detalles para tu evento.",
        category: "events",
        imageUrl: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800",
        price: null,
      },
      {
        name: "Cheesecake de Frutos Rojos",
        description: "Base de galleta de mantequilla y compota casera.",
        category: "desserts",
        imageUrl: "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=800",
        price: 35,
      },
      {
        name: "Naked Cake de Vainilla",
        description: "Estilo rústico con flores frescas y crema chantilly.",
        category: "cakes",
        imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=800",
        price: 70,
      },
      {
        name: "Cupcakes Personalizados",
        description: "Docena decorada al detalle según la temática de tu evento.",
        category: "events",
        imageUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800",
        price: 32,
      },
    ],
  });
  console.log("✅ Seeded");
}

main().finally(() => prisma.$disconnect());
