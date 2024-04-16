import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image } from 'react-native';
import React, { useContext, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; //uninstall this later 
import { AuthContext } from '../../context/auth';
// import { MMKV } from 'react-native-mmkv'
import { storage } from '../../context/storage';
import { Dropdown } from 'react-native-element-dropdown';
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import * as ImagePicker from "expo-image-picker"

// keyBoardAwareScrollView
const SignUp = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [data, setData] = useState("");
  const [status, setStatus] = useState("n/a");
  const [state, setState] = useContext(AuthContext);
  const [category, setCategory] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [uploadImage, setUploadImage] = useState('');

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
    // const { data } = await axios.post("http://localhost:8000/api/upload-image", { //this goes to Cloudinary
    //   image: base64Image, // photo,
    //   user: state.user //parsed.user
    // });

    // console.log("UPLOADED RESPONSE => ", data);
    // console.log('CURRENT STATE', state)
    // let update_state = state;
    // update_state.user.image = data.image;
    // // const new_user = data;
    // console.log('updated State', update_state)
    // storage.set('user', JSON.stringify(update_state));
    // setState(update_state);
    // // setState({...state, user:data})
    // setImage(data.image);
    // alert('profile image saved');

  };

  const handleSubmit = async () => {
    if (name === '' || email === '' || password === '') {
      alert("All fields are required");
      return;
    }
    setStatus("PENDING")
    const resp = await axios.post("http://localhost:8000/api/signup", { name, email, password, location, role: category, image: uploadImage });
    if (resp.data.error)
      alert(resp.data.error)
    else {
      setState(resp.data);
      storage.set('user', JSON.stringify(resp.data)); //tested. Alt for bottom
      // await AsyncStorage.setItem("auth-rn", JSON.stringify(resp.data));
      alert("Sign Up Successful")
      navigation.navigate("Home")
    }
  };
  const categoryOptions = [
    { label: 'Customer', value: 'Customer' },
    { label: 'Beautician', value: 'Beautician' },
  ];

  return (

    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {/* <Image source={require('../assets/logo.png')} style={styles.imageStyles} /> */}
      </View>

      <Text style={styles.signupText}>Sign Up</Text>
      <View style={{ marginHorizontal: 24 }}>
        <Text style={{ fontSize: 16, color: '#Be93a1' }}> NAME</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.signupInput} value={name} onChangeText={text => setName(text)} autoCapitalize='words' autoCorrect={false} />
        </View>
      </View>
      <View style={{ marginHorizontal: 24 }} >
        <Text style={{ fontSize: 16, color: '#8e93a1' }}>EMAIL</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.signupInput} value={email} onChangeText={text => setEmail(text)} autoCompleteType='email' keyboardType='email-address' />
        </View>
      </View>
      <View style={{ marginHorizontal: 24 }}>
        <Text style={{ fontSize: 16, color: '#8e93a1' }}>PASSWORD</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.signupInput} value={password} onChangeText={text => setPassword(text)} secureTextEntry={true} autoCompleteType='password' />
        </View>
      </View>
      <View style={{ marginHorizontal: 24 }}>
        <Text style={{ fontSize: 16, color: '#8e93a1' }}>LOCATION</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.signupInput} value={location} onChangeText={text => setLocation(text)} />
        </View>
      </View>
      <Dropdown
        style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={categoryOptions}
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? 'Select item' : '...'}
        searchPlaceholder="Search..."
        value={category}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={item => {
          setCategory(item.value);
          setIsFocus(false);
        }}
      />
      <TouchableOpacity onPress={() => handleImageUpload()}>
                                    <FontAwesome5 name="camera" size={25} color="darkmagenta" style={styles.iconStyle} />
                                </TouchableOpacity>
      <TouchableOpacity onPress={handleSubmit} style={styles.buttonStyle}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 12, textAlign: 'center' }}>
        Already Joined? {" "}
        <Text style={{ color: 'darkred', fontWeight: 'bold' }} onPress={() => navigation.navigate('SignIn')}>
          Sign In
        </Text>
      </Text>
      <Text style={{ marginHorizontal: 24 }}> {JSON.stringify({ name, email, password })} {status}</Text>

    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 30,
    textAlign: 'center',
  },
  signupInput: {
    height: 44,
    // borderBottomWidth: 0.5,
    // borderBottomColor: '#8ec93a1',
    // padding: 10,
  },
  inputWrapper: {
    borderBottomWidth: 2,
    paddingRight: 40,
    // width: 200,
    borderBottomColor: '#8e93a1',
  },
  buttonStyle: {
    backgroundColor: "darkmagenta",
    height: 50,
    marginBottom: 20,
    marginTop: 20,
    justifyContent: "center",
    marginHorizontal: 15,
    borderRadius: 15,
  },
  buttonText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#fff',
    textTransform: 'uppercase',
    fontWeight: 'bold'
  },
  imageContainer: {
    justifyContent: 'center', alignItems: 'center'
  },
  imageStyles: {
    width: 180,
    height: 180,
    marginVertical: 5
  },
});

export default SignUp;
