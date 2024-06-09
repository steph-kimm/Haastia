import { StyleSheet, Text, SafeAreaView, ScrollView, View, Image, TouchableOpacity } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import FooterList from '../components/footer/FooterList.js'
import { AuthContext } from '../context/auth.js'
import { PostContext } from '../context/post.js'
import axios from "axios"
import Post from '../components/Post.js'

const Links = () => {
    const [posts, setPosts] = useContext(PostContext);
    const [state, setState] = useContext(AuthContext);
    const [saved, setSaved] = useState([]);

    const handleSave = async (item) => {
        console.log('item=>', item);
        // let new_saved = saved;
        // new_saved.push(item);
        // TODO: test below
        if (saved.includes(item)) {
            // If item is already in the array, remove it
            setSaved(saved.filter(savedItem => savedItem !== item));
        } else {
            // If item is not in the array, add it
            setSaved(saved.concat(item));
        }

        try {
            const user = state.user;
            const res = await axios.post('http://localhost:8000/api/update-saved-posts', { posts: new_saved, user })
            const data = res.data;
            if (data.error) alert(data.error);
            else {
                alert("Post saved successfully")
                setSaved(new_saved);
            }
        } catch (error) {
            alert("Post update failed")
            console.log(error);
        }
    }

    useEffect(() => {
        const { saved_posts } = state.user;
        setSaved(saved_posts);

        const fetchPosts = async () => {
            const res = await axios.get("http://localhost:8000/api/get-posts");
            setPosts(res.data);
            console.log(res.data);
            // console.log('posts', posts);
        };
        fetchPosts();
        // console.log('post first image', posts[0].images);
    }, [])

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.mainText}>Saved Posts</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
                {posts && posts.filter((item)=>{
                    const item_id =  item._id; 
                    if(saved.indexOf(item_id) > -1) return true; 
                    return false;
                }).map(item => (
                    // {console.log(item)}
                    <Post item={item} handleSave={handleSave}/>
                    // <View key={item._id} style={{alignItems:'center'}}>
                    // <View  style={styles.box}>
                    //     {console.log('item.images[0]?.url', item.images[0]?.url)}
                    //     {item.images[0]?.url ? <Image style={styles.image} source={{ uri: item.images[0].url }} /> : null}
                    //     <Text style={styles.title}>{item.title}</Text>
                    //     <Text>{item.description}</Text>
                    //     <Text>${item.price}</Text>
                    //     {item.owner.name ? <Text> Done By: {item.owner.name}</Text> : null}
                    // </View>
                    // </View>
                ))}
            </ScrollView>
            <FooterList />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "space-between" },
    mainText: { fontSize: 30, textAlign: 'center' },
})

export default Links