
# Takım İsmi

Ekip 86

# Takım Üyeleri

- **Beste Avcı** - Product Owner
- **Medine Gül Enser** - Backend Developer
- **Yusuf Eker** - Frontend Developer
- **Hatice Şevik** - Scrum Master

# Ürün İsmi

ERPilot

# Product Backlog URL

[Ekip 86 Jira Backlog](https://ogr-team-k0v7xpmp.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog?atlOrigin=eyJpIjoiYjgwZGI4ZTAwYTU3NDQ5MjgxZjg0Y2UxN2QwODIzYTciLCJwIjoiaiJ9)

# Ürün Açıklaması

ERPilot, işletmelerin ERP verilerini (sipariş, stok, müşteri, finans) doğal dilde Türkçe sorularla sorgulamasını sağlayan yapay zekâ destekli bir asistan platformudur. Kullanıcılar "Bu ay en çok satan ürün hangisi?" gibi sıradan bir soru sorar, ERPilot bu soruyu arka planda SQL sorgusuna çevirip anlaşılır bir yanıt olarak sunar. Ayrıca stok/sipariş verilerindeki anormallikleri otomatik tespit eder, Excel dosyalarını sistemdeki veriyle karşılaştırır ve her gün özet raporlar (digest) üretir.

# Ürün Özellikleri

- Doğal dilde (Türkçe) sorgulama — Text-to-SQL / RAG tabanlı sohbet modülü
- ERP Connector mimarisi — CSV ile başlayıp SAP B1 / Logo gibi sistemlere genişleyebilen eklenti yapısı
- Anomali tespiti — sipariş ve stok verilerinde olağan dışı durumları otomatik yakalayan kural motoru
- Excel karşılaştırma (diff) — yüklenen Excel dosyasını sistemdeki veriyle karşılaştırma
- Günlük özet (digest) — LLM destekli otomatik durum raporu
- Güvenlik & yetkilendirme — Clerk tabanlı auth, rol bazlı erişim (admin/user/viewer), audit log
- Dashboard — rol bazlı metrik kartları ve hızlı erişim ekranı

# Hedef Kitle

- KOBİ ölçekli işletmelerin operasyon, finans ve satış ekipleri
- ERP verisini teknik bilgi gerektirmeden sorgulamak isteyen karar vericiler
- Stok ve sipariş süreçlerinde anomali takibi yapmak isteyen operasyon yöneticileri
- Manuel Excel karşılaştırmasından kurtulmak isteyen finans/muhasebe ekipleri

---

# SPRINT 1

- **Sprint içi puan değerlendirmesi** 39 olarak belirlenmiştir.
- **Puan tamamlama mantığı:** Proje boyunca tamamlanması gereken backlog puanı 115'tir. İlk Sprint için bitirilmesi istenilen puan sayısı 39 olarak belirlenmiştir.
- **Sprint Hedefi:** Docker ile çalışan backend, veritabanı şeması, CSV veri akışı ve ilk çalışan Text-to-SQL sorgusu.
- **Definition of Done:** `docker compose up` tek komutla kalkar; Postman'den chat sorusu atılır ve SQL üretilir.
- **Daily Scrum:** Slack üzerinden günlük görüşmeler sağlanmıştır. Ekip tek grup olarak ilerlemiştir.


- **Görev Dağılımı Mantığı:** Backend (P2) ve Frontend (P3) tarafı, mimariyi belirleyen Tech Lead (P1) ile eş zamanlı çalışmıştır. Test ve deployment (P4) her sprint sonunda devreye girmiştir.
- **Sprint 1 Görev Sahipleri:** Beste Avcı (P1), Medine Gül Enser (P2).
- **Sprint 1 board update:** Sprint Board Screenshot:
![Sprint 1 Jira Board](sprint1-jira-board.png)

**Sprint 1 Görev Özeti**

| Task | Atanan | SP | Epic |
|------|--------|----|------|
| TASK-001 Monorepo & Docker kurulumu | P1 | 3 | Proje Altyapısı |
| TASK-002 FastAPI iskelet uygulaması | P1 | 2 | Proje Altyapısı |
| TASK-003 PostgreSQL şema + Alembic migration | P2 | 5 | Veritabanı Şeması |
| TASK-004 Demo veri seti & seed script | P2 | 2 | Veritabanı Şeması |
| TASK-005 Connector base interface | P1 | 2 | ERP Connector (CSV) |


## Daily Scrum

Daily Scrum toplantıları zaman kısıtları nedeniyle Slack üzerinden yazılı olarak yürütülmüştür. Örnek ekran görüntüleri:

<img src="screenshots/daily-scrum-1.jpeg" width="400">
<img src="screenshots/daily-scrum-2.jpeg" width="400">
<img src="screenshots/daily-scrum-3.jpeg" width="400">
<img src="screenshots/daily-scrum-4.jpeg" width="400">
<img src="screenshots/daily-scrum-5.jpeg" width="400">

## Ürün Durumu: Ekran Görüntüleri

Ürün Durumu ekran görüntüleri, sprint bitimine kadar ilgili görevlerin tamamlanamaması nedeniyle bu sprint raporuna eklenememiştir.


## Sprint Review

Sprint 1 hedefine kısmen ulaşılmıştır.

**Tamamlanan görevler:**
- TASK-001 (Monorepo & Docker kurulumu), TASK-002 (FastAPI iskelet uygulaması), TASK-005 (Connector base interface) tamamlanmış ve GitHub'a yüklenmiştir.
- TASK-014 (Excel servis araştırması & anomali kural tasarımı) POC ve doküman olarak tamamlanmış, kod Sprint 2'de gerçek implementasyona dönüştürülecektir.

**Tamamlanmayan görevler:**
- TASK-003 (PostgreSQL şema + Alembic migration) ve TASK-004 (Demo veri seti & seed script) sprint bitimi itibarıyla tamamlanmamıştır.
- TASK-012 (Next.js proje kurulumu & Clerk entegrasyonu) ve TASK-013 (Temel layout & sidebar) sprint bitimi itibarıyla tamamlanmamıştır.

Bu görevler Sprint 2'ye devredilecek ve öncelikli olarak ele alınacaktır. Backend altyapısının (Docker, FastAPI, connector base) ve Excel/anomali araştırmasının tamamlanmış olması, Sprint 2'nin bu görevler üzerine inşa edilebilmesi açısından olumludur; ancak veritabanı şeması ve frontend kurulumunun eksik kalması Sprint 2'nin başlangıcını geciktirme riski taşımaktadır.

Sprint Review katılımcıları: Beste (Product Owner), Hatice (Scrum Master).


## Sprint Retrospective

- Görev dağılımı, roller net şekilde belirlendi; backend altyapısının temel taşları (Docker, FastAPI, connector base) ve Excel/anomali araştırması zamanında tamamlandı.
- Ekibin bir kısmı sprint görevlerini tamamlayamadı; bu durum Sprint 2'nin bağımlı görevlerini (veritabanı üzerine kurulacak backend işleri, frontend'e bağlı özellikler) geciktirme riski taşıyor. 
- Sprint 2'de değiştirilecek: Görev ilerlemesi daily scrum'da yüzde tamamlanma veya blocker bildirimiyle daha net paylaşılacak; geciken görevler için sprint ortasında bir ara kontrol (mid-sprint check-in) yapılacak; tamamlanamayan görevlerin nedeni (zaman yönetimi mi, teknik engel mi) netleştirilip gerekirse görev yeniden dağıtılacak.

