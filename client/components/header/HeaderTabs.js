import { TouchableOpacity, SafeAreaView } from "react-native";
import React, { useContext } from 'react';
import { AuthContext } from "../../context/auth";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationBell from "./NotificationBell";
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

const HeaderTabs = ({icon}) => {
    const [state, setState] = useContext(AuthContext);
    const navigation = useNavigation(); // Get navigation object


    const signOut = async () => {
        setState({ token: '', user: null });
        await AsyncStorage.removeItem("auth-rn");
    };

    console.log(icon);
    return (
        <SafeAreaView>
            {icon == 'signOut' ? <TouchableOpacity onPress={signOut}>
                <FontAwesome5 name="sign-out-alt" size={25} color="darkmagenta" />
            </TouchableOpacity> : null}
            {icon == 'notification' ? <TouchableOpacity onPress={()=>navigation.navigate('Your Services')}> 
            {/* //, { post } */}
                <NotificationBell />
            </TouchableOpacity> : null}
        </SafeAreaView>
    );
}

export default HeaderTabs