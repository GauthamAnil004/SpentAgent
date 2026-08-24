import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, ScreenTitle, ErrorText } from '../src/components';
import { COLORS, SPACING, FONT, RADIUS } from '../src/theme';
import { submitReceipt, getErrorMessage } from '../src/api';

export default function HomeScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const pickImage = async (useCamera = false) => {
    let permissionResult;
    if (useCamera) {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Please grant camera/gallery permissions to proceed.');
      return;
    }

    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    };

    let pickerResult = useCamera 
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!pickerResult.canceled) {
      setImage(pickerResult.assets[0]);
      setResult(null);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      const localUri = image.uri;
      const filename = localUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('file', { uri: localUri, name: filename, type });

      const response = await submitReceipt(formData);
      setResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTitle title="Receipt Scanner" subtitle="Scan receipts for automated compliance review" />
      
      <View style={styles.imagePickerContainer}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>No receipt selected</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Button 
          title="Camera" 
          variant="secondary"
          onPress={() => pickImage(true)} 
          style={styles.halfButton} 
        />
        <Button 
          title="Gallery" 
          variant="secondary"
          onPress={() => pickImage(false)} 
          style={styles.halfButton} 
        />
      </View>

      <ErrorText error={error} />

      <Button 
        title="Submit for Review" 
        onPress={handleSubmit} 
        loading={loading}
        disabled={!image}
        style={styles.submitButton}
      />

      {result && (
        <Card style={styles.resultCard}>
          <Text style={styles.resultTitle}>Analysis Result</Text>
          <Text style={styles.jsonText}>{JSON.stringify(result, null, 2)}</Text>
          
          {result.transaction_id && (
            <TouchableOpacity 
              style={styles.linkContainer}
              onPress={() => navigation.navigate('XAIReasoning', { transactionId: result.transaction_id })}
            >
              <Text style={styles.linkText}>View AI Reasoning →</Text>
            </TouchableOpacity>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  imagePickerContainer: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: RADIUS.lg,
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: FONT.size.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  halfButton: {
    flex: 0.48,
  },
  submitButton: {
    marginBottom: SPACING.xl,
  },
  resultCard: {
    marginTop: SPACING.md,
  },
  resultTitle: {
    color: COLORS.text,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.md,
  },
  jsonText: {
    color: COLORS.textMuted,
    fontSize: FONT.size.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  linkContainer: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  linkText: {
    color: COLORS.accent,
    fontWeight: FONT.weight.bold,
    fontSize: FONT.size.md,
  }
});
