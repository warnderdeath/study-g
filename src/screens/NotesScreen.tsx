import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { getNotes, saveNote, deleteNote, getCourses } from '../services/storage';
import { Note, Course } from '../types';

const NotesScreen = () => {
  const navigation = useNavigation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteCourse, setNewNoteCourse] = useState('');
  const [newNoteImage, setNewNoteImage] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    loadData();

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const allNotes = await getNotes();
    const allCourses = await getCourses();
    setNotes(allNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    setCourses(allCourses);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermelisiniz.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      // Web'de kamera desteği için HTML5 kullan
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment' as any; // Arka kamera
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setNewNoteImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewNoteImage(result.assets[0].uri);
      }
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // Use HTML5 file input for web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setNewNoteImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewNoteImage(result.assets[0].uri);
      }
    }
  };

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() || !newNoteCourse) {
      Alert.alert('Hata', 'Lütfen not başlığı ve ders seçin.');
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      courseId: newNoteCourse,
      title: newNoteTitle,
      localImageUri: newNoteImage || undefined,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveNote(newNote);
    await loadData();
    resetAddModal();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
        await deleteNote(noteId);
        await loadData();
        setSelectedNote(null);
      }
    } else {
      Alert.alert(
        'Notu Sil',
        'Bu notu silmek istediğinize emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
              await deleteNote(noteId);
              await loadData();
              setSelectedNote(null);
            },
          },
        ]
      );
    }
  };

  const resetAddModal = () => {
    setShowAddModal(false);
    setNewNoteTitle('');
    setNewNoteCourse('');
    setNewNoteImage(null);
  };

  const filteredNotes = selectedCourse === 'all'
    ? notes
    : notes.filter(note => note.courseId === selectedCourse);

  const getCourseById = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const viewImage = (imageUri: string) => {
    if (Platform.OS === 'web') {
      window.open(imageUri, '_blank');
    }
  };

  const downloadImage = (imageUri: string, filename: string) => {
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = imageUri;
      link.download = `${filename}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // If no courses, show message
  if (courses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Önce ders eklemelisin</Text>
          <Text style={styles.emptyStateSubtext}>
            Dersler sekmesinden derslerini ekle
          </Text>
          <TouchableOpacity
            style={styles.goToCoursesButton}
            onPress={() => navigation.navigate('Courses' as never)}
          >
            <Text style={styles.goToCoursesButtonText}>Derslere Git</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Course Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'Tümü', color: colors.primary }, ...courses]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCourse === item.id && styles.filterChipActive,
                selectedCourse === item.id && { borderColor: item.color },
              ]}
              onPress={() => setSelectedCourse(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCourse === item.id && styles.filterChipTextActive,
                  selectedCourse === item.id && { color: item.color },
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Henüz not eklenmemiş</Text>
          <Text style={styles.emptyStateSubtext}>
            Aşağıdaki + butonuna basarak not ekleyebilirsin
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const course = getCourseById(item.courseId);
            return (
              <TouchableOpacity
                style={styles.noteCard}
                onPress={() => setSelectedNote(item)}
              >
                {item.localImageUri && (
                  <Image source={{ uri: item.localImageUri }} style={styles.noteImage} />
                )}
                <View style={styles.noteContent}>
                  <Text style={styles.noteTitle}>{item.title}</Text>
                  <View style={styles.noteFooter}>
                    <View
                      style={[styles.courseBadge, { backgroundColor: course?.color + '30' }]}
                    >
                      <Text style={[styles.courseBadgeText, { color: course?.color }]}>
                        {course?.code || 'N/A'}
                      </Text>
                    </View>
                    <Text style={styles.noteDate}>
                      {item.createdAt.toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  {/* Image Actions */}
                  {Platform.OS === 'web' && item.localImageUri && (
                    <View style={styles.imageActions}>
                      <TouchableOpacity
                        style={styles.imageButton}
                        onPress={() => viewImage(item.localImageUri!)}
                      >
                        <Text style={styles.imageButtonText}>🖼️ Görseli Görüntüle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.imageButton, styles.imageButtonSecondary]}
                        onPress={() => downloadImage(item.localImageUri!, `${course?.code}-${item.title}`)}
                      >
                        <Text style={styles.imageButtonText}>⬇️ İndir</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.notesList}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Note Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetAddModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Not</Text>

            <TextInput
              style={styles.input}
              placeholder="Not Başlığı"
              placeholderTextColor={colors.textTertiary}
              value={newNoteTitle}
              onChangeText={setNewNoteTitle}
            />

            <Text style={styles.label}>Ders Seçin:</Text>
            <FlatList
              data={courses}
              keyExtractor={(item) => item.id}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.courseOption,
                    newNoteCourse === item.id && styles.courseOptionActive,
                    newNoteCourse === item.id && { borderColor: item.color },
                  ]}
                  onPress={() => setNewNoteCourse(item.id)}
                >
                  <Text
                    style={[
                      styles.courseOptionText,
                      newNoteCourse === item.id && { color: item.color },
                    ]}
                  >
                    {item.code}
                  </Text>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />

            <View style={styles.imageSection}>
              {newNoteImage ? (
                <View>
                  <Image source={{ uri: newNoteImage }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setNewNoteImage(null)}
                  >
                    <Text style={styles.removeImageText}>Kaldır</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imageButtons}>
                  <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                    <Text style={styles.imageButtonIcon}>📷</Text>
                    <Text style={styles.imageButtonText}>Fotoğraf Çek</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Text style={styles.imageButtonIcon}>🖼️</Text>
                    <Text style={styles.imageButtonText}>Galeriden Seç</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetAddModal}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddNote}>
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Note Modal */}
      <Modal
        visible={selectedNote !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedNote(null)}
      >
        {selectedNote && (
          <View style={styles.modalOverlay}>
            <View style={styles.viewModalContent}>
              <Text style={styles.viewModalTitle}>{selectedNote.title}</Text>

              {selectedNote.localImageUri && (
                <Image
                  source={{ uri: selectedNote.localImageUri }}
                  style={styles.viewImage}
                  resizeMode="contain"
                />
              )}

              <View style={styles.viewModalFooter}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNote(selectedNote.id)}
                >
                  <Text style={styles.deleteButtonText}>Sil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedNote(null)}
                >
                  <Text style={styles.closeButtonText}>Kapat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterChipActive: {
    borderWidth: 2,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  filterChipTextActive: {
    fontWeight: fontWeight.bold,
  },
  notesList: {
    padding: spacing.md,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  noteImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceLight,
  },
  noteContent: {
    padding: spacing.md,
  },
  noteTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  courseBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  noteDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: colors.background,
    fontWeight: fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalBg,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  courseOption: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  courseOptionActive: {
    borderWidth: 2,
  },
  courseOptionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  imageSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    margin: spacing.xs,
    alignItems: 'center',
  },
  imageButtonIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  imageButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
  },
  removeImageBtn: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  removeImageText: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginLeft: spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: fontWeight.bold,
  },
  viewModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  viewModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  viewImage: {
    width: '100%',
    height: 400,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    marginBottom: spacing.lg,
  },
  viewModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginLeft: spacing.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: fontWeight.bold,
  },
  goToCoursesButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  goToCoursesButtonText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: fontWeight.bold,
  },
  imageActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  imageButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  imageButtonSecondary: {
    backgroundColor: colors.surfaceLight,
  },
  imageButtonText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
});

export default NotesScreen;
