import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React from 'react'
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome5"


const ReviewStars = ({ rating, setRating }) => {
    const handlePress = (star) => {
        setRating(star);
      };
    
    return (
        <View style={styles.container}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handlePress(star)}>
                    <FontAwesome5
                        name="star"
                        size={30}
                        color={star <= rating ? 'darkmagenta' : 'gray'}
                        solid={star <= rating}
                        style={styles.iconStyle}
                    />
                </TouchableOpacity>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 20,
    },
    iconStyle: {
        marginHorizontal: 5,
    },
})

export default ReviewStars