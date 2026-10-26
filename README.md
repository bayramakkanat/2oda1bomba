# 2 Oda 1 Bomba – Telefon Kart & Ortak Saat Uygulaması (v0.4 – Fiziksel Dostu, Gri Rol Yok)

Bu uygulama, **Two Rooms and a Boom (2 Oda 1 Bomba)** oyununu ekrana boğmadan oynatmak için yapılmış bir yardımcıdır. Telefon sadece **cebindeki gizli kart** ve **odalar arasında ortak geri sayım saati** olarak çalışır. Lider seçimi, darbe girişimleri, rehine pazarlığı, Ajan sorguları ve oda değişimi tamamen yüz yüze, fiziksel olarak yapılır.

**v0.4 değişikliği:** Gri roller (Stajyer, Maktül, Kumarbaz) oyundan çıkarıldı. Sadece **Sarhoş** kaldı.

---

## Oynanış

1. **Kurulum:** Moderatör oyunu kurar (isteğe bağlı kendi kodunu yazar), oyuncular kodla katılır. Moderatör **Tur Sayısı**nı seçer ve **Kartları Dağıt** der. En az 6 oyuncu gerekir. Oyun **her zaman çift sayıda oyuncuyla** oynanır: tek sayıda kişi varsa moderatör oyuna girmeden yönetir (dağıtırken onay sorulur).
2. **Başlangıç odası:** Herkesin ekranında A ya da B odası yazar. Oyuncular odalarına geçer, moderatör **1. Turu Başlat** der.
3. **Tur:** Tüm telefonlarda aynı geri sayım çalar. Süre dolunca ses ve titreşim gelir: *"n. TUR BİTTİ! X rehine seçip odaları değiştirin."* Oda liderleri rehineleri seçer ve gönderir. Bu aşama için **45 saniyelik** sayaç çalışır, bitince yeni tur kendiliğinden başlar (moderatör erken de başlatabilir).
4. **Son tur:** Süre dolunca *"OYUN BİTTİ! Son X rehineyi odalarına gönderin, sonra herkes tek bir salonda toplansın."* mesajı gelir. Moderatör **Sonuçları ve Kartları Aç** der, herkesin kartı açılır.
5. **Kazanan (fiziksel):** Başkan ve Bombacı **aynı odadaysa KIRMIZI**, **farklı odalardaysa MAVİ** kazanır. Uygulama odaları takip etmez, sonuç ekranı kuralı hatırlatır ve herkesin rolünü listeler.

### Rehine ve süreler

| Mod | Rehine sayıları | Tur süreleri |
|---|---|---|
| 3 tur (basit) | 3 - 2 - 1 | 3 - 2 - 1 dk |
| 5 tur | 5 - 4 - 3 - 2 - 1 | 5 - 4 - 3 - 2 - 1 dk |

Küçük oyunlarda rehine sayısı, odada lider dışında yeterince kişi kalsın diye **oyuncu sayısının yarısı − 1** ile sınırlanır (örn. 6-7 oyuncuda en fazla 2, 8-9 oyuncuda en fazla 3).

---

## Deste

Başkan + Bombacı her zaman vardır. **Ajanlar** (Mavi + Kırmızı) ve **Casuslar** (Mavi + Kırmızı) çift olarak açılıp kapatılır. Kalan oyuncular düz Mavi/Kırmızı takım kartı olur; iki takım **her zaman eşit** bölünür. Düz Mavi ve Kırmızı sayıları elle girilirse birini yazınca diğeri aynı sayıya eşlenir.

**Çift sayı kuralı:** Moderatör katılıyor ve sayı tekse, "Kartları Dağıt" derken moderatörün oyuna girmeden yönetmesi onaylanır (7 kişi → 6 oyuncu). Yeni oyunda moderatör tekrar oyuncu olarak eklenir. Moderatör zaten oynamıyorsa ve sayı tekse bir oyuncu daha katılmalı ya da biri çıkmalıdır. Böylece iki takım hep eşit kalır.

**Sarhoş:** Rastgele bir düz takım kartının yerine geçer ve **3. turun başında** o karaktere döner (3 turluk oyunda 3. tur zaten son turdur, 5 turlu oyunda 3. turdan itibaren normal rolüyle oynar).

**Sarhoş nasıl çalışır (fiziksel hisse yakın):**
- İlk 2 tur boyunca kartı "SARHOŞ – ??? TAKIM" görünür, renk paylaşımında mor çıkar. Kendi rolünü bilmez.
- 3. tura girerken telefonu titrer, ses çalar ve *"AYILDIN! Kartının gerçek karakterine döndü"* mesajı çıkar. Kartına basılı tutup yeni rolünü okur.
- Sonuç ekranında "Sarhoştu → Mavi Takım" gibi görünür.

---

## Kart Kullanımı ve Gizlilik

