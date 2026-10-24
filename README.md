# 2 Oda 1 Bomba – telefon kart uygulaması (v0.1)

Statik bir web sitesi: derleme yok, sunucu kodu yok. GitHub'a yükle, Vercel'de "Import Project" de, ayar değiştirmeden yayınlanır (Framework: Other).

## Oynanış akışı
1. Moderatör telefonu açar, adını yazar, **Yeni oyun kur** der. Oyun kodunu kutuya kendisi yazabilir (en fazla 20 harf/rakam, Türkçe harfler ASCII'ye çevrilir, örn. "ŞÜKRÜ1" → "SUKRU1"); boş bırakırsa 4 harfli rastgele kod çıkar.
2. Herkes siteyi açar, adını ve kodu yazıp **Katıl** der.
3. Moderatör **Dağıt** der (3 veya 5 tur seçilir). Uygulama desteyi kurar, kartları ve A/B odalarını rastgele dağıtır.
4. Kart kapalı gelir: **kartı 3 sn basılı tut** = kendi kartına bak. Bu hak **yalnızca 1. turda ve 1 kez** vardır; **tek istisna Sarhoş'tur**: son turda kartı otomatik gerçek karakterine dönüşünce yeni kartına bakmak için 1 hak daha alır. Bunun dışında 3 sn değil daha uzun basılsa da kart açılmaz (hak host'ta tutulur, sayfa yenilenince geri gelmez). Ajan incelemesi, **Rengimi göster** ve oyun sonu kart açma bu kuraldan bağımsızdır, **Rengimi göster** = sadece alt şerit, 3 sn (ekranda 3-2-1 geri sayım, sonra kapanır; sınırı yok). Gösterilen şerit kartın kendi şeridi değil, **aynı renkteki herkes için aynı şablon şerittir** (Mavi: Başkan/Mavi Ajan/Kırmızı Casus/Mavi Takım; Kırmızı: Bombacı/Kırmızı Ajan/Mavi Casus/Kırmızı Takım; Gri: Stajyer/Maktül/Kumarbaz; Sarhoş mor). Renk gösterilirken ekrandaki diğer her şey (Ajan gücü düğmesi dahil) gizlenir; böylece çerçeve, şerit yüksekliği veya düğmeler kartı ele vermez.
5. Ajan: **ekranı aşağıdan yukarı kaydırınca** (Ajan olmayanda hiçbir şey olmaz) **Ajan gücü** düğmesi 15 sn belirir → odadaki isimlerden biri seçilir → hedefin telefonunda bildirim çıkar, ikisi de tam kartı 10 sn yüz yüze gösterir. Tur başına tek hak.
6. **Tur akışı tamamen otomatiktir** (v0.2):
   - Her tur **lider oylamasıyla** başlar (1. tur 30 sn, sonraki turlar 20 sn). Herkes kendi odasındaki isim listesinden oy verir; oda tam oy kullanırsa lider hemen belli olur. Süre dolarsa en çok oy alan lider olur, oy yoksa/eşitse odadan rastgele biri atanır.
   - İki oda da liderini bulunca **tur süresi** (5-4-3-2-1 dk) geri saymaya başlar; kalan süre **tüm telefonlarda** ve moderatörde görünür. Süre dolunca telefonlar titreşir.
   - Tur bitince **sadece o odanın liderinin** telefonunda isim listesi açılır (lider kendini seçemez) ve **30 sn** süresi vardır. Rehine sayısı dolunca seçim otomatik gönderilir. Diğer oyuncuların ekranı pasiftir. Süre dolarsa seçmeyen oda için rehineler rastgele belirlenir.
   - İki odanın lideri de seçimini bitirince (ya da 30 sn dolunca) tüm rehinelere aynı anda "ODANI DEĞİŞTİR" mesajı gider ve her iki odada da aynı anda **15 sn** sayaç başlar. Süre bitince rehineler geçmiş sayılır, oda listeleri güncellenir ve yeni tur yine lider oylamasıyla başlar. **Son turda da** rehine seçimi ve geçiş yapılır; geçiş bitince oyun sona erer.
   - Moderatör gerekirse **Rehine seçimini rastgele tamamla** der (lider seçmezse). Son turda **Sarhoş'un kartı otomatik** gerçek karakter kartıyla değişir.
