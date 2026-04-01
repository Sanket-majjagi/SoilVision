import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ManualEntryScreen from '../screens/ManualEntryScreen';
import ResultsScreen from '../screens/ResultsScreen';
import ColorKitScreen from '../screens/ColorKitScreen';
import CropCheckScreen from '../screens/CropCheckScreen';
import PhotoScanScreen from '../screens/PhotoScanScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="PhotoScan" 
        component={PhotoScanScreen} 
        options={{ title: 'Photo Scan' }} 
      />
      <Stack.Screen 
        name="ManualEntry" 
        component={ManualEntryScreen} 
        options={{ title: 'Manual Entry' }} 
      />
      <Stack.Screen 
        name="ColorKit" 
        component={ColorKitScreen} 
        options={{ title: 'Color Kit Analysis' }} 
      />
      <Stack.Screen 
        name="Results" 
        component={ResultsScreen} 
        options={{ title: 'Analysis Results', headerShown: false }} 
      />
      <Stack.Screen 
        name="CropCheck" 
        component={CropCheckScreen} 
        options={{ title: 'Crop Suitability Check' }} 
      />
    </Stack.Navigator>
  );
}
