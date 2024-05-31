import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import FooterList from '../components/footer/FooterList'
// import {KeyboardAwareScrollView} NOTE: need to add this later to be able to see while typing
import { AuthContext } from '../context/auth'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import * as ImagePicker from "expo-image-picker"
import { storage } from '../context/storage'
import { PostContext } from '../context/post'
import Post from '../components/Post'
import { useNavigation } from '@react-navigation/native';


const Account = () => {
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
        // console.log('state.user', state.user);
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
            // console.log('posts', posts);
        };
        fetchPosts();
    }, [state])

    const handleSubmit = async () => {
        if (password.length < '') {
            alert("Password must be at least 6 characters long");
            return;
        }
        try {
            const user = state.user;
            // console.log("USER IN SUBMIT", user);
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

    const handleSave = async (item) => {
        console.log('item=>', item);
        let new_saved = saved;
        new_saved.push(item);
        // NOTE: If you're usuing this function there is an updated one in the Home screen
        try {
            const user = state.user;
            const res = await axios.post('http://localhost:8000/api/update-saved-posts', { posts: new_saved, user })
            const data = res.data;
            if (data.error) alert(data.error);
            else {
                alert("Post saved successfully")
                setSaved(new_saved);
            }
        } catch (error) {
            alert("Post update failed")
            console.log(error);
        }
    }

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
        // const base64Image = `data:image/jpg;base64,${pickerResult.base64}`;

        // setUploadImage(photo.uri);
        setUploadImage(base64Image);
        // storage.set('user', JSON.stringify(resp.data)); // better alt to bottom
        // let storedData = await AsyncStorage.getItem("auth-rn");

        // const parsed = JSON.parse(state);
        console.log("state, ", state.user);
        // console.log("storage user, ", storage.get('user'));


        //pass in base64 image 
        const { data } = await axios.post("http://localhost:8000/api/upload-image", { //this goes to Cloudinary
            image: base64Image, // photo,
            user: state.user //parsed.user
        });

        console.log("UPLOADED RESPONSE => ", data);
        console.log('CURRENT STATE', state)
        let update_state = state;
        update_state.user.image = data.image;
        // const new_user = data;
        console.log('updated State', update_state)
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
                                        {/* <View style={styles.imageContainer}>

                        {image && image.url ? <Image source={{ uri: image.url }} style={styles.imageStyles} /> : (
                            uploadImage ? <Image source={{ uri: uploadImage }} style={styles.imageStyles} /> : (

                                <TouchableOpacity onPress={() => handleImageUpload()}>
                                    <FontAwesome5 name="camera" size={25} color="darkmagenta" style={styles.iconStyle} />
                                </TouchableOpacity>
                            )
                        )}
                    </View> */}

                    {/* {image && image.url ? (
                        <TouchableOpacity onPress={() => handleImageUpload()}>
                            <FontAwesome5 name="camera" size={25} color="darkmagenta" style={styles.iconStyle} />
                        </TouchableOpacity>
                    ) : (
                        <></>
                    )} */}
                    <View style={styles.rowContainer}>
                    <View>
                        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                            <FontAwesome5 name="cog" size={50} color="gray" style={styles.iconStyle} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.imageContainer}>
                        {(image && image.url) || uploadImage ? (
                            <Image source={{ uri: image?.url || uploadImage }} style={styles.imageStyles} />
                        ) : (
                            <TouchableOpacity onPress={() => handleImageUpload()}>
                                <FontAwesome5 name="camera" size={25} color="gray" style={styles.iconStyle} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View>
                        <TouchableOpacity onPress={() => { }}>
                            <FontAwesome5 name="pen" size={50} color="gray" style={styles.iconStyle} />
                        </TouchableOpacity>
                    </View>
                    </View>
                    <View style={styles.rowContainer}> 
                    <View>
                        <Text style={styles.bigText}>{jobsDone? jobsDone : "-"}</Text>
                        <Text>Jobs Done</Text>
                    </View>
                    <View>
                        {/* TODO: does rating below show correctly? */}
                        <Text style={styles.bigText}>{rating.toFixed? rating.toFixed + "/5" : "- / 5"}</Text>
                        <Text>Rating</Text>
                    </View>
                    </View>

                    <Text style={styles.signupText}>{name}</Text>
                    {/* <Text style={styles.emailText}>{email}</Text> */}
                    <Text style={styles.roleText}> {location ? location : "New York, NY"} </Text>
                    {/* <Text style={styles.roleText}> {role ? role : "member"} </Text> */}

                    {/* <View style={{ marginHorizontal: 24 }}>
                        <Text style={{ fontSize: 16, color: '#8e93a1' }}>PASSWORD</Text>
                        <TextInput style={styles.signupInput} value={password} onChangeText={text => setPassword(text)} secureTextEntry={true} autoCompleType="password" />
                    </View>
                    <TouchableOpacity onPress={handleSubmit} style={styles.buttonStyle}>
                        <Text style={styles.buttonText}>Update Password</Text>
                    </TouchableOpacity> */}

                    {/* Below Is Posts  */}
                    <Text> Your Services: </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }} >
                        {posts && posts.filter((item) => {
                            const owner_id = item.owner.id;
                            const state_id = state.user._id;

                            // console.log('item.owner.id', item.owner.id, state.user._id, item.owner._id == state.user._id, owner_id === state_id);
                            return owner_id === id
                        }).map(item => (

                            <View key={item._id} style={{ alignItems: 'center', width: '400px' }}>
                                {/* <Post item={item} handleSave={handleSave} />
                                 */}
                                <View style={styles.box}>
                                    {console.log('item.images[0]?.url', item.images[0]?.url)}
                                    {item.images[0]?.url ? <Image style={styles.image} source={{ uri: item.images[0].url }} /> : null}
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text>{item.description}</Text>
                                    <Text>${item.price}</Text>
                                    {item.owner.name ? <Text> Done By: {item.owner.name}</Text> : null}
                                </View>

                            </View>
                        ))}
                    </ScrollView>

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
    // mainText: {fontSize:30, textAlign: 'center'}
})

export default Account