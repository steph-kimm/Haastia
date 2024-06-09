import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React from 'react'
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome5"


const Post = ({ item, handleSave }) => {
    return (
        // TODO Can remove key here since it is added in home. Just add in saved posts first. 
        <View key={item._id} style={{ alignItems: 'center', width: '100%' }}>
            <View style={styles.box}>
                {/* {console.log('item._id', item._id)} */}
                {item.images[0]?.url ? <Image style={styles.image} source={{ uri: item.images[0].url }} /> : null}
                <View style={styles.content}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text>{item.description}</Text>
                    <Text>${item.price}</Text>
                    {item.owner?.name ? <Text> Done By: {item.owner.name}</Text> : null}
                    {/* <TouchableOpacity onPress={item => {  handleSave(item._id)}}> */}
                    <TouchableOpacity onPress={() => handleSave(item._id)} style={styles.bookmarkContainer}>
                        <FontAwesome5 name="bookmark" size={25} style={styles.saveIcon} /> 
                        {/* solid */}
                    </TouchableOpacity>
                </View>
            </View> 
        </View>
    )
}

const styles = StyleSheet.create({
    fontStyle: { marginBottom: 3, alignSelf: "center" },
    iconText: { fontSize: 12, textAlign: 'center', textTransform: 'uppercase' },
    // image: { height: '70%', width: '100%', borderTopRightRadius: 14, borderTopLeftRadius: 14 },
    // box: {
    //     backgroundColor: "#fff", width: "92%", height: 280, borderRadius: 14, shadowColor: "#171717",
    // shadowOffset: { width: -2, height: 4 }, shadowOpacity: 0.2, shadowRadius: 3, marginBottom: 20,
    // },
    image: { height: '60%', width: '100%', borderTopRightRadius: 14, borderTopLeftRadius: 14 },
    box: {
        backgroundColor: "#fff", width: "92%", height: 290, borderRadius: 14, shadowColor: "#171717",
        shadowOffset: { width: -2, height: 4 }, shadowOpacity: 0.2, shadowRadius: 3, marginBottom: 20,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 20
    },
    saveIcon: {
        color: 'gray',

    },
    content: {
        flex: 1,
        padding: 15,
    },
    bookmarkContainer: {
        position: 'absolute',
        bottom: 15,
        right: 15,
    },
})

export default Post