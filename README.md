# Takım İsmi

Ekip 86

# Takım Üyeleri

- **Beste Avcı** - Product Owner
- **Medine Gül Enser** - Backend Developer
- **Yusuf Eker** - Frontend Developer
- **Hatice Çevik** - Scrum Master

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
- **Daily Scrum:** WhatsApp üzerinden günlük görüşmeler sağlanmıştır. Ekip tek grup olarak ilerlemiştir.

**Toplantı ve WhatsApp Screenshotları**


- **Görev Dağılımı Mantığı:** Backend (P2) ve Frontend (P3) tarafı, mimariyi belirleyen Tech Lead (P1) ile eş zamanlı çalışmıştır. Test ve deployment (P4) her sprint sonunda devreye girmiştir.
- **Sprint 1 Görev Sahipleri:** Beste Avcı (P1), Medine Gül Enser (P2).
- **Sprint 1 board update:** Sprint Board Screenshot:

![Sprint 1 Jira Board](docs/screenshots/sprint1-jira-board.png)

**Sprint 1 Görev Özeti**

| Task | Atanan | SP | Epic |
|------|--------|----|------|
| TASK-001 Monorepo & Docker kurulumu | P1 | 3 | Proje Altyapısı |
| TASK-002 FastAPI iskelet uygulaması | P1 | 2 | Proje Altyapısı |
| TASK-003 PostgreSQL şema + Alembic migration | P2 | 5 | Veritabanı Şeması |
| TASK-004 Demo veri seti & seed script | P2 | 2 | Veritabanı Şeması |
| TASK-005 Connector base interface | P1 | 2 | ERP Connector (CSV) |
