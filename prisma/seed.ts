import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcryptjs from "bcryptjs";
import { createClient } from "@libsql/client";

const libsql = createClient({ url: "file:./dev.db" });
const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

// ============================================================================
// HELPERS
// ============================================================================

function hashPassword(plain: string) {
  return bcryptjs.hashSync(plain, 10);
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ============================================================================
// MAIN SEED
// ============================================================================

async function main() {
  console.log("🌱 Seeding database fashion store...");

  // ── CLEAR ALL ──────────────────────────────────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.stockOpnameItem.deleteMany();
  await prisma.stockOpname.deleteMany();
  await prisma.transferItem.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.outboundItem.deleteMany();
  await prisma.outbound.deleteMany();
  await prisma.inboundItem.deleteMany();
  await prisma.inbound.deleteMany();
  await prisma.item.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.location.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log("🧹 Data lama dihapus.");

  // ── USERS ──────────────────────────────────────────────────────────────────
  const pass = hashPassword("password123");

  const users = await Promise.all([
    prisma.user.create({ data: { name: "Siti Aminah",    email: "siti.aminah@fashionru.id",    password: pass, role: "SUPER_ADMIN",  isActive: true } }),
    prisma.user.create({ data: { name: "Dewi Lestari",   email: "dewi.lestari@fashionru.id",   password: pass, role: "ADMIN_GUDANG", isActive: true } }),
    prisma.user.create({ data: { name: "Rina Marlina",   email: "rina.marlina@fashionru.id",   password: pass, role: "SUPERVISOR",   isActive: true } }),
    prisma.user.create({ data: { name: "Fitri Handayani",email: "fitri.handayani@fashionru.id",password: pass, role: "STAFF",        isActive: true } }),

    prisma.user.create({ data: { name: "Andi Prasetyo",  email: "andi.prasetyo@fashionru.id",  password: pass, role: "AUDITOR",      isActive: true } }),
    prisma.user.create({ data: { name: "Hendra Kusuma",  email: "hendra.kusuma@fashionru.id",  password: pass, role: "VIEWER",       isActive: true } }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  const [superAdmin, adminGudang, supervisor, staff1, staff2] = users;

  // ── CATEGORIES ─────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.create({ data: { code: "BJU", name: "Baju & Atasan",      description: "Kemeja, blouse, kaos, tunik, dress" } }),
    prisma.category.create({ data: { code: "CLN", name: "Celana & Rok",       description: "Celana panjang, rok, legging, kulot" } }),
    prisma.category.create({ data: { code: "KRD", name: "Kerudung & Jilbab",  description: "Hijab instan, pashmina, bergo, ciput" } }),
    prisma.category.create({ data: { code: "TAS", name: "Tas Wanita",         description: "Handbag, tote bag, sling bag, dompet" } }),
    prisma.category.create({ data: { code: "SKN", name: "Skincare",           description: "Facial wash, toner, serum, moisturizer, SPF" } }),
    prisma.category.create({ data: { code: "MKP", name: "Makeup & Kosmetik",  description: "Lipstik, bedak, blush on, eyeshadow" } }),
    prisma.category.create({ data: { code: "ACC", name: "Aksesoris",          description: "Gelang, kalung, anting, cincin" } }),
    prisma.category.create({ data: { code: "SPT", name: "Sepatu & Sandal",    description: "Heels, flat shoes, sneakers, sandal" } }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  const [catBaju, catCelana, catKRD, catTas, catSKN, catMKP, catACC, catSPT] = categories;

  // ── LOCATIONS ──────────────────────────────────────────────────────────────
  const locations = await Promise.all([
    prisma.location.create({ data: { code: "GDG-A", name: "Gudang A – Pakaian",    type: "GUDANG",       capacity: 500, used: 210 } }),
    prisma.location.create({ data: { code: "GDG-B", name: "Gudang B – Aksesori",   type: "GUDANG",       capacity: 300, used: 145 } }),
    prisma.location.create({ data: { code: "RAK-01", name: "Rak 01 – Hijab",       type: "RAK",          capacity: 200, used: 130 } }),
    prisma.location.create({ data: { code: "RAK-02", name: "Rak 02 – Tas",         type: "RAK",          capacity: 150, used: 88  } }),
    prisma.location.create({ data: { code: "CS-01",  name: "Cold Storage – Skincare", type: "COLD_STORAGE", capacity: 100, used: 62  } }),
    prisma.location.create({ data: { code: "LD-01",  name: "Loading Dock Utama",   type: "LOADING_DOCK",  capacity: 200, used: 30  } }),
  ]);
  console.log(`✅ Created ${locations.length} locations`);

  const [locGdgA, locGdgB, locRak01, locRak02, locCS01, locLD01] = locations;

  // ── SUPPLIERS ──────────────────────────────────────────────────────────────
  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { code: "SUP-001", name: "CV Batik Nusantara",     contactPerson: "Bapak Hasan",    email: "cs@batiknusantara.co.id",  phone: "021-55501234", city: "Solo",      address: "Jl. Batik No.12, Solo" } }),
    prisma.supplier.create({ data: { code: "SUP-002", name: "PT Hijab Cantik",        contactPerson: "Ibu Rosnah",     email: "order@hijabcantik.id",     phone: "022-77782345", city: "Bandung",   address: "Jl. Dago No.45, Bandung" } }),
    prisma.supplier.create({ data: { code: "SUP-003", name: "Grosir Tas Murah",       contactPerson: "Pak Dodi",       email: "grosir@tasmurah.net",      phone: "031-66603456", city: "Surabaya",  address: "Jl. Tanjung Perak Blok B" } }),
    prisma.supplier.create({ data: { code: "SUP-004", name: "PT Kosmetik Alami",      contactPerson: "Ibu Sari",       email: "info@kosmetikalami.id",    phone: "021-44404567", city: "Jakarta",   address: "Jl. Sudirman No.88, Jakarta" } }),
    prisma.supplier.create({ data: { code: "SUP-005", name: "Distro Muslimah Jogja",  contactPerson: "Ibu Wulan",      email: "distro@muslimah-jgj.com",  phone: "0274-905678", city: "Yogyakarta",address: "Jl. Malioboro No.5, Yogyakarta" } }),
    prisma.supplier.create({ data: { code: "SUP-006", name: "Importir Fashion Seoul", contactPerson: "Pak Andre",      email: "import@seoulmode.co.id",   phone: "021-33306789", city: "Jakarta",   address: "Jl. Gatot Subroto, Jakarta" } }),
    prisma.supplier.create({ data: { code: "SUP-007", name: "Pabrik Tekstil Garut",   contactPerson: "Bapak Ujang",    email: "penjualan@tekstilgarut.id", phone: "0262-807890", city: "Garut",     address: "Jl. Cimanuk No.22, Garut" } }),
  ]);
  console.log(`✅ Created ${suppliers.length} suppliers`);

  const [supBatik, supHijab, supTas, supKosmetik, supMuslimah, supImport, supTekstil] = suppliers;

  // ── ITEMS ──────────────────────────────────────────────────────────────────
  const itemsData = [
    // BAJU & ATASAN
    { sku:"BJU-001", name:"Tunik Batik Sogan",          desc:"Batik premium motif sogan, adem & modis",  cat:catBaju.id,   loc:locGdgA.id,  stock:85,  min:20, unit:"pcs",  price:189000 },
    { sku:"BJU-002", name:"Blouse Ceruti Polos",         desc:"Bahan ceruti premium, cocok casual",       cat:catBaju.id,   loc:locGdgA.id,  stock:120, min:30, unit:"pcs",  price:135000 },
    { sku:"BJU-003", name:"Dress Midi Floral",           desc:"Dress motif bunga, bahan katun rayon",     cat:catBaju.id,   loc:locGdgA.id,  stock:55,  min:15, unit:"pcs",  price:255000 },
    { sku:"BJU-004", name:"Kemeja Oversize Wanita",      desc:"Bahan linen, all size, warna pastel",      cat:catBaju.id,   loc:locGdgA.id,  stock:95,  min:20, unit:"pcs",  price:165000 },
    { sku:"BJU-005", name:"Kaos Polos Combed 30s",       desc:"Cotton combed 30s, ukuran S-XL",           cat:catBaju.id,   loc:locGdgA.id,  stock:200, min:50, unit:"pcs",  price:79000  },
    { sku:"BJU-006", name:"Set Piyama Wanita",           desc:"Bahan katun lembut, motif lucu",           cat:catBaju.id,   loc:locGdgA.id,  stock:60,  min:15, unit:"set",  price:149000 },
    { sku:"BJU-007", name:"Rompi Rajut Korean Style",    desc:"Rajutan premium, tren korea",              cat:catBaju.id,   loc:locGdgA.id,  stock:8,   min:15, unit:"pcs",  price:219000 }, // STOK RENDAH
    { sku:"BJU-008", name:"Cardigan Rajut Panjang",      desc:"Rapi & hangat, bahan knitwear",           cat:catBaju.id,   loc:locGdgA.id,  stock:0,   min:10, unit:"pcs",  price:249000 }, // HABIS

    // CELANA & ROK
    { sku:"CLN-001", name:"Rok Maxi Plisket",            desc:"Rok panjang plisket, warna-warni",         cat:catCelana.id, loc:locGdgA.id,  stock:75,  min:20, unit:"pcs",  price:125000 },
    { sku:"CLN-002", name:"Kulot Linen Wanita",          desc:"Kulot linen adem, nyaman dipakai",         cat:catCelana.id, loc:locGdgA.id,  stock:88,  min:20, unit:"pcs",  price:139000 },
    { sku:"CLN-003", name:"Legging Premium Anti Jerawat",desc:"Kain anti licin, stretch, all size",       cat:catCelana.id, loc:locGdgA.id,  stock:150, min:30, unit:"pcs",  price:89000  },
    { sku:"CLN-004", name:"Celana Palazzo Jumbo",        desc:"Celana lebar, berbahan rayon",             cat:catCelana.id, loc:locGdgA.id,  stock:55,  min:15, unit:"pcs",  price:175000 },
    { sku:"CLN-005", name:"Rok Mini Denim",              desc:"Rok jeans pendek, bahan tidak kaku",       cat:catCelana.id, loc:locGdgA.id,  stock:5,   min:15, unit:"pcs",  price:195000 }, // STOK RENDAH

    // KERUDUNG & JILBAB
    { sku:"KRD-001", name:"Hijab Instan Jersey Premium", desc:"Jersey premium, anti kusut, bertali",      cat:catKRD.id,   loc:locRak01.id, stock:250, min:50, unit:"pcs",  price:45000  },
    { sku:"KRD-002", name:"Pashmina Crepe Polos",        desc:"Crepe lembut, panjang 75x180cm",           cat:catKRD.id,   loc:locRak01.id, stock:180, min:40, unit:"pcs",  price:55000  },
    { sku:"KRD-003", name:"Bergo Syari Kaos",            desc:"Full cover, bahan kaos stretch",           cat:catKRD.id,   loc:locRak01.id, stock:95,  min:25, unit:"pcs",  price:65000  },
    { sku:"KRD-004", name:"Jilbab Voal Laser Cut",       desc:"Voal premium, pinggiran laser cut",        cat:catKRD.id,   loc:locRak01.id, stock:130, min:30, unit:"pcs",  price:85000  },
    { sku:"KRD-005", name:"Ciput Ninja Anti Pusing",     desc:"Inner hijab, bahan kaos",                  cat:catKRD.id,   loc:locRak01.id, stock:300, min:60, unit:"pcs",  price:25000  },
    { sku:"KRD-006", name:"Hijab Motif Batik Modern",    desc:"Kombinasi batik & polos, kekinian",        cat:catKRD.id,   loc:locRak01.id, stock:12,  min:20, unit:"pcs",  price:95000  }, // STOK RENDAH
    { sku:"KRD-007", name:"Pashmina Satin Glossy",       desc:"Kilap mewah, cocok formal",                cat:catKRD.id,   loc:locRak01.id, stock:0,   min:15, unit:"pcs",  price:75000  }, // HABIS

    // TAS WANITA
    { sku:"TAS-001", name:"Tote Bag Kanvas Premium",     desc:"Kanvas tebal, serbaguna, warna pastel",    cat:catTas.id,   loc:locRak02.id, stock:55,  min:15, unit:"pcs",  price:185000 },
    { sku:"TAS-002", name:"Sling Bag Mini Kulit Sintetis",desc:"Tas selempang kecil, modis",             cat:catTas.id,   loc:locRak02.id, stock:38,  min:10, unit:"pcs",  price:249000 },
    { sku:"TAS-003", name:"Handbag Formal Cewek",        desc:"Tas jinjing formal, cocok kerja",          cat:catTas.id,   loc:locRak02.id, stock:22,  min:10, unit:"pcs",  price:375000 },
    { sku:"TAS-004", name:"Dompet Wanita Zipper",        desc:"Kulit sintetis, banyak slot kartu",        cat:catTas.id,   loc:locRak02.id, stock:80,  min:20, unit:"pcs",  price:125000 },
    { sku:"TAS-005", name:"Backpack Aesthetic Wanita",   desc:"Tas ransel lucu, kapasitas besar",         cat:catTas.id,   loc:locRak02.id, stock:7,   min:10, unit:"pcs",  price:295000 }, // STOK RENDAH

    // SKINCARE
    { sku:"SKN-001", name:"Facial Wash Brightening",     desc:"Sabun cuci muka cerahkan kulit, 100ml",    cat:catSKN.id,   loc:locCS01.id,  stock:90,  min:20, unit:"pcs",  price:89000  },
    { sku:"SKN-002", name:"Toner Niacinamide 10%",       desc:"Toner pori, kontrol minyak, 150ml",        cat:catSKN.id,   loc:locCS01.id,  stock:75,  min:20, unit:"pcs",  price:129000 },
    { sku:"SKN-003", name:"Serum Vitamin C Glow",        desc:"Serum anti kusam, brightening, 30ml",      cat:catSKN.id,   loc:locCS01.id,  stock:60,  min:15, unit:"pcs",  price:189000 },
    { sku:"SKN-004", name:"Moisturizer SPF 35",          desc:"Pelembab sekaligus sunscreen, 50ml",        cat:catSKN.id,   loc:locCS01.id,  stock:45,  min:15, unit:"pcs",  price:149000 },
    { sku:"SKN-005", name:"Sunscreen Body Lotion",       desc:"Lotion UV protection, 200ml",              cat:catSKN.id,   loc:locCS01.id,  stock:110, min:25, unit:"pcs",  price:79000  },
    { sku:"SKN-006", name:"Sheet Mask Collagen",         desc:"Masker wajah kolagen, per lusin",          cat:catSKN.id,   loc:locCS01.id,  stock:8,   min:20, unit:"box",  price:95000  }, // STOK RENDAH

    // MAKEUP
    { sku:"MKP-001", name:"Lipstik Matte Halal",         desc:"Lipstik matte tahan lama, BPOM",           cat:catMKP.id,   loc:locGdgB.id,  stock:120, min:30, unit:"pcs",  price:79000  },
    { sku:"MKP-002", name:"Bedak Tabur Transparan",       desc:"Setting powder, coverage natural",         cat:catMKP.id,   loc:locGdgB.id,  stock:85,  min:20, unit:"pcs",  price:99000  },
    { sku:"MKP-003", name:"Blush On Peachy",             desc:"Blush on warna peachy, natural",            cat:catMKP.id,   loc:locGdgB.id,  stock:50,  min:15, unit:"pcs",  price:89000  },
    { sku:"MKP-004", name:"Maskara Waterproof",          desc:"Bulu mata tebal, tahan air",               cat:catMKP.id,   loc:locGdgB.id,  stock:60,  min:15, unit:"pcs",  price:69000  },
    { sku:"MKP-005", name:"Eyeshadow Palette 12 Warna",  desc:"Palette eyeshadow versatile, pigmented",   cat:catMKP.id,   loc:locGdgB.id,  stock:0,   min:10, unit:"pcs",  price:199000 }, // HABIS

    // AKSESORIS
    { sku:"ACC-001", name:"Gelang Emas Lapis",           desc:"Gelang wanita, gold plated",               cat:catACC.id,   loc:locGdgB.id,  stock:45,  min:10, unit:"pcs",  price:125000 },
    { sku:"ACC-002", name:"Anting Mutiara Elegan",       desc:"Anting mutiara sintetis, classy",           cat:catACC.id,   loc:locGdgB.id,  stock:60,  min:15, unit:"pcs",  price:95000  },
    { sku:"ACC-003", name:"Kalung Tali Emas Lapis",      desc:"Kalung minimalis, cocok daily",             cat:catACC.id,   loc:locGdgB.id,  stock:35,  min:10, unit:"pcs",  price:115000 },

    // SEPATU
    { sku:"SPT-001", name:"Flat Shoes Wanita Slip-On",   desc:"Sepatu slip on kulit sintetis, nyaman",    cat:catSPT.id,   loc:locGdgA.id,  stock:40,  min:10, unit:"pcs",  price:195000 },
    { sku:"SPT-002", name:"Sandal Wedges Platform",      desc:"Wedges cantik, tinggi 7cm",                cat:catSPT.id,   loc:locGdgA.id,  stock:25,  min:10, unit:"pcs",  price:245000 },
    { sku:"SPT-003", name:"Sneakers Wanita Putih",       desc:"Sneakers all white, casual modis",         cat:catSPT.id,   loc:locGdgA.id,  stock:3,   min:10, unit:"pcs",  price:275000 }, // STOK RENDAH
  ];

  const items = await Promise.all(itemsData.map(d => {
    const status = d.stock === 0 ? "HABIS" : d.stock <= d.min ? "STOK_RENDAH" : "TERSEDIA";
    return prisma.item.create({
      data: {
        sku: d.sku, name: d.name, description: d.desc,
        categoryId: d.cat, locationId: d.loc,
        stock: d.stock, minStock: d.min, unit: d.unit, price: d.price,
        status,
      },
    });
  }));
  console.log(`✅ Created ${items.length} items`);

  // ── INDEX HELPER ───────────────────────────────────────────────────────────
  function item(sku: string) {
    return items.find(i => i.sku === sku)!;
  }

  // ── INBOUND ────────────────────────────────────────────────────────────────
  const inbounds = await Promise.all([
    prisma.inbound.create({
      data: {
        poNumber:   "PO-2025-001",
        date:       daysAgo(30),
        supplierId: supBatik.id,
        receiverId: staff1.id,
        status:     "DISIMPAN",
        totalValue: 200 * 189000,
        notes:      "Pembelian tunik batik koleksi baru",
        items: { create: [
          { itemId: item("BJU-001").id, quantity: 200, price: 189000 },
          { itemId: item("BJU-002").id, quantity: 150, price: 135000 },
        ]},
      },
    }),
    prisma.inbound.create({
      data: {
        poNumber:   "PO-2025-002",
        date:       daysAgo(25),
        supplierId: supHijab.id,
        receiverId: staff2.id,
        status:     "DISIMPAN",
        totalValue: 500 * 45000,
        notes:      "Restock hijab instan & pashmina",
        items: { create: [
          { itemId: item("KRD-001").id, quantity: 500, price: 45000 },
          { itemId: item("KRD-002").id, quantity: 300, price: 55000 },
          { itemId: item("KRD-004").id, quantity: 200, price: 85000 },
        ]},
      },
    }),
    prisma.inbound.create({
      data: {
        poNumber:   "PO-2025-003",
        date:       daysAgo(20),
        supplierId: supTas.id,
        receiverId: adminGudang.id,
        status:     "DIPERIKSA",
        totalValue: 100 * 185000,
        notes:      "Koleksi tas baru musim semi",
        items: { create: [
          { itemId: item("TAS-001").id, quantity: 100, price: 185000 },
          { itemId: item("TAS-002").id, quantity: 60,  price: 249000 },
          { itemId: item("TAS-004").id, quantity: 120, price: 125000 },
        ]},
      },
    }),
    prisma.inbound.create({
      data: {
        poNumber:   "PO-2025-004",
        date:       daysAgo(15),
        supplierId: supKosmetik.id,
        receiverId: staff1.id,
        status:     "DISIMPAN",
        totalValue: 200 * 89000,
        notes:      "Restock skincare & makeup halal",
        items: { create: [
          { itemId: item("SKN-001").id, quantity: 200, price: 89000  },
          { itemId: item("SKN-002").id, quantity: 150, price: 129000 },
          { itemId: item("SKN-003").id, quantity: 120, price: 189000 },
          { itemId: item("MKP-001").id, quantity: 250, price: 79000  },
        ]},
      },
    }),
    prisma.inbound.create({
      data: {
        poNumber:   "PO-2025-005",
        date:       daysAgo(7),
        supplierId: supMuslimah.id,
        receiverId: staff2.id,
        status:     "DITERIMA",
        totalValue: 300 * 125000,
        notes:      "Dress & rok maxi koleksi lebaran",
        items: { create: [
          { itemId: item("BJU-003").id, quantity: 100, price: 255000 },
          { itemId: item("CLN-001").id, quantity: 150, price: 125000 },
          { itemId: item("CLN-002").id, quantity: 120, price: 139000 },
        ]},
      },
    }),
    prisma.inbound.create({
      data: {
        poNumber:   "PO-2025-006",
        date:       daysAgo(3),
        supplierId: supImport.id,
        receiverId: adminGudang.id,
        status:     "PENDING",
        totalValue: 50 * 295000,
        notes:      "Import koleksi korean style",
        items: { create: [
          { itemId: item("BJU-007").id, quantity: 80,  price: 219000 },
          { itemId: item("TAS-005").id, quantity: 50,  price: 295000 },
        ]},
      },
    }),
  ]);
  console.log(`✅ Created ${inbounds.length} inbound transactions`);

  // ── OUTBOUND ───────────────────────────────────────────────────────────────
  const outbounds = await Promise.all([
    prisma.outbound.create({
      data: {
        soNumber:     "SO-2025-001",
        date:         daysAgo(28),
        destination:  "Toko Rizky Fashion – Bandung",
        shipperId:    staff1.id,
        status:       "DIKIRIM",
        totalValue:   50 * 189000,
        items: { create: [
          { itemId: item("BJU-001").id, quantity: 50,  price: 189000 },
          { itemId: item("KRD-001").id, quantity: 100, price: 45000  },
        ]},
      },
    }),
    prisma.outbound.create({
      data: {
        soNumber:     "SO-2025-002",
        date:         daysAgo(22),
        destination:  "Butik Elegan – Surabaya",
        shipperId:    staff2.id,
        status:       "DIKIRIM",
        totalValue:   30 * 375000,
        items: { create: [
          { itemId: item("TAS-003").id, quantity: 20,  price: 375000 },
          { itemId: item("TAS-002").id, quantity: 30,  price: 249000 },
        ]},
      },
    }),
    prisma.outbound.create({
      data: {
        soNumber:     "SO-2025-003",
        date:         daysAgo(18),
        destination:  "Reseller Online – Tokopedia",
        shipperId:    staff1.id,
        status:       "DIKIRIM",
        totalValue:   80 * 89000,
        items: { create: [
          { itemId: item("SKN-001").id, quantity: 80,  price: 89000  },
          { itemId: item("SKN-002").id, quantity: 60,  price: 129000 },
          { itemId: item("MKP-001").id, quantity: 100, price: 79000  },
        ]},
      },
    }),
    prisma.outbound.create({
      data: {
        soNumber:     "SO-2025-004",
        date:         daysAgo(12),
        destination:  "Hijab Corner – Yogyakarta",
        shipperId:    staff2.id,
        status:       "DIKEMAS",
        totalValue:   200 * 55000,
        items: { create: [
          { itemId: item("KRD-002").id, quantity: 200, price: 55000  },
          { itemId: item("KRD-003").id, quantity: 80,  price: 65000  },
          { itemId: item("KRD-004").id, quantity: 100, price: 85000  },
        ]},
      },
    }),
    prisma.outbound.create({
      data: {
        soNumber:     "SO-2025-005",
        date:         daysAgo(6),
        destination:  "Fashion Store – Jakarta Selatan",
        shipperId:    adminGudang.id,
        status:       "DISETUJUI",
        totalValue:   40 * 249000,
        items: { create: [
          { itemId: item("CLN-001").id, quantity: 40,  price: 125000 },
          { itemId: item("CLN-002").id, quantity: 50,  price: 139000 },
          { itemId: item("BJU-004").id, quantity: 60,  price: 165000 },
        ]},
      },
    }),
    prisma.outbound.create({
      data: {
        soNumber:     "SO-2025-006",
        date:         daysAgo(1),
        destination:  "Marketplace Shopee Flash Sale",
        shipperId:    staff1.id,
        status:       "PENDING",
        totalValue:   150 * 45000,
        items: { create: [
          { itemId: item("KRD-001").id, quantity: 150, price: 45000  },
          { itemId: item("KRD-005").id, quantity: 200, price: 25000  },
        ]},
      },
    }),
  ]);
  console.log(`✅ Created ${outbounds.length} outbound transactions`);

  // ── TRANSFERS ──────────────────────────────────────────────────────────────
  const transfers = await Promise.all([
    prisma.transfer.create({
      data: {
        transferNumber: "TRF-2025-001",
        date:           daysAgo(20),
        fromLocationId: locGdgA.id,
        toLocationId:   locRak01.id,
        status:         "SELESAI",
        transferById:   supervisor.id,
        notes:          "Pindah hijab ke rak display",
        items: { create: [
          { itemId: item("KRD-001").id, quantity: 100 },
          { itemId: item("KRD-002").id, quantity: 80  },
        ]},
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: "TRF-2025-002",
        date:           daysAgo(14),
        fromLocationId: locLD01.id,
        toLocationId:   locGdgB.id,
        status:         "SELESAI",
        transferById:   staff1.id,
        notes:          "Unloading tas dari loading dock",
        items: { create: [
          { itemId: item("TAS-001").id, quantity: 50 },
          { itemId: item("TAS-002").id, quantity: 30 },
        ]},
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: "TRF-2025-003",
        date:           daysAgo(5),
        fromLocationId: locLD01.id,
        toLocationId:   locCS01.id,
        status:         "DIPROSES",
        transferById:   staff2.id,
        notes:          "Skincare baru masuk cold storage",
        items: { create: [
          { itemId: item("SKN-001").id, quantity: 100 },
          { itemId: item("SKN-003").id, quantity: 60  },
        ]},
      },
    }),
    prisma.transfer.create({
      data: {
        transferNumber: "TRF-2025-004",
        date:           daysAgo(1),
        fromLocationId: locGdgA.id,
        toLocationId:   locRak02.id,
        status:         "PENDING",
        transferById:   supervisor.id,
        notes:          "Display tas baru di rak 02",
        items: { create: [
          { itemId: item("TAS-004").id, quantity: 40 },
        ]},
      },
    }),
  ]);
  console.log(`✅ Created ${transfers.length} transfers`);

  // ── STOCK OPNAME ───────────────────────────────────────────────────────────
  const opnames = await Promise.all([
    prisma.stockOpname.create({
      data: {
        opnameNumber: "OPN-2025-001",
        date:         daysAgo(45),
        locationId:   locGdgA.id,
        auditorId:    users[5].id, // Auditor
        status:       "DISETUJUI",
        notes:        "Opname rutin gudang A bulan lalu",
        items: { create: [
          { itemId: item("BJU-001").id, systemStock: 90,  physicalStock: 88,  difference: -2 },
          { itemId: item("BJU-002").id, systemStock: 125, physicalStock: 125, difference:  0 },
          { itemId: item("CLN-001").id, systemStock: 80,  physicalStock: 79,  difference: -1 },
        ]},
      },
    }),
    prisma.stockOpname.create({
      data: {
        opnameNumber: "OPN-2025-002",
        date:         daysAgo(20),
        locationId:   locRak01.id,
        auditorId:    users[5].id,
        status:       "SELESAI",
        notes:        "Opname rak hijab",
        items: { create: [
          { itemId: item("KRD-001").id, systemStock: 260, physicalStock: 250, difference: -10 },
          { itemId: item("KRD-002").id, systemStock: 185, physicalStock: 185, difference:   0 },
        ]},
      },
    }),
    prisma.stockOpname.create({
      data: {
        opnameNumber: "OPN-2025-003",
        date:         daysAgo(5),
        locationId:   locCS01.id,
        auditorId:    users[5].id,
        status:       "DALAM_PROSES",
        notes:        "Opname cold storage skincare",
        items: { create: [
          { itemId: item("SKN-001").id, systemStock: 90,  physicalStock: 90,  difference:  0 },
          { itemId: item("SKN-002").id, systemStock: 75,  physicalStock: 73,  difference: -2 },
        ]},
      },
    }),
  ]);
  console.log(`✅ Created ${opnames.length} stock opnames`);

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
  const notifData = [
    { type:"STOCK",       title:"Stok Hampir Habis!",       message:"Rompi Rajut Korean Style (BJU-007) tinggal 8 pcs, segera restock.",          userId: adminGudang.id },
    { type:"STOCK",       title:"Stok Kritis!",             message:"Sneakers Wanita Putih (SPT-003) hanya tersisa 3 pcs.",                        userId: adminGudang.id },
    { type:"STOCK",       title:"Barang Habis!",            message:"Cardigan Rajut Panjang (BJU-008) sudah habis, siapkan PO baru.",              userId: superAdmin.id  },
    { type:"STOCK",       title:"Barang Habis!",            message:"Pashmina Satin Glossy (KRD-007) kehabisan stok.",                             userId: adminGudang.id },
    { type:"STOCK",       title:"Barang Habis!",            message:"Eyeshadow Palette 12 Warna (MKP-005) habis terjual.",                         userId: adminGudang.id },
    { type:"TRANSACTION", title:"PO Baru Diterima",          message:"PO-2025-006 dari Importir Fashion Seoul sudah masuk, menunggu konfirmasi.",   userId: supervisor.id  },
    { type:"TRANSACTION", title:"Pengiriman SO-2025-001",    message:"Pengiriman ke Toko Rizky Fashion Bandung sudah selesai.",                     userId: superAdmin.id  },
    { type:"TRANSACTION", title:"SO Flash Sale Dibuat",      message:"SO-2025-006 untuk Flash Sale Shopee sudah dibuat, menunggu pengemasan.",      userId: staff1.id      },
    { type:"WARNING",     title:"Kapasitas Gudang A 42%",    message:"Gudang A sudah terpakai 210/500 slot. Pantau terus.",                        userId: supervisor.id  },
    { type:"SUCCESS",     title:"Opname Disetujui",          message:"Stok opname OPN-2025-001 telah disetujui oleh supervisor.",                  userId: users[5].id    },
    { type:"INFO",        title:"Supplier Baru Terdaftar",   message:"Pabrik Tekstil Garut berhasil ditambahkan sebagai supplier.",                 userId: superAdmin.id  },
    { type:"WARNING",     title:"Sheet Mask Hampir Habis",   message:"Sheet Mask Collagen (SKN-006) tersisa 8 box, minimum stok 20.",              userId: adminGudang.id },
    { type:"SUCCESS",     title:"Restock Hijab Berhasil",    message:"Restock 500 pcs hijab instan dari PT Hijab Cantik selesai disimpan.",        userId: staff2.id      },
    { type:"INFO",        title:"Transfer Selesai",          message:"TRF-2025-001 tas dari loading dock ke Gudang B sudah selesai.",               userId: supervisor.id  },
    { type:"TRANSACTION", title:"PO Skincare Selesai",       message:"PO-2025-004 skincare & makeup dari PT Kosmetik Alami disimpan.",             userId: staff1.id      },
  ];

  const notifs = await Promise.all(notifData.map(d =>
    prisma.notification.create({ data: d })
  ));
  console.log(`✅ Created ${notifs.length} notifications`);

  console.log("\n🎉 Seeding fashion store selesai!");
  console.log("─".repeat(50));
  console.log("📧 Login: siti.aminah@fashionru.id | password123");
  console.log("─".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
