const { execSync } = require('child_process');

try {
  execSync('npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack react-native-screens react-native-safe-area-context expo-image-picker expo-document-picker expo-secure-store axios react-native-gesture-handler', { stdio: 'inherit' });
  console.log('Dependencies installed successfully');
} catch (error) {
  console.error('Failed to install dependencies', error);
}
