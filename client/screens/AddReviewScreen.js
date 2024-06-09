import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import axios from 'axios'
import ReviewStars from '../components/ReviewStars'

const AddReviewScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { request } = route.params;
    const { client, recipient, post } = request;
    

    const [text, setText] = useState('');
    const [rating, setRating] = useState("5");
    const handleSubmit = async () => {
        console.log('client ', client, 'recipient ', recipient, 'post', post)
        try {
            const { data } = await axios.post("http://localhost:8000/api/add-review", {
                client,
                recipient,
                post,
                text,
                rating
            });
            console.log("data => ", data)
            // TODO NEXT: Once the review is added change the status of the request to reviewed or done
            setTimeout(() => {
                alert('Review added!');
                navigation.navigate('Home');
            }, 500)
        } catch (error) {
            console.log(error);
            if (error.response) {
                const { status, data } = error.response;
                if (status === 400) {
                    alert(`Bad Request: ${data.message}`);
                } else if (status === 401) {
                    alert(`Unauthorized: ${data.message}`);
                } else {
                    alert(`Error: ${data.message}`);
                }
            } else if (error.request) {
                // The request was made but no response was received
                alert('No response received from the server.');
            } else {
                // Something happened in setting up the request that triggered an error
                alert('Error occurred while sending the request.');
            }
        }
    }
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <ReviewStars rating={rating} setRating={setRating} />
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Write a review:</Text>
                    <TextInput
                        style={styles.input}
                        value={text}
                        onChangeText={setText}
                        autoCapitalize="sentences"
                        placeholder="Review"
                    />
                </View>
                <TouchableOpacity onPress={handleSubmit} style={styles.button}>
                    <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 20,
    },
    inputContainer: {
        marginVertical: 20,
    },
    label: {
        fontSize: 18,
        marginBottom: 10,
    },
    input: {
        height: 100,
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: 'darkmagenta',
        padding: 15,
        alignItems: 'center',
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddReviewScreen