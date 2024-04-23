import { StyleSheet, Text, SafeAreaView, View, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import CurrencyInput from 'react-native-currency-input';
import React, { useContext, useState } from 'react'
import FooterList from '../components/footer/FooterList';
import axios from 'axios';
// import RNPickerSelect from 'react-native-picker-select';
import { Dropdown } from 'react-native-element-dropdown';
import { PostContext } from '../context/post';
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import * as ImagePicker from "expo-image-picker"
import { AuthContext } from '../context/auth'

const AddPost = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState("0");
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [category, setCategory] = useState(null);
    const [isFocus, setIsFocus] = useState(false);
    const [posts, setPosts] = useContext(PostContext);
    const [state, setState] = useContext(AuthContext);
    const [addOnsCount, setAddOnsCount] = useState(0);
    const [addOns, setAddOns] = useState([]);

    const handleSubmit = async () => {
        if (title === '') {
            alert("Please add a title");
            return;
        }
        try {
            console.log('title, description, price, category,', title, description, price, category,);
            const { data } = await axios.post("http://localhost:8000/api/add-post", {
                title, description, price, category, images, owner: state.user, addOns
                // images
            }); //TODO: Make a token required when passing in and send it via a header.
            // TODO: verify the add-Ons
            console.log("data => ", data)
            setPosts([data, ...posts])
            setTimeout(() => {
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
    const handleImageUpload = async () => {
        console.log('handling photo upload');
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
        let oldImagesArray = images; //TODO: better way to do this?
        oldImagesArray.push(base64Image);
        setImages(oldImagesArray);
        // setImages(oldArray => [...oldArray, base64Image] );
        console.log(images)
    };
    const handleAddOnChange = (count) => {
        if (count !== addOnsCount) {
          setAddOnsCount(count);
          if (count < addOns.length) {
            // Remove excess add-ons if count decreases
            setAddOns(addOns.slice(0, count));
          }
        }
      };

    const handleAddOnFieldChange = (index, field, value) => {
        const updatedAddOns = [...addOns];
        updatedAddOns[index] = { ...updatedAddOns[index], [field]: value };
        setAddOns(updatedAddOns);
    };

    const renderAddOnFields = () => {
        return Array.from({ length: addOnsCount }, (_, index) => (
            <View key={index} style={styles.addOnContainer}>
                <Text style={styles.label}>Add-On {index + 1}</Text>
                <TextInput
                    style={styles.input}
                    value={addOns[index]?.title || ''}
                    onChangeText={(text) => handleAddOnFieldChange(index, 'title', text)}
                    placeholder="Title"
                />
                <CurrencyInput
                    style={styles.input}
                    value={addOns[index]?.price || ''}
                    onChangeValue={(text) => handleAddOnFieldChange(index, 'price', text)}
                    delimiter=","
                    separator="."
                    placeholder="Price"
                />
                <TextInput
                    style={[styles.input, { height: 100 }]} // Adjust height for description input
                    value={addOns[index]?.description || ''}
                    onChangeText={(text) => handleAddOnFieldChange(index, 'description', text)}
                    multiline={true}
                    placeholder="Description"
                />
            </View>
        ));
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.maintext}>POST</Text>
                <TouchableOpacity onPress={() => handleImageUpload()}>
                    <FontAwesome5 name="camera" size={25} color="darkmagenta" style={styles.iconStyle} />
                </TouchableOpacity>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>TITLE</Text>
                    <TextInput style={styles.input} value={title} onChangeText={text => setTitle(text)}
                        autoCapitalize="sentences" placeholder="Give a title" />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput style={styles.input} value={description} onChangeText={text => setDescription(text)}
                        autoCapitalize="sentences" placeholder="Give a Description" />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Price</Text>
                    <CurrencyInput style={styles.input} value={price} onChangeValue={text => setPrice(text)} delimiter=","
                        separator="." placeholder="Give a Price" />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Category</Text>
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
                </View>
                {/* <View style={{ marginhorizontal: 24 }}>
                    <Text style={{ fontsize: 16, color: "88e9331" }}>LINK</Text>
                    <TextInput style={styles.postInput} value={link} onChangeText={text => settink(text)}
                        autoCapitalize="none" autoCorrect={false} placeholder="Paste the ur!" />
                </View> */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Add-Ons?</Text>
                    <Dropdown
                        style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        iconStyle={styles.iconStyle}
                        data={[
                            { label: '0', value: 0 },
                            { label: '1', value: 1 },
                            { label: '2', value: 2 },
                            { label: '3', value: 3 },
                            { label: '4', value: 4 },
                            { label: '5', value: 5 },
                        ]}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder={!isFocus ? 'Select number of add-ons' : '...'}
                        searchPlaceholder="Search..."
                        value={addOnsCount}
                        // onFocus={() => setIsFocus(true)}
                        // onBlur={() => setIsFocus(false)}
                        onChange={item => {
                            handleAddOnChange(item.value);
                        }}
                    />
                </View>

                {/* <View style={styles.inputContainer}>
                    <Text style={styles.label}>Add-On</Text>
                    <Dropdown
                        style={styles.dropdown}
                        placeholder="Select number of add-ons"
                        items={[
                            { label: '0', value: 0 },
                            { label: '1', value: 1 },
                            { label: '2', value: 2 },
                            { label: '3', value: 3 },
                            { label: '4', value: 4 },
                            { label: '5', value: 5 },
                        ]}
                        defaultValue={0}
                        containerStyle={{ height: 40 }}
                        // onChangeItem={(item) => handleAddOnChange(item.value)}
                    />
                </View> */}
                {renderAddOnFields()}

                <TouchableOpacity onPress={handleSubmit} styles={styles.button} >
                    <Text styles={styles.buttonText}>Submit</Text >
                </TouchableOpacity >
            </ScrollView>
            <FooterList />
        </SafeAreaView >

    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 24,
    },
    mainText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        // color: '#333',
    },
    iconStyle: {

    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        // color: "#8e9331",
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
    },
    dropdown: {
        borderWidth: 1,
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    placeholderStyle: {
        color: '#8e9331',
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    inputSearchStyle: {
        fontSize: 16,
    },
    button: {
        backgroundColor: 'darkmagenta',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    //   descriptionInput: {
    //     borderWidth: 1,
    //     borderColor: '#ccc',
    //     borderRadius: 5,
    //     padding: 10,
    //     fontSize: 16,
    //     minHeight: 100, // Adjust the minimum height of the description input
    //     textAlignVertical: 'top', // Align the text at the top vertically
    //   },

})

export default AddPost