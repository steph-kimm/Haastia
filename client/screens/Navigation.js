import React from 'react'
import { NavigationContainer } from "@react-navigation/native";
import NavigationScreen from './NavigationScreen'
import { AuthProvider } from '../context/auth'
import { PostProvider } from '../context/post'

const Navigation = () => {
    return (
        <NavigationContainer>
            <AuthProvider>
                <PostProvider>
                    <NavigationScreen />
                </PostProvider>
            </AuthProvider>
        </NavigationContainer>
    )
}

export default Navigation