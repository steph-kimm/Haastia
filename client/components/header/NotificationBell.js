import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome from expo/vector-icons

const NotificationBell = ({ notificationCount }) => {
  return (
    <View style={styles.container}>
      <FontAwesome name="bell" size={24} color="black" />
      {notificationCount > 0 && ( // Render badge only if notificationCount is greater than 0
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{notificationCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative', // Position relative to the parent
    width: 30, // Adjust width and height as needed
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute', // Position absolute to overlay the badge on the bell icon
    top: -5, // Adjust top and right values to position the badge
    right: -5,
    backgroundColor: 'red', // Badge background color
    borderRadius: 10, // Make it a circle
    minWidth: 20, // Set minimum width for the badge
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white', // Badge text color
    fontWeight: 'bold',
    fontSize: 12, // Adjust font size as needed
  },
});

export default NotificationBell;