import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
  Linking
} from 'react-native';
import Voice from '@react-native-voice/voice'
import Tts from 'react-native-tts';
import Contacts from 'react-native-contacts';

import { LogBox } from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

const requestPhoneCallPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        {
          title: 'Phone Call Permission',
          message: 'This app needs permission to make phone calls.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Failed to request phone call permission:', error);
      return false;
    }
  }
  return true; // For iOS
};

async function requestPermissions() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      ]);

      const permissionsGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!permissionsGranted) {
        console.warn('Not all permissions granted');
      }
      return permissionsGranted;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
}

const App = () => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  useEffect(() => {

    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = stopListing;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = (err) => console.log('onSpeechError: ', err);

    requestPermissions();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners())
    }

  }, [])

  const onSpeechStart = (event) => {
    console.log('recording started...: ', event);
  }


  const onSpeechResults = (event) => {
    console.log(event.value[0]);
    const text = event.value[0];
    setRecognizedText(text)
    handleVoiceCommand(text)
  }

  const startListing = async () => {
    setIsListening(true)
    try {
      await Voice.start('en-US');
    } catch (err) {
      console.log('~ file: App.jsx:44 ~ startListing ~ error: ', err);
    }
  }
  const stopListing = async () => {
    try {
      Voice.removeAllListeners()
      await Voice.stop()
      setIsListening(false)
    } catch (err) {
      console.log('~ file: App.jsx:52 ~ stopListing ~ error: ', err);
    }
  }


  const handleVoiceCommand = async (command) => {
    if (command.toLowerCase().includes('call')) {
      const contactName = command.replace(/call/i, '').trim();
      const contacts = await Contacts.getContactsMatchingString(contactName);
      if (contacts.length > 0) {
        const phoneNumber = contacts[0].phoneNumbers[0]?.number;
        if (phoneNumber) {
          Tts.speak(`Calling ${contactName}`);
          console.log(phoneNumber);
          startCall(phoneNumber);
        } else {
          Tts.speak(`${contactName} does not have a phone number.`);
        }
      } else {
        Tts.speak(`Contact ${contactName} not found.`);
      }
    }
  };

  const startCall = (phoneNumber) => {
    let url = `tel:${phoneNumber}`;
    Linking.openURL(url)
  };


  const sendMessage = () => {
    if (recognizedText) {
      setMessages([...messages, { text: recognizedText, sender: 'user' }]);
      setRecognizedText('');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <ScrollView contentContainerStyle={styles.messagesContainer}>
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              {
                alignSelf:
                  message.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor:
                  message.sender === 'user' ? '#BB2525' : '#141E46',
              },
            ]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        {/* <SetAlarm /> */}
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={recognizedText}
          onChangeText={text => setRecognizedText(text)}
        />
        <TouchableOpacity
          onPress={() => {
            isListening ? stopListing() : startListing()
          }}
          style={styles.voiceButton}>
          {isListening ? (
            <Text style={styles.voiceButtonText}>•••</Text>
          ) : (
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/4980/4980251.png',
              }}
              style={{ width: 45, height: 45 }}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E0',
  },
  messagesContainer: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '70%',
    marginVertical: 5,
    borderRadius: 10,
    padding: 10,
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#EFEFEF',
  },
  voiceButton: {
    marginLeft: 10,
    fontSize: 24,
  },
  voiceButtonText: {
    fontSize: 24,
    height: 45,
  },
  sendButton: {
    marginLeft: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FF6969',
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default App;