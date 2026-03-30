# ⚡ VoltNote

Elektrik-Elektronik Mühendisliği öğrencileri için geliştirilmiş, **premium dark theme** sahip, yüksek performanslı mobil çalışma asistan uygulaması.

## 🎯 Özellikler

### 📚 Ders Yönetimi
- Kendi derslerini ekle ve düzenle
- Her ders için renk seçimi
- Ders kodu ve isim belirleme

### 📋 Haftalık Ders Programı
- Günlere göre ders saatleri ekleme
- Başlangıç ve bitiş saatleri belirleme
- Ders tipi seçimi (Ders, Lab, Uygulama)
- Sınıf/konum bilgisi
- Tüm haftanın görsel takvimi

### 📝 Akıllı Not Yönetimi
- Ders bazlı hiyerarşik klasörleme
- Kamera entegrasyonu ile devre şemaları ve tahta notları kaydetme
- Görsel not saklama ve düzenleme

### ⏱️ Çalışma Sayacı & Focus Mode
- Ders seçerek başlatılabilen hassas çalışma kronometresi
- Focus Mode ile maksimum konsantrasyon
- Otomatik veri kaydı ve senkronizasyon

### 📊 Detaylı Analitik
- Günlük ve haftalık çalışma süreleri
- Ders bazlı çalışma istatistikleri
- Görsel grafikler ve progress takibi

### 📅 Sınav Takvimi & Geri Sayım
- Dinamik sınav ajandası
- Ana ekranda en yakın sınava kalan gün sayısı
- **Exam-Day Surprise**: Sınav günü özel motivasyon mesajları

### 🎨 Premium Dark Theme
- Altın/Siyah mühendislik estetiği
- Göz dostu karanlık tema
- Minimalist ve modern tasarım

## 🚀 Kurulum

### Gereksinimler
- Node.js 16+
- npm veya yarn
- Expo Go uygulaması (iOS/Android)

### Adımlar

1. Bağımlılıkları yükleyin:
```bash
cd VoltNote
npm install
```

2. Uygulamayı başlatın:
```bash
npm start
```

3. Expo Go ile QR kodu tarayın:
   - **iOS**: Kamera uygulaması ile QR kodu tarayın
   - **Android**: Expo Go uygulamasındaki QR tarayıcısını kullanın

## 📱 Kullanım

### İlk Kurulum
1. Uygulamayı açın
2. "Derslerimi Ekle" butonuna tıklayın
3. Ders kodu (örn: MAT101) ve ders adını girin
4. Renk seçin ve kaydedin
5. Tüm derslerinizi ekleyin

### Not Ekleme
1. "Notlar" sekmesine gidin
2. Sağ alttaki + butonuna tıklayın
3. Not başlığı girin ve ders seçin
4. Fotoğraf çekin veya galeriden seçin
5. Kaydedin

### Çalışma Seansı Başlatma
1. "Sayaç" sekmesine gidin
2. Çalışacağınız dersi seçin
3. İsterseniz Focus Mode'u aktifleştirin
4. "Başla" butonuna tıklayın
5. Bittiğinde "Bitir" butonuna basın

### Sınav Ekleme
1. "Sınavlar" sekmesine gidin
2. + butonuna tıklayın
3. Sınav bilgilerini girin:
   - Sınav adı (Vize, Final, Quiz vb.)
   - Ders seçimi
   - Tarih ve saat
   - Opsiyonel: Kişisel not ve motivasyon mesajı
4. Kaydedin

### Sınav Günü Sürprizi
- Sınav günü uygulamayı açtığınızda özel bir karşılama ekranı görürsünüz
- Kendi yazdığınız motivasyon mesajı tam ekran gösterilir
- Kişisel notunuz hatırlatılır

## 🏗️ Teknik Altyapı

- **Framework**: React Native + Expo
- **Dil**: TypeScript
- **Navigation**: React Navigation
- **Storage**: AsyncStorage (Firebase entegrasyonu hazır)
- **State Management**: React Hooks
- **Stil**: StyleSheet API

## 📂 Proje Yapısı

```
VoltNote/
├── src/
│   ├── screens/          # Ana ekranlar
│   │   ├── HomeScreen.tsx
│   │   ├── ScheduleScreen.tsx
│   │   ├── CoursesScreen.tsx
│   │   ├── NotesScreen.tsx
│   │   ├── TimerScreen.tsx
│   │   ├── ExamsScreen.tsx
│   │   └── StatsScreen.tsx
│   ├── navigation/       # Navigation yapısı
│   ├── components/       # Reusable componentler
│   ├── services/         # Storage ve API servisleri
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility fonksiyonlar
│   ├── constants/       # Tema ve sabitler
│   └── hooks/           # Custom hooks
├── assets/              # Görseller ve ikonlar
├── App.tsx             # Ana uygulama
└── package.json
```

## 🔮 Gelecek Özellikler

- [ ] Firebase Cloud Firestore entegrasyonu
- [ ] LaTeX rendering desteği
- [ ] Pomodoro timer modu
- [ ] Arkadaşlarla çalışma challenge'ları
- [ ] Lokasyon bazlı hatırlatıcılar
- [ ] Widget desteği (iOS/Android)

## 🐛 Bilinen Sorunlar

- iOS'ta DateTimePicker native görünümü kullanılıyor
- Arka plan çalışma izinleri bazı cihazlarda manuel aktivasyon gerektirebilir

## 📝 Lisans

Bu proje kişisel kullanım için geliştirilmiştir.

## 🤝 Katkıda Bulunma

Önerileriniz ve geri bildirimleriniz için:
- Issue açın
- Pull request gönderin

## 📞 İletişim

Sorularınız için lütfen iletişime geçin.

---

**VoltNote** - Elektrik-Elektronik Mühendisliği için tasarlandı ⚡

Made with ❤️ for engineering students
