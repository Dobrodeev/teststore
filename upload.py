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

def upload_data():
    try:
        # 1. Загрузка категорий
        categories_file = os.path.join(os.path.dirname(__file__), "data", "categories.json")
        if os.path.exists(categories_file):
            print("Загрузка категорий в Firestore...")
            with open(categories_file, "r", encoding="utf-8") as f:
                categories = json.load(f)
                for cat in categories:
                    db.collection("categories").document(cat["id"]).set(cat)
                    print(f"Добавлена категория: {cat['name']} ({cat['id']})")
        else:
            print(f"Ошибка: Файл '{categories_file}' не найден!")
            return

        # 2. Загрузка товаров
        products_file = os.path.join(os.path.dirname(__file__), "data", "products.json")
        if os.path.exists(products_file):
            print("Загрузка товаров в Firestore...")
            with open(products_file, "r", encoding="utf-8") as f:
                products = json.load(f)
                for prod in products:
                    db.collection("products").document(str(prod["id"])).set(prod)
                    print(f"Добавлен товар: {prod['name']} (ID: {prod['id']})")
        else:
            print(f"Ошибка: Файл '{products_file}' не найден!")
            return

        print("Выгрузка успешно завершена!")
    except Exception as e:
        print("Ошибка при выгрузке:", e)

if __name__ == "__main__":
    upload_data()
