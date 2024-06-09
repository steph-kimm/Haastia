import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TextInput, Button } from 'react-native';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/auth';
import { useNavigation } from '@react-navigation/native';

const Notifications = () => {
    const route = useRoute();
    const { recipientId } = route.params; // Get recipient ID from route params
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [state, setState] = useContext(AuthContext);
    const navigation = useNavigation();

    useEffect(() => {
        // Function to fetch requests by recipient ID
        //TODO: do i need to pull both always?
        const fetchbyRecipient = async () => {
            try {
                // Make GET request to fetch requests for the recipient ID
                const response = await axios.get(`http://localhost:8000/api/recipient-requests/${recipientId}`);
                setRequests(response.data.data); // Set fetched requests in state
                setLoading(false); // Set loading state to false
                console.log(requests)
            } catch (error) {
                console.log('Error fetching requests:', error);
                // Handle error
            }
        };
        const fetchbyClient = async () => {
            try {
                // Make GET request to fetch requests for the recipient ID
                const response = await axios.get(`http://localhost:8000/api/client-requests/${recipientId}`);
                setRequests(response.data.data); // Set fetched requests in state
                setLoading(false); // Set loading state to false
                console.log(requests)
            } catch (error) {
                console.log('Error fetching requests:', error);
                // Handle error
            }
        };
        fetchbyRecipient(); // Call fetchRequests function when component mounts
        fetchbyClient();
    }, [recipientId]); // Run effect when recipientId changes

    const handleAccept = async (requestId) => {
        try {
            // Make API request to update request status to "accepted"
            const response = await axios.patch(`http://localhost:8000/api/requests/${requestId}`, { requestType: 'accepted' });
            console.log(response);
            // Handle success, maybe refresh the list of requests
        } catch (error) {
            console.error('Error accepting request:', error);
            // Handle error
        }
    };

    const handleReject = async (requestId) => {
        try {
            // Make API request to update request status to "rejected"
            const response = await axios.patch(`http://localhost:8000/api/requests/${requestId}`, { requestType: 'rejected' });
            // Handle success, maybe refresh the list of requests
            console.log(response);
        } catch (error) {
            console.error('Error rejecting request:', error);
            // Handle error
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="blue" />
            </View>
        );
    }

    const handleReview = async (request) => {
        console.log('client ', client, 'recipient ', recipient, 'post', post)
        // JUST passing client ID and ricipient ID but it is the eintre post
        navigation.navigate('Add Review', { request });
    };

    return (
        <View style={{ flex: 1 }}>
            {/* <Text>Requests for Recipient ID: {recipientId}</Text> */}
            <FlatList
                data={requests}
                renderItem={({ item }) => {
                    console.log(state.user._id === item.client, state.user._id, item.recipient, state.user._id, item)
                    return (
                        <View style={styles.requestContainer}>
                            {/* <Text style={styles.postTitle}>{item.client}</Text> */}
                            <Text style={styles.postTitle}>Service: {item.post.title}</Text>
                            {/* <Text>{item.client}</Text> */}
                            {item.addOns.map((addOnId, index) => {
                                // Find the add-on with matching ID in the post's add-ons array
                                const addOn = item.post.addOns.find((addOn) => addOn._id === addOnId);
                                if (addOn) {
                                    return (
                                        <View key={index}>
                                            {/* Render add-on details */}
                                            <Text style={styles.addOnTitle}>AddOns Added:</Text>
                                            <Text>{addOn.title}</Text>
                                            <Text>{addOn.price}</Text>
                                            {/* Render other add-on details as needed */}
                                        </View>
                                    );
                                } else {
                                    return null; // Skip rendering if add-on not found
                                }
                            })}
                            <Text style={styles.payout}>Payout: ${(item.post.price * 0.85).toFixed(2)}</Text>
                            {/* Render buttons if request status is "pending" */}
                            {item.requestType === 'pending' && state.user._id === item.recipient && (
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={() => handleAccept(item._id)}>
                                        <Text style={styles.buttonText}>Accept</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => handleReject(item._id)}>
                                        <Text style={styles.buttonText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {item.requestType === 'accepted' && (
                                <View style={styles.buttonContainer}>
                                    <Text> Status: Accepted. Awaiting Service</Text>
                                </View>

                            )}
                            {item.requestType === 'accepted' && state.user._id === item.client && (
                                <Button
                                    title="Add Review"
                                    onPress={() => handleReview(item)} //item.client, item.recipient, item.post
                                    color="blue"
                                />
                            )}
                            {item.requestType === 'rejected' && (
                                <View style={styles.buttonContainer}>
                                    <Text> Status: Rejected</Text>
                                </View>
                            )}

                        </View>
                    )
                }}
                keyExtractor={(item) => item._id} // Assuming each request has a unique ID
            />
        </View>
    );
}

const styles = StyleSheet.create({

    requestContainer: {
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    postTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    addOnTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    payout: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'green',
        marginTop: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: 'green',
        marginRight: 5,
    },
    rejectButton: {
        backgroundColor: 'red',
        marginLeft: 5,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    reviewContainer: {
        marginTop: 10,
    },
    reviewInput: {
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },

});

export default Notifications