---

# SPRINT 2

- **Sprint içi puan değerlendirmesi** 43 olarak belirlenmiştir.
- **Puan tamamlama mantığı:** Proje boyunca tamamlanması gereken backlog puanı 115'tir. İkinci Sprint için bitirilmesi istenilen puan sayısı 43 olarak belirlenmiştir.
- **Sprint Hedefi:** Kullanılabilir chat arayüzü, anomali paneli, Excel vs ERP karşılaştırma modülü çalışır; Clerk auth ve RBAC aktif; tenant izolasyonu doğrulanır.
- **Definition of Done:** Tarayıcıdan login olunur, soru sorulur, anomaliler görüntülenir, Excel fark raporu üretilir, admin/user rol ayrımı çalışır.
- **Daily Scrum:** Whatsapp üzerinden günlük görüşmeler sağlanmıştır. Ekip tek grup olarak ilerlemiştir.

- **Sprint 2 board update:** Sprint Board Screenshot:
<img width="1400" height="750" alt="Ekran görüntüsü 2026-07-19 220416" src="https://github.com/user-attachments/assets/787a4b27-f3c5-4f0a-b868-d2fef7b580df" />

**Sprint 2 Görev Özeti**

| Task | Atanan | SP | Epic |
|------|--------|----|------|
| TASK-015 Chat UI | P3 | 5 | Chat |
| TASK-016 Sohbet geçmişi | P3 | 2 | Chat |
| TASK-017 Clerk JWT backend | P1 | 3 | Güvenlik |
| TASK-018 RBAC middleware | P1 | 2 | Güvenlik |
| TASK-019 Audit log servisi | P4 | 3 | Güvenlik |
| TASK-020 ERP credential şifreleme | P4 | 2 | Güvenlik |
| TASK-021 Güvenlik & tenant izolasyon testleri | P1 | 2 | Güvenlik |
| TASK-022 Anomali kural motoru | P4 | 5 | Anomali |
| TASK-023 Celery anomali job | P2 | 2 | Anomali |
| TASK-024 Anomali UI | P3 | 3 | Anomali |
| TASK-025 Excel upload backend | P4 | 4 | Excel |
| TASK-026 Excel diff motoru | P4 | 5 | Excel |
| TASK-027 Excel diff UI | P3 | 3 | Excel |
| TASK-028 ERP bağlantı UI | P3 | 2 | ERP |


