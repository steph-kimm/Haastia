import {StyleSheet, Text, SafeAreaView, ScrollView, View} from 'react-native'
import React, { useContext, useEffect }from 'react'
import { PostContext } from '../context/post'
import FooterList from '../components/footer/FooterList'
import axios from "axios"

const Home = () => {
    const [posts, setPosts] = useContext(PostContext);

    useEffect(() => {
        const fetchPosts = async () => {
            console.log('FETCHING');
            // const res = await axios.get("http://localhost:8000/api/get-posts");
            // const data = res.data;
            const res = await axios.get("http://localhost:8000/api/get-posts");
            // .then(()=>{
            //     console.log('data', data);
            //     setPosts(data);
            // })
            console.log(res);
            console.log('data', res?.data);
            setPosts(res?.data);
            
        };
        fetchPosts();
        console.log('posts', posts);
    }, [])

    

    return (
        <SafeAreaView style={styles.container}>
            <Text style={StyleSheet.mainText}>Services</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
                {posts && posts.map(item => (
                    <View key={item._id} style={{alignItems: "center"}}>
                        <Text>{item.title}</Text>
                        <Text>{item.description}</Text>
                        <Text>${item.price}</Text>
                    </View>
                ))}
            </ScrollView>
            <FooterList />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {flex:1, justifyContent: 'space-between'},
    mainText: {fontSize:30, textAlign: 'center'}
})

export default Home