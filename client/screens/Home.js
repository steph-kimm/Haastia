import {StyleSheet, Text, SafeAreaView} from 'react-native'
import React from 'react'
import FooterList from '../components/footer/FooterList'

const Home = () => {
    return (
        <SafeAreaView>
            <Text style={StyleSheet.mainText}>Home Component</Text>
            <FooterList />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {flex:1, justifyContent: 'space-between'},
    mainText: {fontSize:30, textAlign: 'center'}
})

export default Home