- **Kendi kartım:** Karta basılı tuttuğun sürece açık kalır, bırakınca kapanır. Sınırı yoktur.
- **Rengimi göster (3 sn):** Herkes için aynı şablon renk şeridi gösterilir (Mavi: Başkan/Mavi Ajan/Kırmızı Casus/Mavi Takım, Kırmızı: Bombacı/Kırmızı Ajan/Mavi Casus/Kırmızı Takım, Sarhoş: mor). Bu sırada ekranda başka hiçbir şey görünmez. Kapanış animasyonunda da şablon şerit kalır, gerçek kart görünmez.
- **Kartımı göster (5 sn):** Tam kartı gösterir, yüz yüze kart paylaşımı ve Ajan kanıtı için kullanılır.
- **Ajan:** Telefonda Ajan'a özel buton yoktur. Ajan, hedefine kartını 5 sn göstererek Ajan olduğunu kanıtlar ve hedefin kartını görmesini ister. Turda 1 kez kullanma kuralı oyuncuların dürüstlüğüne bırakılmıştır.

---

## Moderatör Düğmeleri

- **Herkes Odasında, 1. Turu Başlat:** Odalara geçiş bitince ilk turun sayaçlarını başlatır.
- **Turu Erken Bitir:** Sadece bir tur sürürken görünür, onay sorar. Tur süresini keser, herkese "TUR BİTTİ" alarmını gönderir ve rehine geçişi sayacını (45 sn) başlatır. Normal oyunda gerekmez: yanlışlıkla erken başlatıldıysa, herkes anlaşıp turu kapatmak istiyorsa ya da test sırasında işe yarar. Son turda basılırsa doğrudan "OYUN BİTTİ" aşamasına geçer.
- **Rehineler Geçti, n. Turu Başlat:** Rehine geçişi sırasında görünür, kalan süreyi beklemeden yeni turu başlatır.
- **Sonuçları ve Kartları Aç:** Son rehineler gönderilip herkes toplanınca tüm kartları açar.
- **Yeni Oyun:** Lobiye döner, kartlar yeniden dağıtılır.

---

## Ekran Uyumasın

Bu sürümde telefon çoğu zaman masada duracağı için:
- Uygulama ekranı açık tutmayı (wake lock) kendiliğinden ister ve sayfa tekrar görünür olunca yeniler.
- Yine de telefonun **Otomatik Kilit / Ekran Zaman Aşımı** süresini oyun için uzatmak (en az 5 dk) önerilir. Ekran kapanırsa ses ve titreşim gelmez, bağlantı da kopabilir.
- iPhone'larda titreşim hiç çalışmaz, ses için sayfaya en az bir kez dokunmak gerekir (katılırken zaten dokunulur).
- Moderatör için **PC ya da şarjda tutulan bir telefon** önerilir: sayaçları o yürütür.
- Süre dolunca alarm, moderatörden mesaj gecikse bile telefonun kendi saatiyle de çalar.

---

## Ana Menü Seçenekleri

- **Oyun kodu:** Kurarken boş bırakılırsa 4 harfli rastgele kod verilir, istersen kendin yazabilirsin (en fazla 20 harf/rakam, Türkçe harfler ASCII'ye çevrilir).
- **Bağlantı Türü:** İnternet (varsayılan) ya da Yerel Ağ (aşağıda).
- **Test modu:** Süreler çok kısalır, en az 4 oyuncuyla başlanır, lobide **+ Test Oyuncusu** düğmesi çıkar.
- **Kart demosu:** Oyun kurmadan tüm kartları görüp basılı tutma, renk ve kart paylaşımını deneyebilirsin.
- **Karakter seti:** Lobide Ajan, Casus ve Sarhoş açılıp kapatılır, özet satırı deste dağılımını canlı gösterir.
- **Bağlantısı kopan oyuncu:** Tarayıcı verisi silinirse oyun başladıktan sonra da **eski adıyla** girerek koltuğuna dönebilir.

---

## Yerel Ağ (İnternetsiz) Mod

Etkinlik ortamında 15-20 telefonla kopmasız oynamak için önerilir:

1. PC'de **Mobil Etkin Nokta** açın (2.4 GHz bandı seçin).
2. PC'de `yerel/YEREL-OYUN-BASLAT.bat` dosyasını çalıştırın (İLK KEZ internetle; `ws` paketini indirir, Node.js kurulu olmalı).
3. Konsolda yazan adresi (örn. `http://192.168.137.1:8080`) telefonlar tarayıcıdan açar. Adresi QR koda çevirmek kolaylık sağlar.
4. Ana menüde **Bağlantı Türü: Yerel Ağ** seçili olmalı (PC adresinden açıldıysa kendiliğinden seçilir).

Yerel sunucu internet olmadığında açılışı yavaşlatmasın diye Google Fonts ve PeerJS bağlantılarını sayfadan çıkarır.

---

## Bilinen Sınırlar

- Odalar ve rehineler takip edilmediği için kazanan otomatik hesaplanmaz, kural sonuç ekranında yazılıdır.
- Kartlar telefona gönderildiği için tarayıcı geliştirici araçlarıyla kart okunabilir; arkadaş oyunu için kabul edilmiştir.
