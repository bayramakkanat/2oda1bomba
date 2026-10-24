# 2 Oda 1 Bomba – Telefon Kart & Ortak Saat Uygulaması (v0.3 - Fiziksel Dostu)

Bu uygulama, **Two Rooms and a Boom (2 Oda 1 Bomba)** kutu oyununu telefon ekranlarına taşırken oyuncuları ekrana boğmayan, yüz yüze iletişimi ve sosyal dedüksiyonu ön plana çıkaran **melez (hybrid)** bir dijital yardımcıdır.

Telefonlar sadece **"cebinizdeki gizli kart"** ve **"odalar arasında senkronize geri sayım saati"** olarak çalışır. Liderlik tartışmaları, darbe (usurp) girişimleri, rehine pazarlıkları ve Ajan sorguları tamamen yüz yüze, fiziksel olarak gerçekleşir.

---

## 🎮 Temel Oynanış ve Akış

1. **Lobi ve Bağlantı:**
   - Moderatör oyunu kurar (Örn: 3 Tur seçeneği - Önerilen).
   - Oyuncular katılır. Moderatör **"Dağıt ve Başlat"** der.
   - Her oyuncuya rastgele bir rol ve başlangıç odası (**A Odası** veya **B Odası**) atanır.

2. **Tur Akışı (Otomatik & Kesintisiz):**
   - **Tur Süresi (3 dk $\rightarrow$ 2 dk $\rightarrow$ 1 dk):**  
     Tüm telefonlarda senkronize geri sayım başlar. Oyuncular odalara dağılır, konuşur, blöf yapar ve dedüksiyon yürütür.
   - **Rehine Geçişi / Mola Sayacı (45 sn):**  
     Tur bitince telefonlar kuvvetlice titrer ve alarm çalar:  
     🔔 *"1. TUR BİTTİ! 3 Rehine Seçip Odaları Değiştirin."*  
     Ekranda otomatik **45 saniyelik geçiş sayacı** başlar. Bu sürede oda lideri rehineleri belirler ve rehineler koridordan karşı odaya geçer. Süre dolunca yeni tur otomatik olarak düdük sesiyle başlar!  
     *(Not: Moderatör rehineler erken geçtiyse beklemeden "Sonraki Tura Geç" butonuna basabilir).*

3. **Rehine Sayıları (3 - 2 - 1 Kuralı):**
   - **1. Tur Sonu:** 3 Rehine takas edilir.
   - **2. Tur Sonu:** 2 Rehine takas edilir.
   - **3. Tur Sonu (Son Tur):** 1 Rehine takas edilir ve oyun biter!

4. **Kart Kullanımı ve Ekran Gizliliği:**
   - **Kendi Kartıma Bakma:** Kartın üzerine basılı tuttuğunuz sürece kart açılır ve rolünüzü okuyabilirsiniz; parmağınızı çektiğiniz milisaniye kart kapanır. Sınır yoktur, dilediğiniz an bakabilirsiniz.
   - **Rengimi Göster (3 sn):** Butona basıldığında 3 saniye boyunca tüm oyuncular için aynı standart şablonda alt takım rengi şeridi gösterilir. Ekranda başka hiçbir ipucu görünmez.
   - **Kartımı Göster (5 sn):** İki oyuncu anlaşıp yüz yüze tam kart paylaşmak istediğinde veya Ajan birini zorladığında kullanılır; 5 saniye tam kartı gösterir.
   - **Ajan Rolü:** Ajan'ın ekranında dışarıdan bakanların anlayabileceği hiçbir buton veya yazı yoktur. Ajan kartını açar, hedefine *"Ben Ajanım"* diyerek ispatlar ve kural gereği hedefin de kartını açmasını zorunlu kılar.

5. **Oyun Sonu (Büyük Açılış):**
   - 3. turun son rehine takasından sonra telefonlar çalar: *"OYUN BİTTİ! Tek bir odada toplanın."*
   - Moderatör **"Sonuçları ve Kartları Aç"** butonuna basar.
   - Herkesin ekranındaki kartlar otomatik açılır. Oyuncular telefonlarını havaya kaldırır.
   - **Fiziksel Kural:** Başkan ve Bombacı aynı odada bitirdiyse **KIRMIZI TAKIM**, farklı odalardaysa **MAVİ TAKIM** kazanır!

---

## 🛠️ Yerel Ağ (İnternetsiz Mod) Kurulumu

Etkinlik ortamında (15-20 telefon aynı anda) sıfır kopma ve sıfır gecikme için yerel ağ modu tavsiye edilir:

1. PC'de **Mobil Etkin Nokta (Mobile Hotspot)** açın (Ağ bandını **2.4 GHz** seçin).
2. PC'de `yerel/YEREL-OYUN-BASLAT.bat` dosyasını çalıştırın (İLK KEZ internete bağlıyken çalıştırın; `ws` paketini indirir).
3. Konsolda yazan adresi (örn. `http://192.168.137.1:8080`) telefonlar tarayıcılarından açar. *(Tavsiye: Bu adresi bir QR kod yapıp ekranda tutun, telefonlar okutup girsin).*
