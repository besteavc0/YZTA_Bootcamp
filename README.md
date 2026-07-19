
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
<img width="400" height="2048" alt="WhatsApp Image 2026-07-19 at 18 55 02" src="https://github.com/user-attachments/assets/6499a30f-fec7-451e-a973-c56493b20a41" />

<img width="400" height="2048" alt="WhatsApp Image 2026-07-19 at 18 55 02 (5)" src="https://github.com/user-attachments/assets/c6538f43-4c49-4dcf-b21d-2298ae624e7c" />

<img width="400" height="2048" alt="WhatsApp Image 2026-07-19 at 18 55 03" src="https://github.com/user-attachments/assets/2c648bb1-63a1-4b67-9d3b-1cd72adc7b26" />

<img width="400" height="2048" alt="WhatsApp Image 2026-07-19 at 18 55 02 (1)" src="https://github.com/user-attachments/assets/52bc15b7-3e77-43f8-a924-414537fca17f" />

<img width="400" height="2048" alt="WhatsApp Image 2026-07-19 at 18 55 01" src="https://github.com/user-attachments/assets/764c309b-b9ba-4194-9154-f1b6933de096" />

<img width="400" height="2048" alt="WhatsApp Image 2026-07-19 at 18 55 01 (1)" src="https://github.com/user-attachments/assets/62918be3-a568-4a01-9940-3933b0f0c56f" />

<img width="400" height="2048" alt="WhatsApp Image 2026-07-19 at 18 55 02 (4)" src="https://github.com/user-attachments/assets/ec177cdd-c381-4b35-88a8-52887f9602aa" />

<img width="400" height="2048" alt="WhatsApp Image 2026-07-19 at 18 55 02 (3)" src="https://github.com/user-attachments/assets/899ef0c2-f9a1-4cc9-85d5-039ab3fd7047" />

<img width="400" height="2048" alt="WhatsApp Image 2026-07-19 at 18 55 02 (2)" src="https://github.com/user-attachments/assets/95fa0cf5-4eaa-4896-8b26-3660d062a352" />



## Ürün Durumu: Ekran Görüntüleri

Ürün Durumu ekran görüntüleri aşağıdaki gibidir.
![Sprint 2 Dashboard UI](sprint2-dashboard.png)
![Sprint 2 Chat UI ve Chat History](sprint2-chat-ui-chat-history.png)

## Sprint Review




## Sprint Retrospective



