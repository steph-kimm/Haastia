import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUp from './screens/SignUp';
import SignIn from './screens/SignIn';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './context/auth';
import Home from './screens/Home';

const Stack = createNativeStackNavigator();

const NavigationScreen = () => {
  return (
    <View style={styles.container}>
      <NavigationContainer>
        <AuthProvider>
          <Stack.Navigator initialRouteName="SignIn">
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="Home" component={Home} />
          </Stack.Navigator>
        </AuthProvider>
      </NavigationContainer>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red', //not wokring for some reason
    // alignItems: 'center',
    // justifyContent: 'center',
  },
});

export default NavigationScreen