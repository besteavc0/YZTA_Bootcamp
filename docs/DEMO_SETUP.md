# ERPilot Demo Setup

Bu doküman ERPilot demo ortamını ERPNext ve Dolibarr ile birlikte çalıştırmak için hazırlanmıştır.

## Gereksinimler

- Docker
- Docker Compose
- Git

---

## 1. Projeyi çalıştır

```bash
docker compose up -d
```

Containerların ayağa kalktığını doğrula.

```bash
docker ps
```

---

## 2. ERPNext'e eriş

Tarayıcıdan:

http://localhost:8080

Giriş bilgileri:

- Username: Administrator
- Password: admin

İlk girişten sonra örnek şirket ve demo verilerini oluşturabilirsiniz.

---

## 3. Dolibarr'a eriş

Tarayıcıdan:

http://localhost:8082

İlk kurulum tamamlandıktan sonra:

- Username: admin
- Password: admin

API anahtarını şu menüden oluşturabilirsiniz.

Home → Users & Groups → Users → API Key

---

## 4. Demo verisini yükle

Projedeki seed scriptini çalıştırın.

```bash
docker exec -it erpilot_api python scripts/seed_demo_data.py
```

ERP connector kayıtlarını da oluşturmak isterseniz:

```bash
docker exec -it erpilot_api python scripts/seed_demo_data.py --with-erp-connectors
```

---

## 5. ERP bağlantılarını kaydet

ERPilot arayüzünde

Settings → ERP Connections

sayfasına gidin.

ERPNext bağlantısı

- URL:http://erpnext:8080
- API Key
- API Secret

Dolibarr bağlantısı

- URL:http://dolibarr:80
- API Key

alanlarını doldurarak kaydedin.

---

## Doğrulama

Aşağıdaki servisler çalışıyor olmalıdır.

- ERPilot Web → http://localhost:3000
- ERPilot API → http://localhost:8000
- ERPNext → http://localhost:8080
- Dolibarr → http://localhost:8082
