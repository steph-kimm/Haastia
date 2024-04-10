import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, SafeAreaView } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import FooterList from '../components/footer/FooterList'
// import {KeyboardAwareScrollView} NOTE: need to add this later to be able to see while typing
import { AuthContext } from '../context/auth'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import * as ImagePicker from "expo-image-picker"
import { storage } from '../context/storage' 

const Account = () => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [state, setState] = useContext(AuthContext);
    const [image, setImage] = useState({
        url: "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg",
        public_id: ""
    }) //TODO: this should be set in the UseEffect based on if the user has it!
    const [uploadImage, setUploadImage] = useState('');

    useEffect(() => {
        console.log(state)
        if (state) {
            const { name, email, role, image } = state.user;
            setName(name);
            setEmail(email);
            setRole(role);
            setImage(image)
        }
    }, [state])

    const handleSubmit = async () => {
        if (password.length < '') {
            alert("Password must be at least 6 characters long");
            return;
        }
        try {
            const user= state.user;
            console.log("USER IN SUBMIT", user);
            const res = await axios.post('http://localhost:8000/api/update-password', {password, user})
            const data = res.data;
            if(data.error) alert(data.error);
            else{
                alert("Password Updated susccesfully")
                setPassword('');
            }
        } catch (error) {
            alert("Password update failed")
            console.log(error);
        }
    }


    const handleImageUpload = async () => {
        console.log('handling photo upload');
        let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            alert("Camera access is required");
            return;
        }
        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            base64: true,
        });
        if (pickerResult.canceled === true) {
            return;
        }
        console.log("USERFIRST, ", state);
        console.log('pickerResult' ,  pickerResult.assets[0].uri);
        
        

        const base64Image = `data:image/jpg;base64,${pickerResult.assets[0].base64}`;
        // const base64Image = `data:image/jpg;base64,${pickerResult.base64}`;
        // console.log('photo', base64Image);


        // setUploadImage(photo.uri);
        setUploadImage(base64Image);
        // storage.set('user', JSON.stringify(resp.data)); // better alt to bottom
        // let storedData = await AsyncStorage.getItem("auth-rn");

        // const parsed = JSON.parse(state);
        console.log("state, ", state.user);
        // console.log("storage user, ", storage.get('user'));


        //pass in base64 image 
        const { data } = await axios.post("http://localhost:8000/api/upload-image", { //this goes to Cloudinary
            image:  base64Image, // photo,
            user: state.user //parsed.user
        });

        console.log("UPLOADED RESPONSE => ", data); 
        console.log('CURRENT STATE', state)
        let update_state = state;
        update_state.user = data;
        // const new_user = data;

        storage.set('user', JSON.stringify(update_state));
        setState({...state, user:data})
        setImage(date.image);
        alert('profile image saved');

    };

    return (
        <>
            <View style={{ marginVertical: 100 }}>

                <View style={styles.imageContainer}>
                {/* 
                    first image comes from the user state.
                    If that is empty then it will go to the image someone JUST uploaded

                */}

                    {image && image.url ? <Image source={{ uri: image.url }} style={styles.imageStyles} /> : (
                        uploadImage ? <Image source={{uri: uploadImage}} style={styles.imageStyles} /> : (
                        
                        <TouchableOpacity onPress={() => handleImageUpload()}>
                            <FontAwesome5 name="camera" size={25} color="darkmagenta" style={styles.iconStyle} />
                        </TouchableOpacity>
                        )
                    )}
                </View>

                {image && image.url ? (
                    <TouchableOpacity onPress={() => handleImageUpload()}>
                        <FontAwesome5 name="camera" size={25} color="darkmagenta" style={styles.iconStyle} />
                    </TouchableOpacity>
                ) : (
                    <></>
                )}

                <Text style={styles.signupText}>{name}</Text>
                <Text style={styles.emailText}>{email}</Text>
                <Text style={styles.roleText}>{role ? role : "member"}</Text>
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
    iconStyle: { marginTop: -5, marginBottom: 10, alignSelf: 'center' },
    container: { flex: 1, justifyContent: 'space-between' },
    signupText: { fontSize: 30, textAlign: 'center', paddingBottom: 10 },
    emailText: { fontSize: 18, textAlign: 'center', paddingBottom: 10 },
    roleText: { fontSize: 16, textAlign: 'center', paddingBottom: 10, color: 'gray' },
    signupInput: { borderBottomWidth: 0.5, height: 48, borderBottomColor: "#893a1", marginBottom: 30 },
    buttonStyle: { backgroundColor: "darkmagenta", height: 50, marginBottom: 20, justifyContent: "center", marginHorizontal: 15, borderRadius: 15 },
    buttonText: { fontSize: 20, textAlign: 'center', color: '#fff', textTransform: 'uppercase', fontweight: 'bold' },
    imageContainer: { justifyContent: "center", alignItems: "center" },
    imageStyles: { width: 100, height: 100, marginVertical: 20 },
    // mainText: {fontSize:30, textAlign: 'center'}
})

export default Account