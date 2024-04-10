import { StyleSheet, Text, SafeAreaView, ScrollView, View, Image } from 'react-native'
import React, { useContext, useEffect } from 'react'
import { PostContext } from '../context/post'
import FooterList from '../components/footer/FooterList'
import axios from "axios"

const Home = () => {
    const [posts, setPosts] = useContext(PostContext);

    useEffect(() => {
        const fetchPosts = async () => {
            const res = await axios.get("http://localhost:8000/api/get-posts");
            setPosts(res.data);
            console.log('posts', posts);
        };
        fetchPosts();
        // console.log('post first image', posts[0].images);
    }, [])



    return (
        <SafeAreaView style={styles.container}>
            {/* <Text style={StyleSheet.mainText}>Services</Text> */}
            <ScrollView showsVerticalScrollIndicator={false}>
                {posts && posts.map(item => (
                    // {console.log(item)}
                    <View key={item._id} style={{alignItems:'center'}}>
                    <View  style={styles.box}>
                        {console.log('item.images[0]?.url', item.images[0]?.url)}
                        {item.images[0]?.url ? <Image style={styles.image} source={{ uri: item.images[0].url }} /> : null}
                        <Text>{item.title}</Text>
                        <Text>{item.description}</Text>
                        <Text>${item.price}</Text>
                    </View>
                    </View>
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