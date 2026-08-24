import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, RefreshControl, Alert, Platform } from 'react-native';
import { Input, Button, Card, ScreenTitle, ErrorText } from '../src/components';
import { COLORS, SPACING, FONT } from '../src/theme';
import { addExpense, getExpenses, analyzeSpending, getErrorMessage } from '../src/api';

export default function PersonalFinanceScreen() {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  const [expenses, setExpenses] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  
  const [loadingList, setLoadingList] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const fetchExpenses = async () => {
    setLoadingList(true);
    try {
      const response = await getExpenses();
      setExpenses(response.data.expenses || []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async () => {
    if (!category || !amount) {
      setError('Please enter category and amount.');
      return;
    }

    setAddingExpense(true);
    setError('');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      await addExpense({ category, amount: parseFloat(amount), description: note, date: today });
      setCategory('');
      setAmount('');
      setNote('');
      fetchExpenses();
      Alert.alert('Success', 'Expense added successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddingExpense(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const response = await analyzeSpending();
      setAnalysis(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl 
          refreshing={loadingList} 
          onRefresh={fetchExpenses} 
          tintColor={COLORS.accent} 
        />
      }
    >
      <ScreenTitle title="Personal Finance" subtitle="Track and analyze your spending" />
      
      <ErrorText error={error} />

      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add New Expense</Text>
        <Input placeholder="Category (e.g. Food, Travel)" value={category} onChangeText={setCategory} />
        <Input placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Input placeholder="Note (Optional)" value={note} onChangeText={setNote} />
        <Button title="Add Expense" onPress={handleAddExpense} loading={addingExpense} />
      </Card>

      <Button 
        title="Get AI Analysis" 
        variant="secondary" 
        onPress={handleAnalyze} 
        loading={analyzing} 
        style={styles.analyzeButton} 
      />

      {analysis && (
        <Card style={styles.analysisCard}>
          <Text style={styles.sectionTitle}>AI Spending Insights</Text>
          <Text style={styles.analysisText}>{JSON.stringify(analysis, null, 2)}</Text>
        </Card>
      )}

      <Text style={styles.listTitle}>Recent Expenses</Text>
      {expenses.length === 0 ? (
        <Text style={styles.emptyText}>No expenses logged yet.</Text>
      ) : (
        expenses.map((exp, idx) => (
          <Card key={idx.toString()} style={styles.expenseItem}>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseCategory}>{exp.category}</Text>
              <Text style={styles.expenseAmount}>${exp.amount?.toFixed(2)}</Text>
            </View>
            {exp.description ? <Text style={styles.expenseNote}>{exp.description}</Text> : null}
            <Text style={styles.expenseDate}>{new Date(exp.date || Date.now()).toLocaleDateString()}</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  sectionTitle: { color: COLORS.text, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, marginBottom: SPACING.md },
  formCard: { marginBottom: SPACING.xl },
  analyzeButton: { marginBottom: SPACING.xl },
  analysisCard: { marginBottom: SPACING.xl, borderColor: COLORS.accent },
  analysisText: { color: COLORS.text, fontSize: FONT.size.md, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  listTitle: { color: COLORS.text, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontStyle: 'italic' },
  expenseItem: { padding: SPACING.md },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  expenseCategory: { color: COLORS.text, fontWeight: FONT.weight.bold, fontSize: FONT.size.md },
  expenseAmount: { color: COLORS.danger, fontWeight: FONT.weight.bold, fontSize: FONT.size.md },
  expenseNote: { color: COLORS.textMuted, fontSize: FONT.size.sm, marginBottom: SPACING.xs },
  expenseDate: { color: COLORS.textMuted, fontSize: FONT.size.xs, opacity: 0.7 }
});
