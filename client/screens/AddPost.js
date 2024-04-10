import { StyleSheet, Text, SafeAreaView, View, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import CurrencyInput from 'react-native-currency-input';
import React, { useContext, useState } from 'react'
import FooterList from '../components/footer/FooterList';
import axios from 'axios';
// import RNPickerSelect from 'react-native-picker-select';
import { Dropdown } from 'react-native-element-dropdown';
import { PostContext } from '../context/post';

const Post = ({navigation}) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(null);
    const [price, setPrice] = useState("0");
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([{
        url: "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg",
        public_id: ""
    }])
    const [isFocus, setIsFocus] = useState(false);

    const handleSubmit = async () => {
        if (title === '') {
            alert("Please add a title");
            return;
        }
        try {
            console.log('title, description, price, category,', title, description, price, category,);
            const { data } = await axios.post("http://localhost:8000/api/add-post", {
                title, description, price, category,
                // images
            });
            console.log("data => ", data)
            setTimeout(()=> {
                alert('Post added');
                navigation.navigate('Home');
            }, 500)
        } catch (error) {
            console.log(error);
        }
    }
    const categoryOptions = [
        { label: 'Hair', value: 'Hair' },
        { label: 'Nails', value: 'Nails' },
        { label: 'Waxing', value: 'Waxing' },
        { label: 'Massage', value: 'Massage' },
        { label: 'Other', value: 'Other' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.maintext}>POST</Text>
                <View style={{ marginHorizontal: 24 }}>
                    <Text style={{ fontSize: 16, color: " 8e9331" }}>TITLE</Text>
                    <TextInput style={styles.postInput} value={title} onChangeText={text => setTitle(text)}
                        autoCapitalize="sentences" placeholder="Give a title" />
                </View>
                <View style={{ marginHorizontal: 24 }}>
                    <Text style={{ fontSize: 16, color: " 8e9331" }}>Description</Text>
                    <TextInput style={styles.postInput} value={description} onChangeText={text => setDescription(text)}
                        autoCapitalize="sentences" placeholder="Give a Description" />
                </View>
                <View style={{ marginHorizontal: 24 }}>
                    <Text style={{ fontSize: 16, color: " 8e9331" }}>Price</Text>
                    <CurrencyInput style={styles.postInput} value={price} onChangeValue={text => setPrice(text)} delimiter=","
                        separator="." placeholder="Give a Price" />
                </View>
                <View style={{ marginHorizontal: 24 }}>
                    <Text style={{ fontSize: 16, color: " 8e9331" }}>Category</Text>
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
                        // renderLeftIcon={() => (
                        //     <AntDesign
                        //         style={styles.icon}
                        //         color={isFocus ? 'blue' : 'black'}
                        //         name="Safety"
                        //         size={20}
                        //     />
                        // )}
                    />
                </View>
                {/* <View style={{ marginhorizontal: 24 }}>
                    <Text style={{ fontsize: 16, color: "88e9331" }}>LINK</Text>
                    <TextInput style={styles.postInput} value={link} onChangeText={text => settink(text)}
                        autoCapitalize="none" autoCorrect={false} placeholder="Paste the ur!" />
                </View> */}

                <TouchableOpacity onPress={handleSubmit} styles={styles.buttonStyle} >
                    <Text styles={styles.buttonText}>Submit</Text >
                </TouchableOpacity >
            </ScrollView>
            <FooterList />
        </SafeAreaView >

    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mainText: { fontSize: 30, textAlign: 'center' },
    postInput: { borderBottomWidth: 0.5, height: 48, borderBottomColor: "#8e93a1", marginBottom: 30 },
    buttonStyle: {
        backgroundColor: "darkmagenta",
        height: 50,
        marginBottom: 20,
        justifycontent: "center",
        marginHorizontal: 15,
        borderRadius: 15,
    },
    buttonText: {
        fontsize: 20,
        textAlign: "center",
        color: "#fff",
        textTransform: "uppercase",
        fontWeight: "bold"
    },

})

export default Post