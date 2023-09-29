import React , {useState, useEffect, createContext} from 'react';
import { MMKV } from 'react-native-mmkv';

const AuthContext = createContext();

const AuthProvider = ({children}) => {
    const [state, setState] =  useState({
        user:null, token: '',
    });

    useEffect(() => {
        const loadFromFromAynchStorage = async () => {
            const data = MMKV.get('user'); 
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