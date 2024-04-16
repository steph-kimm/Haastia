import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';

const PostDetailsScreen = () => {
    const route = useRoute();
    const { post } = route.params;
    const { title, owner, price, description, category, images } = post;
    console.log(post);
    // Fetch post details based on postId from API or local data

    return (
        <View style={styles.container}>
            <Image source={{ uri: images[0].url }} style={styles.photo} />
            <View style={styles.detailsContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
                <Text style={styles.owner}>Owner: {owner.name}</Text>
                <Text style={[styles.price, { color: 'green' }]}>Price: ${price}</Text>
            </View>
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
});

export default PostDetailsScreen;