import {StyleSheet, Text, View, TextInput, TouchableOpacity, Image} from 'react-native';
import React, { useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/auth';
import { MMKV } from 'react-native-mmkv';
import { storage } from '../../context/storage';

// keyBoardAwareScrollView


const SignIn = ({navigation}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useContext(AuthContext);

  
  const handleSubmit = async () => {
    if (email=== ''|| password=== ''){
      alert ("All fields are required");
      return;
    }
    // await axios.post('http://localhost:8000/api/signin', { name, email, password })
      // // .then((response) => response.json())
      // .then((data) => {
      //   // Use the data from the server here
      //   // setData(JSON.stringify(data));
      //   setState(data);
      //   MMKV.set('user', data); //untested
      //   console.log('data', data)
      //   // MMKV.setMapAsync('user', data); //untested
      //   navigation.navigate('Home');
      // })
      // .catch((error) => {
      //   // Handle any errors that occur
      //   alert("Wrong email or password!");
      //   console.error(error);
      // });
      const resp = await axios.post("http://localhost:8000/api/signin", { email, password });
        if (resp.data.error)
            alert(resp.data.error)
        else {
            setState(resp.data);
            storage.set('user', JSON.stringify(resp.data)); //tested

            // await AsyncStorage.setItem("auth-rn", JSON.stringify(resp.data));
            alert("Sign In Successful")
            navigation.navigate("Home")
        }
    // const resp = await axios.post('http://localhost:8000/api/signin', {email, password});
    // if(resp.data.error)
    //   alert(resp.data.error)
    // else
    //   alert ("Sign n Successful");
    // // console.log(resp.data)

    // // await axios.post ("http://localhost:8001/api/signin", { name, email, password }) ;
    // alert ("Sign Up Successful");
  };
  return (

    <View style={styles.container}>
      <View style={styles.imageContainer}>
      <Image source={require('../../assets/logo.png')} style={styles.imageStyles}/>
      </View>

      {/* <Text style={styles.signupText}>Sign In</Text>
      <View style={{marginHorizontal: 24}}>
        <Text style={{fontSize: 16, color: '#Be93a1'}}> NAME</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.signupInput} value={name} onChangeText={text => setName(text)} autoCapitalize='words' autoCorrect={false}/>
        </View>
      </View> */}

          <View style={{ marginHorizontal: 24 }} >
            <Text style={{ fontSize: 16, color:'#8e93a1' }}>EMAIL OR NAME </Text> 
            {/* TODO: Add a login with the name */}
            <View style={styles.inputWrapper}>
              <TextInput style={styles. signupInput} value={email} onChangeText={text => setEmail (text)} autoCompleteType='email' keyboardType='email-address'/>
            </View>
          </View>
          <View style={{ marginHorizontal: 24 }}>
            <Text style={{ fontSize: 16, color: '#8e93a1' }}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.signupInput} value={password} onChangeText={text => setPassword(text)} secureTextEntry={true} autoCompleteType='password'/>
            </View>
          </View>
          
          <TouchableOpacity onPress={handleSubmit} style={styles.buttonStyle}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, textAlign: 'center' }}>
                    Not yet registered? {" "}
                    <Text  style={{ color:'darkred', fontWeight: 'bold'}} onPress={() => navigation.navigate('SignUp')}>
                        Sign Up
                    </Text>
          </Text>
          {/* <Text onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotText}> Forgot Password?</Text> */}

          <Text style={{ marginHorizontal: 24}}> {JSON.stringify({ name, email, password })}</Text>
      
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  firgitText: {fontsize: 12, textAlign: 'center', marginTop:10, color: 'darkgreen', fontWeight:'bold'},
  signupText: {
    fontSize: 30,
    textAlign: 'center',
  },
  signupInput: {
    height: 44,
    // borderWidth: 3,
    // padding: 10,
  },
  inputWrapper: {
    borderBottomWidth: 2,
    // width: 200,
    borderBottomColor: '#8e93a1',
    paddingRight: 40,
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
  color: '#fff' ,
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

export default SignIn;
