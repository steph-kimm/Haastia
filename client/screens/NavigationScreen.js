import React, { useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUp from './SignUp';
import SignIn from './SignIn';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext, AuthProvider } from '../context/auth';
import Home from './Home';

const Stack = createNativeStackNavigator();

const NavigationScreen = () => {
  const [state, setState] = useContext(AuthContext);
  const authenticated = state && state.token !== '' && state.user !== null;

  return (
    <View style={styles.container}>

      <Stack.Navigator initialRouteName="SignIn">
        {authenticated ? 
        <Stack.Screen name="Home" component={Home} /> :
          <>
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="SignIn" component={SignIn} />
          </>
        }
      </Stack.Navigator>

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