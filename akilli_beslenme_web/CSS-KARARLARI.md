# CSS Kararları

## 1. Breakpoint Seçimi
- **Neden 640px ve 1024px seçtim?** Modern endüstri standartlarında çoğu tablet 640-768px bandında yer alırken, dizüstü/masaüstü cihazlar 1024px ile başlamaktadır. Ekstra kırılım noktalarıyla sistemi yormamak için içeriğin sıkışmadan iki kolona ayrılabileceği 1024px masaüstü ve formların ferah kalacağı 640px tablet yapılarını seçtim.
- **İçeriğim bu noktalarda nasıl değişiyor?** Mobil (<640px) durumda her şey tek sütunla yukarıdan aşağı akarken, 640px+ üstünde menüler yan yana hizalanır. 1024px genişlik ve üzerinde ise formlar sol alana alınarak yanlarında sistem kullanım geçmişi için Grid ile ikinci bir geniş sütun (tablo kısmı) açılır.

## 2. Layout Tercihleri
- **Header için neden Flexbox seçtim?** Navigasyon barları temel olarak 1 boyutludur (yatay hizada logo sol, butonlar sağa yığılır). Birbirlerine bağlı yapıları esnekçe düzenleyen Flexbox biçimsel açıdan bu durum için en doğal yaklaşımdır.
- **Form içerikleri veya kolonlar için Flex ve Grid yapısı?** Cihazın durumuna veya içeriğine göre dışarı doğru büyüyebilen değişken içerikli modülleri Flexbox ile yönetirken, projedeki iki büyük eksenin (sol: analiz ve formlar, sağ: geçmiş tablo öğeleri) sayfada nerede asılı duracağını kontrol eden ana iskelet kapsayıcısını (`.container`) CSS Grid yapısıyla kontrol ettim.
- **auto-fit mi auto-fill mi kullandım, neden?** Esnek kolon (örneğin projelerde/içerik elementlerinde) geçişleri için `auto-fit` kullandım çünkü sütunda veri bittikten sonra mevcut elemanların genişleyip alanı doldurmasını ve beyaz bölge kalmamasını tercih ettim.

## 3. Design Tokens
- **Hangi renk paletini seçtim ve neden?** "Akıllı Sağlık ve Beslenme" teması gereği birbiriyle uyumlu ve sağlık temalı, pozitif bir palet seçtim. Gözü yatıştıran mavi (`#4f46e5`) ana renk iken, başarı ifadeleri için zümrüt yeşili, dinlendirici ve okunması kolay Slate/Gray tonları kullanıldı.
- **Spacing skalasını nasıl belirledim?** Çiftleme ve Altın Oran algoritmalarına dayanarak 4px'den başlayıp (`xs: 0.25rem`) 64px'e kadar (`3xl: 4rem`) düzenli artan rem tabanlı bir skala kurguladım.
- **Fluid typography için clamp değerlerini nasıl ayarladım?** `clamp(0.8rem, 0.75rem + 0.25vw, 0.9rem)` yapılarındaki gibi `rem` ve `vw` (viewport width) oranlarını karıştırıp, zoom oranlarından etkilenmemesini garantiledim. Böylece metinlerin hiçbir zaman 16px'in (`1rem` ortalama) önemli bir oranda veya anlamsızca altına/üstüne çıkmadan esnemesini sağladım.

## 4. Responsive Stratejiler
- **Mobile-first yaklaşımını nasıl uyguladım?** Herhangi bir min/max-width belirtmeden ilk CSS kurallarımı %100 mobil için (.container ana hattı flex column olarak) kurdum ve en altta cihazı masaüstüne geçiren `min-width: 1024px` media query tagı açarak tasarımı oradan 2 sütunlu izgaraya (Grid) kaydırdım.
- **Hangi elemanlar breakpoint'lerde değişiyor?** `.container` ve `nav` objesi (Mobilde alt alta, Tablette yatay, PC'de parçalanmış).
- **Görsel boyutları nasıl yönettim?** Görsellerin hiçbir zaman ana iskeletten taşmaması için default olarak `max-width: 100%`, `height: auto`, `object-fit: cover` yapısını zorunlu kılarak her ekran pikselinde tutarlı davranmalarını garantiledim.
