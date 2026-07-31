# KVKK Veri Politikası (KVKK_DATA_POLICY.md)

Bu doküman, ERPilot'un 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)
kapsamındaki veri işleme yaklaşımını açıklar. (TASK-038, P1)

> Not: Bu doküman teknik ekip tarafından hazırlanmış bir özet politikadır; hukuki
> bağlayıcılık için bir hukuk danışmanıyla gözden geçirilmesi önerilir.

## 1. İşlenen Veri Kategorileri

ERPilot aşağıdaki veri türlerini işler:

| Kategori | Örnek | Kaynak |
|----------|-------|--------|
| Kimlik/İletişim | kullanıcı adı, e-posta | Clerk (auth) |
| ERP iş verisi | müşteri adı, şehir, sipariş, stok | Bağlı ERP (Dolibarr vb.) |
| Kullanım verisi | sohbet mesajları, sorulan sorular | Uygulama içi |
| Denetim verisi | işlem log'ları (audit) | Uygulama içi |

## 2. İşleme Amaçları

- Kullanıcının doğal dil sorularını yanıtlamak (Text-to-SQL)
- Anomali tespiti ve günlük özet üretimi
- Yetkilendirme ve güvenlik (RBAC, audit)
- Hizmetin çalışması ve iyileştirilmesi

## 3. Hukuki Dayanak

Veri işleme, kullanıcının hizmeti kullanımı kapsamında **sözleşmenin ifası** ve
işletmenin **meşru menfaati** dayanaklarına dayanır. Açık rıza gerektiren durumlar
(ör. pazarlama) bu MVP kapsamında bulunmamaktadır.

## 4. Veri Minimizasyonu

- Yalnızca hizmet için gerekli veriler işlenir.
- ERP verisi canonical şemaya normalize edilerek yalnızca gerekli alanlar tutulur.
- AI'a gönderilen sorgu sonuçları özetleme amacıyla sınırlı tutulur (ilk N satır).

## 5. Çok Kiracılı İzolasyon

Her müşteri (tenant) verisi mantıksal olarak izole edilir. Bir tenant'ın kullanıcısı
başka tenant'ın verisine erişemez (bkz. SECURITY.md, Bölüm 3). Bu, KVKK'nın veri
güvenliği yükümlülüğünü destekler.

## 6. Veri Güvenliği

- ERP kimlik bilgileri şifreli saklanır (Fernet).
- Erişim rol bazlı sınırlandırılır (RBAC).
- Hassas işlemler audit log ile izlenir.
- Sırlar ortam değişkeninde tutulur, kod deposuna girmez.

## 7. Üçüncü Taraf Aktarımı

- **Clerk:** kimlik doğrulama sağlayıcısı (kullanıcı kimlik verisi).
- **OpenAI:** doğal dil işleme için soru ve ilgili veri özetleri gönderilir.
  Hassas kişisel veri gönderimi minimize edilmelidir.
- Bağlı ERP sistemleri: veri kaynağıdır, veri oradan çekilir.

Kullanıcı, hizmeti kullanarak bu aktarımları kabul etmiş sayılır. Üretim öncesi bu
aktarımlar için açık aydınlatma metni yayınlanmalıdır.

## 8. Saklama ve Silme

- Veriler hizmet aktif olduğu sürece saklanır.
- Bir tenant'ın hizmeti sonlandırılırsa, ilgili veriler talep üzerine silinir.
- Silme işlemleri geri döndürülemez şekilde uygulanmalıdır (üretim politikası).

## 9. İlgili Kişi Hakları

KVKK madde 11 kapsamında kullanıcılar; verilerine erişme, düzeltme, silme ve işlemeye
itiraz etme haklarına sahiptir. Talepler ekip üzerinden iletilir.

## 10. Sorumlu

Veri politikası sorumluluğu Product Owner (Beste Avcı) ve Scrum Master (Hatice Şevik)
koordinasyonundadır. Üretim öncesi resmi bir VERBİS kaydı ve aydınlatma metni
gerekebilir.
