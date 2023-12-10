import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, SafeAreaView } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import FooterList from '../components/footer/FooterList'
// import {KeyboardAwareScrollView} NOTE: need to add this later? 
import { AuthContext } from '../context/auth'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const Account = () => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [state, setState] = useState("");

    useEffect(() => {
        if (state) {
            const { name, email, role } = state.user;
            setName(name);
            setEmail(email);
            setRole(role);
        }
    }, [state])

    const handleSubmit = async () => {
        if (email === '' || password === '') {
            alert("All fields are required");
            return;
        }
        const resp = await axios.post("http: //localhost: 8000/api/signin", { email, password });
        if (resp.data.error)
            alert(resp.data.error)
        else {
            setState(resp.data);
            await AsyncStorage.setItem("auth-rn", JSON.stringify(resp.data));
            alert("Sign In Successful")
            navigation.naviage("Home")
        }
    }

    return (
        <>
            <View style={{ marginVertical: 100 }}>
                <View style={styles.imageContainer}>
                    <Image source={require("../assets/logo.png")} style={styles.imageStyles} />
                </View>
                <Text style={styles.signupText}>{name}</Text>
                <Text style={styles.emailText}>{email}</Text>
                <Text style={styles.roleText}>{role}</Text>
                <View style={{ marginHorizontal: 24 }}>
                    <Text style={{ fontSize: 16, color: '#8e93a1' }}>PASSWORD</Text>
                    <TextInput style={styles.signupInput} value={password} onChangeText={text => setPassword(text)} secureTextEntry={true} autoCompleType="password" />
                </View>
                <TouchableOpacity onPress={handleSubmit} style={styles.buttonStyle}>
                    <Text style={styles.buttonText}>Update Password</Text>
                </TouchableOpacity>
            </View>
        </>

        // <SafeAreaView style={styles.container}>
        //     <Text style={styles.mainText}> Account Component </Text>
        //     <FooterList/>
        // </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'space-between' },
    signupText: { fontSize: 30, textAlign: 'center', paddingBottom: 10 },
    emailText: { fontSize: 18, textAlign: 'center', paddingBottom: 10 }, 
    roleText: {fontSize: 16, textAlign: 'center', paddingBottom: 10, color: 'gray'}, 
    signupInput: { borderBottomWidth: 0.5, height: 48, borderBottomColor: "#893a1", marginBottom: 30 },
    buttonStyle: { backgroundColor: "darkmagenta", height: 50, marginBottom: 20, justifyContent: "center", marginHorizontal: 15, borderRadius: 15}, 
    buttonText: { fontSize: 20, textAlign: 'center', color: '#fff', textTransform: 'uppercase', fontweight: 'bold' }, 
    imageContainer: {justifyContent: "center", alignItems: "center" }, 
    imageStyles: { width: 100, height: 100, marginVertical: 20 },
        // mainText: {fontSize:30, textAlign: 'center'}
    })

export default Account