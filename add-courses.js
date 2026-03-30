const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const courses = [
  // Alttan alınan dersler
  { code: 'EEM-210', name: 'Elektromanyetik Alanlar', color: '#E53935' },
  { code: 'EEM-208', name: 'Mesleki İngilizce', color: '#43A047' },

  // 3. Sınıf Dönem Dersleri
  { code: 'EEM-306', name: 'Analog Haberleşme', color: '#1E88E5' },
  { code: 'EEM-330', name: 'Elektromanyetik Uyumluluk', color: '#FB8C00' },
  { code: 'EEM-316', name: 'Güç Sistemleri II', color: '#8E24AA' },
  { code: 'EEM-302', name: 'Mikrodenetleyicilerle Kontrol', color: '#00ACC1' },
  { code: 'EEM-314', name: 'Girişimcilik', color: '#F4511E' },
  { code: 'EEM-309', name: 'Endüstriyel Elektronik', color: '#7CB342' },
  { code: 'EEM-326', name: 'Optoelektronik', color: '#5E35B1' },
];

async function addCourses() {
  try {
    const coursesWithIds = courses.map((course, index) => ({
      id: Date.now().toString() + index,
      ...course,
    }));

    await AsyncStorage.setItem('@studyg_courses', JSON.stringify(coursesWithIds));
    console.log('✅ Dersler başarıyla eklendi!');
    console.log('📚 Toplam', coursesWithIds.length, 'ders eklendi');

    coursesWithIds.forEach(course => {
      console.log(`  • ${course.code} - ${course.name}`);
    });
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

addCourses();
