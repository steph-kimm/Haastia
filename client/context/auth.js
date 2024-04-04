import React , {useState, useEffect, createContext} from 'react';
import { MMKV } from 'react-native-mmkv';
import { storage } from './storage';
import { useNavigation } from '@react-navigation/native';
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({children}) => {
    const [state, setState] =  useState({
        user:null, token: '',
    });

    // navigation 
    const navigation = useNavigation();

    // config axios
    const token = state && state.token ? state.token: '' ;
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // handle expired token or 401 error 
    axios.interceptors.response.use(
        async function (response) {
            return response;
        },
        async function (error) {
            let res = error.response;
            if (res.status === 401 && res.config && !res.config.__isRetryRequest) {
                await AsyncStorage.removeItem("auth-rn"); // TODO- change this to the new stoarge 
                setState({ user: null, token: "" });
                navigation.navigate("SignIn");
            }
        }
    );



    useEffect(() => {
        const loadFromFromAynchStorage = async () => {
            // const data = MMKV.get('user'); 
            // setState({...state, data  })
            
            const data = storage.getString('user'); 
            setState({...state, data  })
        }
        loadFromFromAynchStorage();
        
    }, [])

    return (
        <AuthContext.Provider value={[state, setState]}>
            {children}
        </AuthContext.Provider>
    )
}

export {AuthContext, AuthProvider}