const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

// Укажите путь к вашему файлу ключа serviceAccountKey.json
// По умолчанию ищет в этой же папке
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

async function uploadData() {
  try {
    // 1. Загрузка категорий
    const categoriesData = JSON.parse(fs.readFileSync(path.join(__dirname, "data/categories.json"), "utf8"));
    console.log("Загрузка категорий в Firestore...");
    for (const cat of categoriesData) {
      await db.collection("categories").doc(cat.id).set(cat);
      console.log(`Добавлена категория: ${cat.name} (${cat.id})`);
    }

    // 2. Загрузка товаров
    const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, "data/products.json"), "utf8"));
    console.log("Загрузка товаров в Firestore...");
    for (const prod of productsData) {
      await db.collection("products").doc(String(prod.id)).set(prod);
      console.log(`Добавлен товар: ${prod.name} (ID: ${prod.id})`);
    }

    console.log("Выгрузка успешно завершена!");
  } catch (error) {
    console.error("Ошибка при выгрузке:", error);
  }
}

uploadData();
