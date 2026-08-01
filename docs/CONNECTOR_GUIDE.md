# ERPilot - ERP Connector Geliştirme ve Mimari Kılavuzu

Bu doküman, ERPilot sistemindeki ERP Connector mimarisini, mevcut entegrasyonları, yeni bir connector geliştirme adımlarını ve Faz 2 kapsamında planlanan ticari ERP (SAP B1, Logo) yol haritasını içerir.

---

## 1. Connector Mimarisi

ERPilot, farklı ERP sistemleriyle esnek ve modüler bir şekilde entegre olabilmek için **Plugin Pattern** ve **Registry Design Pattern** kullanır.

- **Base Class (`BaseERPConnector`):** Tüm connector'ların türetildiği soyut üst sınıftır. Tüm connector'ların sağlaması gereken standart arayüzü (interface) ve veri dönüştürme metotlarını tanımlar.
- **Connector Registry (`ConnectorRegistry`):** Sistemdeki tüm aktif connector'ları dinamik olarak kaydeden ve `connector_type` bilgisine göre ilgili sınıfı çağıran merkezi yönetim birimidir.
- **Kanonik Veri Modeli:** Farklı ERP sistemlerinden gelen ham veriler (Müşteri, Sipariş, Stok), ERPilot'ın ortak kanonik veri modellerine (`CanonicalCustomer`, `CanonicalOrder`, `CanonicalInventory`) dönüştürülerek kaydedilir.

---

## 2. Mevcut Connector'lar ve Yapılandırma Şemaları

### 2.1 CSV Connector (`csv`)
- **Açıklama:** Demo ve test ortamları için yerel CSV dosyalarından veri okur.
- **Config Şeması:**
  ```json
  {
    "data_dir": "data/sample"
  }
data_dir (opsiyonel): CSV dosyalarının bulunduğu dizin yolu.

2.2 ERPNext Connector (erpnext)
Açıklama: Frappe / ERPNext REST API üzerinden Müşteri, Sipariş ve Stok verilerini çeker.

Config Şeması:

JSON
{
  "base_url": "http://erpnext:8080",
  "api_key": "your_api_key",
  "api_secret": "your_api_secret"
}
base_url (zorunlu): ERPNext sunucu adresi.

api_key (zorunlu): Administrator / API Kullanıcı anahtarı.

api_secret (zorunlu): API gizli anahtarı.

2.3 Dolibarr Connector (dolibarr)
Açıklama: Dolibarr REST API (/api/index.php) üzerinden veri entegrasyonu sağlar.

Config Şeması:

JSON
{
  "base_url": "http://dolibarr:80",
  "api_key": "your_dolibarr_api_key"
}
base_url (zorunlu): Dolibarr sunucu adresi.

api_key (zorunlu): Dolibarr kullanıcı API anahtarı (DOLAPIKEY).