## Daily Scrum

Daily Scrum toplantıları kolay iletişime geçebilmek nedeniyle Whatsapp üzerinden yazılı olarak yürütülmüştür. Örnek ekran görüntüleri:

<img width="250" height="2048" alt="WhatsApp Image 2026-07-19 at 18 54 58 (3)" src="https://github.com/user-attachments/assets/c852183b-430a-4dcb-9ce9-9b4199e62eee" />
<img width="250" height="2048" alt="WhatsApp Image 2026-07-19 at 18 54 58 (2)" src="https://github.com/user-attachments/assets/61dd74ca-5b2e-4c3a-ac95-92f8eb12ee6f" />
<img width="250" height="2048" alt="WhatsApp Image 2026-07-19 at 18 54 58 (1)" src="https://github.com/user-attachments/assets/217aade0-0d17-49e2-89e9-7857540bde85" />
<img width="250" height="2048" alt="WhatsApp Image 2026-07-19 at 18 54 58" src="https://github.com/user-attachments/assets/89e5c58c-07a0-4b22-92aa-9ee6879b3079" />
<img width="250" height="2048" alt="WhatsApp Image 2026-07-19 at 18 54 58 (8)" src="https://github.com/user-attachments/assets/684681fc-5ebe-43fa-907c-8efa55452e89" />
<img width="250" height="2048" alt="WhatsApp Image 2026-07-19 at 18 54 58 (7)" src="https://github.com/user-attachments/assets/82d55f4a-a3f9-4a0b-9e99-d595780d5258" />
<img width="250" height="2048" alt="WhatsApp Image 2026-07-19 at 18 54 58 (6)" src="https://github.com/user-attachments/assets/9a9c5fe4-1753-4350-b8fa-e30fc2939cd3" />
<img width="250" height="2048" alt="WhatsApp Image 2026-07-19 at 18 54 58 (5)" src="https://github.com/user-attachments/assets/9a84b015-eb9d-41d0-a6f4-ced68c4334c6" />
<img width="250" height="2048" alt="WhatsApp Image 2026-07-19 at 18 54 58 (4)" src="https://github.com/user-attachments/assets/85e744d1-6d2e-4430-a34d-c45aa3766c62" />




## Ürün Durumu: Ekran Görüntüleri

Ürün Durumu ekran görüntüleri aşağıdaki gibidir.
![Sprint 2 Dashboard UI](sprint2-dashboard.png)
![Sprint 2 Chat UI ve Chat History](sprint2-chat-ui-chat-history.png)

## Sprint Review
Sprint 2 hedefine kısmen ulaşıldı.

- Sprint 1'den kalan eksikler bu sprintte tamamlandı. Backend tarafında güvenlik, anomali tespiti ve Excel karşılaştırma özellikleri kod olarak tamamlanıp GitHub'a yüklendi. Anomali tespitinin otomatik periyodik çalışmasını sağlayacak arka plan görevi , bağımlı olduğu anomali motorunun gecikmeli tamamlanması nedeniyle bu sprintte yetiştirilemedi.

- Frontend tarafında Excel yükleme ve Excel yönetim ekranları henüz hazır değil.

- Yazılan backend kodları mantık düzeyinde test edildi, ancak canlı bir ortamda uçtan uca test edilemedi; bu, ilgili altyapının henüz ana koda birleştirilmemiş olmasından kaynaklanıyor.

Sprint Review katılımcıları: Beste (Product Owner), Medine, Yusuf, Hatice (Scrum Master).

## Sprint Retrospective

- Sprint 1'den kalan veritabanı eksikleri kapatıldı; backend tarafında planlanan güvenlik, anomali ve Excel özellikleri kod olarak tamamlandı.

