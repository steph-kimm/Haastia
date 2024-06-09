import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import FooterList from '../components/footer/FooterList'
// import {KeyboardAwareScrollView} TODO: need to add this later to be able to see while typing
import { AuthContext } from '../context/auth'
import axios from 'axios'
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import * as ImagePicker from "expo-image-picker"
import { storage } from '../context/storage'
import { PostContext } from '../context/post'
import Post from '../components/Post'
import { useNavigation } from '@react-navigation/native';
import PasswordChange from '../components/ChangePassword'


const Settings = ({user}) => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [location, setLocation] = useState("");
    const [rating, setRating] = useState(0);
    const [jobsDone, setJobsDone] = useState(0);
    const [state, setState] = useContext(AuthContext);
    const [id, setId] = useState("");
    const [image, setImage] = useState({
        url: "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg",
        public_id: ""
    }) //TODO: this should be set in the UseEffect based on if the user has it!
    const [uploadImage, setUploadImage] = useState('');
    const [posts, setPosts] = useContext(PostContext);
    const navigation = useNavigation();

    useEffect(() => {
        if (state) {
            const { name, email, role, image, _id, location, rating, jobs_done } = state.user;
            setName(name);
            setEmail(email);
            setRole(role);
            setImage(image)
            setId(_id);
            setLocation(location);
            setRating(rating);
            setJobsDone(jobs_done);
        }
        const fetchPosts = async () => {
            const res = await axios.get("http://localhost:8000/api/get-posts");
            setPosts(res.data);
        };
        fetchPosts();
    }, [state])

    const handleImageUpload = async () => {
        // console.log('handling photo upload');
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

        const base64Image = `data:image/jpg;base64,${pickerResult.assets[0].base64}`;
        setUploadImage(base64Image);

        console.log("state, ", state.user);


        //pass in base64 image 
        const { data } = await axios.post("http://localhost:8000/api/upload-image", { //this goes to Cloudinary
            image: base64Image, // photo,
            user: state.user //parsed.user
        });


        let update_state = state;
        update_state.user.image = data.image;
        // const new_user = data;
        storage.set('user', JSON.stringify(update_state));
        setState(update_state);
        // setState({...state, user:data})
        setImage(data.image);
        alert('profile image saved');

    };

    return (
        <>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ marginVertical: 100 }}>
                    <View style={styles.rowContainer}>
                    <View style={styles.imageContainer}>
                        {(image && image.url) || uploadImage ? (
                            <Image source={{ uri: image?.url || uploadImage }} style={styles.imageStyles} />
                        ) : (
                            <TouchableOpacity onPress={() => handleImageUpload()}>
                                <FontAwesome5 name="camera" size={25} color="gray" style={styles.iconStyle} />
                            </TouchableOpacity>
                        )}
                    </View>
                    </View>

                    {/* <Text style={styles.signupText}>{name}</Text>
                    <Text style={styles.roleText}> {location ? location : "New York, NY"} </Text> */}
                    {<PasswordChange user={state.user}/>}
                </View>
            </ScrollView>
        </>
    )
}

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Adjust the spacing between the views
        alignItems: 'center', // Align the views vertically
        paddingHorizontal: 10, // Add horizontal padding to the container
      },
    iconStyle: { marginTop: -5, marginBottom: 10, alignSelf: 'center' },
    container: { flex: 1, justifyContent: 'space-between' },
    signupText: { fontSize: 30, textAlign: 'center', paddingBottom: 10, marginTop:30 },
    emailText: { fontSize: 18, textAlign: 'center', paddingBottom: 10 },
    roleText: { fontSize: 16, textAlign: 'center', paddingBottom: 10, color: 'gray' },
    signupInput: { borderBottomWidth: 0.5, height: 48, borderBottomColor: "#893a1", marginBottom: 30 },
    buttonStyle: { backgroundColor: "darkmagenta", height: 50, marginBottom: 20, justifyContent: "center", marginHorizontal: 15, borderRadius: 15 },
    buttonText: { fontSize: 20, textAlign: 'center', color: '#fff', textTransform: 'uppercase', fontweight: 'bold' },
    imageContainer: { justifyContent: "center", alignItems: "center" },
    imageStyles: { width: 100, height: 100, marginVertical: 20 },
    image: { height: '70%', width: '100%', borderTopRightRadius: 14, borderTopLeftRadius: 14 },
    box: {
        backgroundColor: "#fff", width: 380, height: 280, borderRadius: 14, shadowColor: "#171717",
        shadowOffset: { width: -2, height: 4 }, shadowOpacity: 0.2, shadowRadius: 3, marginBottom: 20, marginRight: 15, marginLeft: 15
    },
    title: {
        fontWeight: 'bold',
        fontSize: 20
    },
    bigText: {
        fontSize: 23, // Adjust the font size as needed
        color: 'purple', // Set the color to purple
        fontWeight: 'bold', // Optional: Add bold font weight
        marginTop: 30,
      },
})

export default Settings