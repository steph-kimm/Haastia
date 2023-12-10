import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"


const FooterItem = ({ name, text,handlePress, screenName, routeName }) => {
    const activeScreenColor = screenName === routeName && "darkmagenta";
    // console.log(screenName === routeName)
    return (
        <TouchableOpacity onPress={handlePress}>
            <>
                <FontAwesome5 name={name} size={25} style={styles.fontStyle} color={activeScreenColor}/>
                <Text style={styles.iconText}>{text}</Text>
            </>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    fontStyle: {marginBottom: 3, alignSelf: "center" },
    iconText: { fontSize: 12, textAlign: 'center', textTransform: 'uppercase' }
})

export default FooterItem