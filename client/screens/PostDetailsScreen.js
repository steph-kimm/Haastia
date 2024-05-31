import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Button, Switch } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import { AuthContext } from '../context/auth'
import axios from 'axios'

const PostDetailsScreen = () => {
    const route = useRoute();
    const { post } = route.params;
    const { title, owner, price, description, category, images, addOns } = post;
    const [selectedAddOns, setSelectedAddOns] = useState([]); //for Add Ons
    const [state, setState] = useContext(AuthContext);

    useEffect(() => {
        console.log('selectedAddOns:', selectedAddOns);
    }, [selectedAddOns]);

    
    const handleRequestService = async () => {
        try {
            console.log('state.user._id, owner.id,post._id , selectedAddOns ', state.user._id, owner.id, post._id, selectedAddOns );
            // const selectedAddOns = [0];
            const { data } = await axios.post("http://localhost:8000/api/add-request", {
                client: state.user._id, recipient: owner.id, post: post._id, selectedAddOns, requestType: 'pending'
            });

            console.log("data => ", data)
            setPosts([data, ...posts])
            setTimeout(() => {
                alert('Request added');
                navigation.navigate('Home');
            }, 500)
        } catch (error) {
            console.log(error);
            // if (error.response) {
            //     // The request was made and the server responded with a status code
            //     // that falls out of the range of 2xx
            //     const { status, data } = error.response;
            //     if (status === 400) {
            //         alert(`Bad Request: ${data.message}`);
            //     } else if (status === 401) {
            //         alert(`Unauthorized: ${data.message}`);
            //     } else {
            //         alert(`Error: ${data.message}`);
            //     }
            // } else if (error.request) {
            //     // The request was made but no response was received
            //     alert('No response received from the server.');
            // } else {
            //     // Something happened in setting up the request that triggered an error
            //     alert('Error occurred while sending the request.');
            // }
        }
        console.log('Request service button clicked');
    };

    console.log(post);
    // Fetch post details based on postId from API or local data
    const handleAddOnChange = (addOnId, isChecked) => {
        console.log(isChecked);
        console.log('selectedAddOnsUPHERE', selectedAddOns)
        setSelectedAddOns(prevState => {
            if (isChecked) {
                return [...prevState, addOnId]; // Add the add-on id to the selected list
            } else {
                return prevState.filter(id => id !== addOnId); // Remove the add-on from the selected list
            }
        });
        console.log('selectedAddOnsHERE', selectedAddOns)
    };

    const totalPrice = () => {
        let total = post.price;
        post.addOns.forEach(addOn => {
            if (selectedAddOns.includes(addOn._id)) {
                total += addOn.price; // Add add-on price if it's selected
            }
        });
        total *= 1.1; // Add a 10% service fee
        return total;
    };

    return (
        <View style={styles.container}>
            <Image source={{ uri: images[0].url }} style={styles.photo} />
            <View style={styles.detailsContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
                <Text style={styles.owner}>Owner: {owner.name}</Text>
                <Text style={[styles.price, { color: 'green' }]}>Price: ${price}</Text>
                {/* <Text style={styles.title}>Add Ons:</Text> */}
            </View>
            <View style={styles.addOnsContainer}>
                <Text style={styles.addOnsTitle}>Add-ons:</Text>
                {post.addOns.map((addOn, index) => (
                    <View key={index} style={styles.addOnItem}>
                        <Text style={styles.addOnItemTitle}>{addOn.title}</Text>
                        <Text style={styles.addOnItemPrice}>Price: ${addOn.price}</Text>
                        <Text style={styles.addOnItemDescription}>{addOn.description}</Text>
                        {/* <Dropdown
                            style={styles.dropdown}
                            containerStyle={styles.dropdownContainer}
                            // items={[...Array(10)].map((_, i) => ({ label: `${i}`, value: i }))}
                            data={[ 
                            { label: '1', value: '1' },
                            { label: '2', value: '2' },
                            { label: '3', value: '3' },
                            { label: '4', value: '1' },
                            { label: '5', value: '5' },
                        ]}
                            defaultValue={selectedQuantities[addOn._id] || 0}
                            onChange={(item) => handleQuantityChange(addOn._id, item.value)}
                            labelField="label"
                            valueField="value"
                            value={selectedQuantities[addOn._id] || 0}
                        /> */}
                        <Switch
                            value={selectedAddOns.includes(addOn._id)} // Check if the add-on is selected
                            onValueChange={(isChecked) => handleAddOnChange(addOn._id, isChecked)}
                        />
                    </View>
                ))}
            </View>
            <View style={styles.totalPriceContainer}>
                <Text style={styles.totalPriceText}>Total Price:</Text>
                <Text style={styles.totalPrice}>${totalPrice().toFixed(2)}</Text>
            </View>
            <Button
                title="Request Service"
                onPress={handleRequestService}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    photo: {
        width: '100%',
        height: 200,
        marginBottom: 20,
    },
    detailsContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        marginBottom: 10,
    },
    owner: {
        fontSize: 16,
        marginBottom: 10,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    addOnsContainer: {
        marginTop: 20,
    },
    addOnsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    addOnItem: {
        marginBottom: 10,
    },
    addOnItemTitle: {
        fontWeight: 'bold',
    },
    addOnItemPrice: {
        fontStyle: 'italic',
    },
    addOnItemDescription: {
        marginLeft: 10,
    },
    dropdownContainer: {
        width: 100,
        borderRadius: 20,
        overflow: 'hidden',
    },
    dropdownInnerContainer: {
        backgroundColor: '#fafafa',
        borderRadius: 20,
    },
    dropdown: {
        backgroundColor: '#fafafa',
    },
    totalPriceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        borderTopWidth: 1,
        paddingTop: 10,
    },
    totalPriceText: {
        fontWeight: 'bold',
    },
    totalPrice: {
        fontWeight: 'bold',
        color: 'green',
    },
});

export default PostDetailsScreen;