- Bazı görevler birbirine bağımlı olduğu için bir gecikme, sonraki görevi de geciktirdi; frontend tarafında Excel ekranları yetişmedi; ekip genelinde görev durumlarının şeffaf paylaşılmaması sprint sonunda net bir tablo çıkarmayı zorlaştırdı.
  
- Sprint 3'de değiştirilecek: Birbirine bağımlı görevler arasında daha net zamanlama yapılacak; her görev sahibi sprint sonunda kendi durumunu yazılı olarak bildirecek; hazırlanan backend altyapısının ana koda birleştirilmesi önceliklendirilecek ki testler gecikmeden yapılabilsin.

---

# SPRINT 3

- **Sprint içi puan değerlendirmesi** 33 olarak belirlenmiştir.
- **Puan tamamlama mantığı:** Proje boyunca tamamlanması gereken backlog puanı 115'tir. Üçüncü Sprint için bitirilmesi istenilen puan sayısı 33 olarak belirlenmiştir.
- **Sprint Hedefi:** Dashboard tamamlanarak ürün canlı bir URL'ye deploy edilsin ve tüm modüller uçtan uca test edilmesi hedeflenmiştir.
- **Definition of Done:** Canlı URL'den login olunur; tüm özellikler (chat, anomali, Excel diff, digest) çalışır; güvenlik testleri geçer.
- **Daily Scrum:** Whatsapp üzerinden günlük görüşmeler sağlanmıştır. Ekip tek grup olarak ilerlemiştir.

- **Sprint 3 board update:** Sprint Board Screenshot:

 <img width="1422" height="727" alt="sprint 3" src="https://github.com/user-attachments/assets/b7e18a0b-4cd6-49cf-80f5-19870ee89f58" />


**Sprint 3 Görev Özeti**

| Task | Atanan | SP | Epic |
|------|--------|----|------|
| TASK-029 Digest servis & job | P2 | 4 | Digest |
| TASK-030 E-posta (opsiyonel) | P2 | 2 | Digest |
| TASK-031 Digest UI | P3 | 3 | Digest |
| TASK-032 Audit log UI | P3 | 3 | Admin |
| TASK-033 Kullanıcı yönetimi UI | P3 | 2 | Admin |
| TASK-034 Güvenlik akış testi | P1 | 2 | Admin |
| TASK-035 SAP B1 & Logo stub | P2 | 3 | ERP |
| TASK-036 Production deployment | P4 | 4 | Deploy |
| TASK-037 E2E modül testleri & hata giderimi | P4 | 3 | Test |
| TASK-038 Güvenlik & proje dokümantasyonu | P1 | 2 | Docs |
| TASK-039 Dashboard | P3 | 3 | UI |
| TASK-040 Sistem entegrasyon testleri | Tüm | 2 | Test |
| **Toplam** | | **33 SP** | |




## Daily Scrum

Daily Scrum toplantıları kolay iletişime geçebilmek nedeniyle Whatsapp üzerinden yazılı olarak yürütülmüştür. Örnek ekran görüntüleri:

<img width="250" alt="WhatsApp Image 2026-08-02 at 13 39 25" src="https://github.com/user-attachments/assets/0af21fe8-ee5f-4a60-ab7a-aa8b6950b8a3" />
<img width="250" alt="WhatsApp Image 2026-08-02 at 13 39 34" src="https://github.com/user-attachments/assets/41f1434b-e0e1-4ad7-8882-fe3cd815a0f7" />
<img width="250" alt="WhatsApp Image 2026-08-02 at 13 39 34 (1)" src="https://github.com/user-attachments/assets/786efab5-d20c-4bc0-83a2-1e1d8250dfb1" />
<img width="250" alt="WhatsApp Image 2026-08-02 at 13 39 33" src="https://github.com/user-attachments/assets/d4d62653-6748-4077-96c0-f2237416275b" />
<img width="250" alt="WhatsApp Image 2026-08-02 at 13 39 33 (1)" src="https://github.com/user-attachments/assets/4f104620-7c2a-4427-9d40-c683c66c6443" />
<img width="250" alt="WhatsApp Image 2026-08-02 at 13 39 32" src="https://github.com/user-attachments/assets/e339a993-4068-4123-a220-9031a7bff06c" />
<img width="250" alt="WhatsApp Image 2026-08-02 at 13 39 29" src="https://github.com/user-attachments/assets/7163c06a-6cd6-43aa-88d8-6baf83d219bb" />
<img width="250" alt="WhatsApp Image 2026-08-02 at 13 39 28" src="https://github.com/user-attachments/assets/ff3065ff-39ad-4c1f-ac64-c1c7b102bd8a" />


