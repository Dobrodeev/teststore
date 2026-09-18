import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os

# Укажите путь к вашему файлу ключа serviceAccountKey.json
# По умолчанию скрипт ищет его в той же папке
cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

if not os.path.exists(cred_path):
    print(f"Ошибка: Файл '{cred_path}' не найден!")
    print("Пожалуйста, скачайте ваш приватный ключ из консоли Firebase (Project Settings -> Service Accounts -> Generate new private key)")
    print("и положите его в эту папку под именем 'serviceAccountKey.json'.")
    exit(1)

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

db = firestore.client()

def download_data():
    try:
        data_dir = os.path.join(os.path.dirname(__file__), "data")
        if not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)

        # 1. Выгрузка категорий
        print("Получение категорий из Firestore...")
        categories_ref = db.collection("categories").stream()
        categories = []
        for doc in categories_ref:
            categories.append(doc.to_dict())

        # Сортировка для стабильности файла
        categories.sort(key=lambda x: x.get("id", ""))

        categories_file = os.path.join(data_dir, "categories.json")
        with open(categories_file, "w", encoding="utf-8") as f:
            json.dump(categories, f, indent=2, ensure_ascii=False)
        print(f"Успешно сохранено {len(categories)} категорий в '{categories_file}'")

        # 2. Выгрузка товаров
        print("Получение товаров из Firestore...")
        products_ref = db.collection("products").stream()
        products = []
        for doc in products_ref:
            data = doc.to_dict()
            if "id" in data:
                try:
                    data["id"] = int(data["id"])
                except (ValueError, TypeError):
                    pass
            products.append(data)

        # Сортировка товаров по числовому ID
        products.sort(key=lambda x: x.get("id", 0))

        products_file = os.path.join(data_dir, "products.json")
        with open(products_file, "w", encoding="utf-8") as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        print(f"Успешно сохранено {len(products)} товаров в '{products_file}'")

        print("Импорт из базы (выгрузка) завершен!")
    except Exception as e:
        print("Ошибка при получении данных:", e)

if __name__ == "__main__":
    download_data()
