const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

// Укажите путь к вашему файлу ключа serviceAccountKey.json
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Ошибка: Файл '${serviceAccountPath}' не найден!`);
  console.error("Пожалуйста, скачайте ваш приватный ключ из консоли Firebase (Project Settings -> Service Accounts -> Generate new private key)");
  console.error("и положите его в эту папку под именем 'serviceAccountKey.json'.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function downloadData() {
  try {
    const dataDir = path.join(__dirname, "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 1. Выгрузка категорий
    console.log("Получение категорий из Firestore...");
    const categoriesSnapshot = await db.collection("categories").get();
    const categories = [];
    categoriesSnapshot.forEach(doc => {
      categories.push(doc.data());
    });

    // Сортировка категорий для стабильности файла (например, по ID)
    categories.sort((a, b) => {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });

    const categoriesPath = path.join(dataDir, "categories.json");
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2), "utf8");
    console.log(`Успешно сохранено ${categories.length} категорий в '${categoriesPath}'`);

    // 2. Выгрузка товаров
    console.log("Получение товаров из Firestore...");
    const productsSnapshot = await db.collection("products").get();
    const products = [];
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      // Убедимся, что ID числовой, если в файле он был числовым
      if (data.hasOwnProperty("id") && !isNaN(data.id)) {
        data.id = Number(data.id);
      }
      products.push(data);
    });

    // Сортировка товаров по числовому ID
    products.sort((a, b) => a.id - b.id);

    const productsPath = path.join(dataDir, "products.json");
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), "utf8");
    console.log(`Успешно сохранено ${products.length} товаров в '${productsPath}'`);

    console.log("Импорт из базы (выгрузка) завершен!");
  } catch (error) {
    console.error("Ошибка при получении данных:", error);
  }
}

downloadData();