## Ürün Durumu: Ekran Görüntüleri

Ürün Durumu ekran görüntüleri aşağıdaki gibidir.

<img width="1600" height="727" alt="WhatsApp Image 2026-08-02 at 13 29 44" src="https://github.com/user-attachments/assets/4f8a68df-aaf1-4ce9-b72c-10d9a488b7c4" />
<img width="1600" height="723" alt="WhatsApp Image 2026-08-02 at 13 29 44 (1)" src="https://github.com/user-attachments/assets/1de3726f-d3cf-4013-a002-eec7fe8f8132" />
<img width="1600" height="724" alt="WhatsApp Image 2026-08-02 at 13 29 43" src="https://github.com/user-attachments/assets/6c999efc-ec48-4eda-892f-9022e71553e1" />
<img width="1600" height="725" alt="WhatsApp Image 2026-08-02 at 13 29 43 (1)" src="https://github.com/user-attachments/assets/cbdd5595-8493-4a7a-8ec6-0406b890ece7" />

## Sprint Review

Sprint 3 hedefine ulaşıldı.

Günlük özet özelliği, admin panel (audit log ve kullanıcı yönetimi ekranları) ve dashboard tamamlandı. Ürün production ortamına deploy edildi ve canlı URL üzerinden erişilebilir hale geldi. Tüm modüller (sohbet, anomali tespiti, Excel karşılaştırma, günlük özet) uçtan uca test edildi ve güvenlik testleri geçildi.

Sprint Review katılımcıları: Beste (Product Owner), Medine, Yusuf, Hatice (Scrum Master).

## Sprint Retrospective

 Üç sprint boyunca planlanan tüm özellikler tamamlandı ve ürün başarıyla canlıya alındı; ekip, önceki sprintlerdeki gecikme ve iletişim sorunlarını bu sprintte aşarak hedefe ulaştı.
 
 Deployment ve uçtan uca test süreci, birden fazla modülün aynı anda bir araya gelmesini gerektirdiği için dikkatli koordinasyon istedi.

 Proje, planlanan üç sprint sonunda eksiksiz şekilde tamamlandı.

## Kurulum & Çalıştırma

Gereksinim: Docker & Docker Compose.

```bash
git clone https://github.com/besteavc0/YZTA_Bootcamp.git
cd YZTA_Bootcamp
cp .env.example .env        # OPENAI_API_KEY, Clerk ve DB değerlerini doldur
docker compose up -d
curl http://localhost:8000/health  
```

Servisler: `api` (8000, Swagger: `/docs`), `web` (3000), `postgres` (5432),
`redis` (6379), `worker` (Celery).

### Testler

```bash
cd apps/api
pip install -r requirements.txt
DATABASE_URL="postgresql+asyncpg://erpilot:erpilot@localhost:5432/erpilot" \
ENVIRONMENT=development pytest tests/ -v
```

### Ücretsiz ERP Denemesi (Dolibarr)

```bash
docker compose -f docker-compose.dolibarr.yml up -d
# Tarayıcı: http://localhost:8080  (bilgiler: admin / admin)
```
Ayrıntılı rehber: `docs/DOLIBARR_KURULUM.md`

## Teknik Dokümantasyon

| Doküman | İçerik |
|---------|--------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Sistem mimarisi, bileşenler, veri akışı |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Güvenlik mimarisi ve kontroller |
| [`docs/KVKK_DATA_POLICY.md`](docs/KVKK_DATA_POLICY.md) | KVKK veri politikası |
| [`docs/RBAC_MATRIX.md`](docs/RBAC_MATRIX.md) | Rol bazlı erişim matrisi |
| [`docs/SECURITY_TEST_RESULTS.md`](docs/SECURITY_TEST_RESULTS.md) | Güvenlik akış testi sonuçları |
| [`docs/DOLIBARR_KURULUM.md`](docs/DOLIBARR_KURULUM.md) | Ücretsiz ERP kurulum rehberi |
| [`RELEASE_NOTES.md`](RELEASE_NOTES.md) | Sürüm notları ve entegrasyon testi |

## Teknoloji Yığını

Backend: FastAPI, SQLAlchemy (async), Pydantic · AI: OpenAI (gpt-4o-mini),
pgvector (RAG) · Worker: Celery + Redis · DB: PostgreSQL 16 + pgvector ·
Frontend: Next.js + Clerk · Dağıtım: Docker Compose
