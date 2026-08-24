import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Button, Card, ScreenTitle, ErrorText } from '../src/components';
import { COLORS, SPACING, FONT, RADIUS } from '../src/theme';
import { uploadPolicy, getErrorMessage } from '../src/api';

export default function AdminPolicyUploadScreen() {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocument(result.assets[0]);
        setError('');
      }
    } catch (err) {
      setError('Failed to pick document.');
    }
  };

  const handleUpload = async () => {
    if (!document) {
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', { 
        uri: document.uri, 
        name: document.name, 
        type: document.mimeType || 'application/pdf' 
      });

      await uploadPolicy(formData);
      Alert.alert('Success', 'Company policy document uploaded and processed successfully.');
      setDocument(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTitle title="Admin: Policy Upload" subtitle="Upload PDF files to update company guidelines" />

      <Card style={styles.uploadCard}>
        <View style={styles.fileContainer}>
          {document ? (
            <View>
              <Text style={styles.fileIcon}>📄</Text>
              <Text style={styles.fileName}>{document.name}</Text>
              <Text style={styles.fileSize}>
                {document.size ? `${(document.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.placeholderIcon}>📁</Text>
              <Text style={styles.placeholderText}>No file selected</Text>
            </View>
          )}
        </View>

        <Button 
          title="Choose PDF File" 
          variant="secondary" 
          onPress={pickDocument} 
          style={styles.pickButton} 
        />
      </Card>

      <ErrorText error={error} />

      <Button 
        title="Upload Policy" 
        onPress={handleUpload} 
        loading={loading}
        disabled={!document} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  uploadCard: { alignItems: 'center', padding: SPACING.xl, marginBottom: SPACING.lg },
  fileContainer: { 
    height: 120, 
    width: '100%', 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: SPACING.lg
  },
  fileIcon: { fontSize: 40, textAlign: 'center', marginBottom: SPACING.sm },
  fileName: { color: COLORS.text, fontSize: FONT.size.md, fontWeight: FONT.weight.bold, textAlign: 'center' },
  fileSize: { color: COLORS.textMuted, fontSize: FONT.size.sm, textAlign: 'center', marginTop: SPACING.xs },
  placeholderIcon: { fontSize: 40, textAlign: 'center', marginBottom: SPACING.sm, opacity: 0.5 },
  placeholderText: { color: COLORS.textMuted, fontSize: FONT.size.md, textAlign: 'center' },
  pickButton: { width: '100%' }
});
