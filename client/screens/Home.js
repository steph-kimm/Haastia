import { StyleSheet, Text, SafeAreaView, ScrollView, View, Image, TouchableOpacity } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { PostContext } from '../context/post'
import FooterList from '../components/footer/FooterList'
import axios from "axios"
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import { AuthContext } from '../context/auth'
import Post from '../components/Post'
import { useNavigation } from '@react-navigation/native';

const Home = () => {
    const navigation = useNavigation();

    const [posts, setPosts] = useContext(PostContext);
    const [state, setState] = useContext(AuthContext);
    const [saved, setSaved] = useState([]);

    useEffect(() => {
        const { saved_posts } = state.user;
        setSaved(saved_posts);

        const fetchPosts = async () => {
            const res = await axios.get("http://localhost:8000/api/get-posts");
            setPosts(res.data);
            // console.log('posts', posts);
        };
        fetchPosts();
        // console.log('post first image', posts[0].images);
    }, [])

    const handlePostPress = (post) => {
        // Navigate to post details screen and pass post ID as param OR full post
        console.log('post pressed'); //TODO: update this so that it navigates to post deatils
        navigation.navigate('PostDetails', { post });
    };

    const handleSave = async (item) => {
        console.log('item=>', item);
        let new_saved = saved;
        new_saved.push(item);

        try {
            const user= state.user;
            const res = await axios.post('http://localhost:8000/api/update-saved-posts', {posts:new_saved, user})
            const data = res.data;
            if(data.error) alert(data.error);
            else{
                alert("Post saved successfully")
                setSaved(new_saved);
            }
        } catch (error) {
            alert("Post update failed")
            console.log(error);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* <Text style={StyleSheet.mainText}>Services</Text> */}
            <ScrollView showsVerticalScrollIndicator={false}>
                {posts && posts.map(item => (
                    <TouchableOpacity key={item.id} onPress={() => handlePostPress(item)}>
                    <Post item={item} handleSave={handleSave}/>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <FooterList />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1},
    mainText: { fontSize: 30, textAlign: 'center' },
    image: { height: '70%', width: '100%', borderTopRightRadius: 14, borderTopLeftRadius: 14 },
    box: {
        backgroundColor: "#fff", width: "92%", height: 280, borderRadius: 14, shadowColor: "#171717",
    shadowOffset: { width: -2, height: 4 }, shadowOpacity: 0.2, shadowRadius: 3, marginBottom: 20,
    }
})

export default Home