7. **Oyun sonu** (son turun rehine geçişi bitince): Kumarbaz varsa herkese "Kumarbaz X kazananı tahmin ediyor" yazılır, Kumarbaz'ın ekranında **10 sn** MAVİ / KIRMIZI seçimi açılır (seçilmezse rastgele). Ardından herkese "Kumarbaz mavi/kırmızı takımı seçti" mesajı görünür ve moderatörün **Oyun bitti** düğmesi belirir (Kumarbaz yoksa son rehine takasından hemen sonra belirir; oyun sırasında düğme gizlidir). Moderatör basınca herkesin kartı açılır, A ve B odalarındaki karakterler listelenir ve sonuç büyük, takım renginde yazılır: Başkan ve Bombacı aynı odadaysa **KIRMIZI**, farklı odadaysa **MAVİ** kazanır. Gri karakterlerin durumu da yazılır: Stajyer Başkan'la, Maktül Bombacı'yla aynı odada mı (kartlarındaki göreve göre), Kumarbaz tahmini doğru mu.
8. **Test modu** (ana menüde kutucuk): süreler kısalır (oylama 10 sn, tur 30 sn, rehine seçimi 10 sn, geçiş 5 sn), en az 4 oyuncuyla başlanır ve lobide **+ Test oyuncusu** düğmesi çıkar. Normal oyunda test oyuncusu düğmesi görünmez.

## Kurallar (uygulamada)
Deste: Başkan, Bombacı, 2 Ajan, 2 Casus, Stajyer, Maktül + düz Mavi/Kırmızı. Mavi/Kırmızı eşit bölünemiyorsa Kumarbaz eklenir (Kumarbaz "Hiç yok" ya da "Her zaman" iken düz kart sayısı tek çıkarsa uyarı verir ve dağıtımı engeller; takımlar hep eşit olmalıdır). Sarhoş, rastgele bir düz takım kartının yerine geçer; o kart "ayık" kart olur.
Rehine tablosu resmi kural kitabından (5 turluk ve 3 turluk).

## Kart demosu
Ana menüde **Kart demosu** düğmesi: oyun kurmadan, gerçek kart ekranının aynısında tüm kartları seç, basılı tutarak aç, **Rengimi göster**, **Kartımı göster**, **Ajan gücü** (kartı açıkken ipucu yazılır; ekranı aşağıdan yukarı kaydırınca düğme belirir) ve "Ajan isteği ekranı"nı dene (Sarhoş için ayık kart kutusu var). Demoda 3 sn basılı tutma hakkı sınırsızdır, ağ bağlantısı gerekmez. Kart görseli ya da açılış davranışı değişince önizlemek için kullan.

## Karakter seti (dağıtımdan önce)
Lobide moderatör **Karakter seti** bölümünü açar: Başkan ve Bombacı her zaman vardır; Mavi/Kırmızı Ajan, Mavi/Kırmızı Casus, Stajyer, Maktül ve Sarhoş tek tek açılıp kapatılır. **Kumarbaz (gri)**: Otomatik (takımlar eşit bölünemezse eklenir) / Her zaman var / Hiç yok. Düz Mavi ve Kırmızı kart sayıları boş bırakılırsa otomatik eşit bölünür; birine sayı yazılınca diğeri otomatik aynı sayıya eşlenir (ikisi hep eşit), kalan kart sayısıyla tutmuyorsa özet satırı uyarır. Hemen alttaki özet satırı canlı gösterir ve uyarır. Hızlı seçimler: Standart, Gri yok, Hep Kumarbaz, Sade.

## Yerel ağ (internetsiz) mod
Ana menüde **Bağlantı: Yerel ağ (PC sunucusu)** seçilir. PC'de `yerel/YEREL-OYUN-BASLAT.bat` çalıştırılır (İLK KEZ internet gerekir: `ws` paketini indirir; Node.js kurulu olmalı). Pencerede yazılan adresi (örn. `http://192.168.1.20:8080`) telefonlar aynı Wi-Fi'da (ya da PC'nin mobil hotspot'unda) açar. Oyun dosyalarını ve mesajlaşmayı PC sunucusu üstlenir, bulut ve PeerJS gerekmez. Windows güvenlik duvarı sorarsa Özel ağlara izin ver.

## Henüz yok
Yazısız kart görseli + tek tip font.

## Bilinen sınırlar
- Bağlantı PeerJS'in ücretsiz bulut sunucusunu kullanır. Herkes aynı Wi-Fi'da olsun; mobil veriyle bağlananlar için TURN sunucusu gerekebilir.
- Moderatörün telefonu merkezdir: açık kalmalı, şarjda olmalı. Sayfa yenilenirse aynı kodla devam eder (tur zamanlayıcısı yeniden başlatılır).
- Oyuncu sayfayı yenilerse aynı kartla geri döner; sadece Sarhoş'un "Ayık ol" seçimi sıfırlanır.
- Gerçek telefonlarla denenmedi. Etkinlikten önce en az 3-4 telefonla deneme yap.
