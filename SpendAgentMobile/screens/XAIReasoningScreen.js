import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Text, ActivityIndicator, Platform } from 'react-native';
import { Card, ScreenTitle, ErrorText } from '../src/components';
import { COLORS, SPACING, FONT } from '../src/theme';
import { getXaiReasoning, getErrorMessage } from '../src/api';

export default function XAIReasoningScreen({ route }) {
  const { transactionId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reasoning, setReasoning] = useState(null);

  useEffect(() => {
    if (transactionId) {
      fetchReasoning();
    } else {
      setError('No transaction ID provided.');
      setLoading(false);
    }
  }, [transactionId]);

  const fetchReasoning = async () => {
    setLoading(true);
    try {
      const response = await getXaiReasoning(transactionId);
      setReasoning(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!reasoning) return null;

    const steps = reasoning.steps || reasoning.reasoning_steps;
    
    if (Array.isArray(steps)) {
      return steps.map((step, index) => (
        <Card key={index.toString()} style={styles.stepCard}>
          <Text style={styles.stepNumber}>Step {index + 1}</Text>
          <Text style={styles.stepText}>{typeof step === 'string' ? step : JSON.stringify(step, null, 2)}</Text>
        </Card>
      ));
    }

    return (
      <Card>
        <Text style={styles.jsonText}>{JSON.stringify(reasoning, null, 2)}</Text>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTitle 
        title="AI Audit Trace" 
        subtitle={`Transaction ID: ${transactionId || 'Unknown'}`} 
      />
      
      <ErrorText error={error} />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={styles.loader} />
      ) : (
        renderContent()
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
  loader: {
    marginTop: SPACING.xxl,
  },
  stepCard: {
    marginBottom: SPACING.md,
  },
  stepNumber: {
    color: COLORS.accent,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  stepText: {
    color: COLORS.text,
    fontSize: FONT.size.md,
    lineHeight: 22,
  },
  jsonText: {
    color: COLORS.textMuted,
    fontSize: FONT.size.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  }
});
