import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import axios from 'axios'

const PasswordChange = ({user}) => {
    const [password, setPassword] = useState("");
    const handleSubmit = async () => {
        if (password.length < '') {
            alert("Password must be at least 6 characters long");
            return;
        }
        try {
            const res = await axios.post('http://localhost:8000/api/update-password', { password, user })
            const data = res.data;
            if (data.error) alert(data.error);
            else {
                alert("Password Updated susccesfully")
                setPassword('');
            }
        } catch (error) {
            alert("Password update failed")
            console.log(error);
        }
    }

    return (
    <>
        <View style={{ marginHorizontal: 24 }}>
            <Text style={{ fontSize: 16, color: '#8e93a1' }}>PASSWORD</Text>
            <TextInput style={styles.signupInput} value={password} onChangeText={text => setPassword(text)} secureTextEntry={true} autoCompleType="password" />
        </View>
        <TouchableOpacity onPress={handleSubmit} style={styles.buttonStyle}>
            <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
    </>
    )
}

const styles = StyleSheet.create({
    signupInput: { borderBottomWidth: 0.5, height: 48, borderBottomColor: "#893a1", marginBottom: 30 },
    buttonStyle: { backgroundColor: "darkmagenta", height: 50, marginBottom: 20, justifyContent: "center", marginHorizontal: 15, borderRadius: 15 },
    buttonText: { fontSize: 20, textAlign: 'center', color: '#fff', textTransform: 'uppercase', fontweight: 'bold' },
})

export default PasswordChange