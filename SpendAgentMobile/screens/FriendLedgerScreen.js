import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Input, Button, Card, ScreenTitle, ErrorText } from '../src/components';
import { COLORS, SPACING, FONT, RADIUS } from '../src/theme';
import { addLedgerEntry, getLedgerRecords, settleLedgerEntry, getErrorMessage } from '../src/api';

export default function FriendLedgerScreen() {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('lent'); // 'lent' or 'borrowed'
  const [description, setDescription] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  
  const [records, setRecords] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const [settlingIds, setSettlingIds] = useState({});
  const [error, setError] = useState('');

  const fetchRecords = async () => {
    setLoadingList(true);
    try {
      const response = await getLedgerRecords();
      setRecords(response.data.records || []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleAddEntry = async () => {
    if (!friendName || !amount) {
      setError('Please enter friend name and amount.');
      return;
    }

    setAddingEntry(true);
    setError('');
    
    try {
      const today = new Date().toISOString().split('T')[0];
     await addLedgerEntry({
      friend_name: friendName,
      amount: parseFloat(amount),
      type,
      description,
      date: today,
      expected_return_date: expectedReturnDate,
    });
      setFriendName('');
      setAmount('');
      setDescription('');
      setExpectedReturnDate('');
      fetchRecords();
      Alert.alert('Success', 'Ledger entry added successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddingEntry(false);
    }
  };

  const handleSettle = async (id) => {
    setSettlingIds(prev => ({ ...prev, [id]: true }));
    setError('');
    try {
      await settleLedgerEntry(id);
      fetchRecords();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSettlingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loadingList} onRefresh={fetchRecords} tintColor={COLORS.accent} />
      }
    >
      <ScreenTitle title="Friend Ledger" subtitle="Keep track of IOUs with friends" />
      
      <ErrorText error={error} />

      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add Ledger Entry</Text>
        <Input placeholder="Friend Name" value={friendName} onChangeText={setFriendName} />
        <Input placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Input placeholder="Description (e.g. Dinner split)" value={description} onChangeText={setDescription} />
        <Input 
          placeholder="Expected return date (YYYY-MM-DD)"
          value={expectedReturnDate}
          onChangeText={setExpectedReturnDate}
        />
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, type === 'lent' && styles.toggleActive]} 
            onPress={() => setType('lent')}
          >
            <Text style={[styles.toggleText, type === 'lent' && styles.toggleTextActive]}>I Lent</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, type === 'borrowed' && styles.toggleActive]} 
            onPress={() => setType('borrowed')}
          >
            <Text style={[styles.toggleText, type === 'borrowed' && styles.toggleTextActive]}>I Borrowed</Text>
          </TouchableOpacity>
        </View>

        <Button title="Add Entry" onPress={handleAddEntry} loading={addingEntry} />
      </Card>

      <Text style={styles.listTitle}>Active Records</Text>
      {records.length === 0 ? (
        <Text style={styles.emptyText}>No ledger records found.</Text>
      ) : (
        records.map((rec, idx) => (
          <Card key={rec.id || idx.toString()} style={styles.recordItem}>
            <View style={styles.recordRow}>
              <View>
                <Text style={styles.recordName}>{rec.friend_name}</Text>
                <Text style={styles.recordType}>{rec.type === 'lent' ? 'You lent' : 'You borrowed'}</Text>
              </View>
              <Text style={[styles.recordAmount, { color: rec.type === 'lent' ? COLORS.success : COLORS.danger }]}>
                ${rec.amount?.toFixed(2)}
              </Text>
            </View>
            
            {rec.status !== 'settled' && (
              <Button 
                title="Mark Settled" 
                variant="secondary" 
                onPress={() => handleSettle(rec.id)} 
                loading={settlingIds[rec.id]} 
                style={styles.settleButton}
              />
            )}
            {rec.settled && (
              <Text style={styles.settledBadge}>SETTLED</Text>
            )}
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
  toggleContainer: { flexDirection: 'row', marginBottom: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  toggleButton: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', backgroundColor: COLORS.surface },
  toggleActive: { backgroundColor: COLORS.accent },
  toggleText: { color: COLORS.textMuted, fontWeight: FONT.weight.bold },
  toggleTextActive: { color: COLORS.text },
  listTitle: { color: COLORS.text, fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontStyle: 'italic' },
  recordItem: { padding: SPACING.md, marginBottom: SPACING.md },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  recordName: { color: COLORS.text, fontWeight: FONT.weight.bold, fontSize: FONT.size.md },
  recordType: { color: COLORS.textMuted, fontSize: FONT.size.sm },
  recordAmount: { fontWeight: FONT.weight.bold, fontSize: FONT.size.lg },
  settleButton: { paddingVertical: SPACING.sm, marginTop: SPACING.sm },
  settledBadge: { color: COLORS.success, fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, marginTop: SPACING.sm, textAlign: 'right' }
});
