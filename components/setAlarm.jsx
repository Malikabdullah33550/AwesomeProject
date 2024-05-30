import React, { useState, useEffect } from 'react';
import { View, Text, Button, Linking, Platform, Alert, PermissionsAndroid } from 'react-native';
import Voice from '@react-native-voice/voice';

const SetAlarm = () => {
    const [recognizedText, setRecognizedText] = useState('');
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        Voice.onSpeechStart = onSpeechStartHandler;
        Voice.onSpeechEnd = onSpeechEndHandler;
        Voice.onSpeechError = onSpeechErrorHandler;
        Voice.onSpeechResults = onSpeechResultsHandler;

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const onSpeechStartHandler = () => {
        setIsRecognizing(true);
        console.log("Speech recognition started");
    };

    const onSpeechEndHandler = () => {
        setIsRecognizing(false);
        console.log("Speech recognition ended");
    };

    const onSpeechErrorHandler = (e) => {
        setIsRecognizing(false);
        setError(e.error.message);
        console.error('Speech recognition error:', e.error.message);
    };

    const onSpeechResultsHandler = (e) => {
        const text = e.value[0];
        setRecognizedText(text);
        processCommand(text);
    };

    const processCommand = (command) => {
        console.log('Processing command:', command);
        if (command.includes('set alarm')) {
            const timeMatch = command.match(/(\d{1,2}:\d{2})/);
            if (timeMatch) {
                const time = timeMatch[0];
                setAlarm(time);
            } else {
                Alert.alert('Could not find a valid time in your command.');
            }
        } else if (command.includes('open alarm')) {
            openAlarmApp();
        }
    };

    const setAlarm = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        if (Platform.OS === 'android') {
            try {
                Linking.openURL(`intent: #Intent; action = android.intent.action.SET_ALARM; S.hours = ${hours}; S.minutes = ${minutes};end`);
                console.log(`Setting alarm for ${hours}:${minutes}`);
            } catch (e) {
                console.error('Failed to set alarm:', e);
                Alert.alert('Error', 'Failed to set alarm.');
            }
        }
    };

    const openAlarmApp = () => {
        if (Platform.OS === 'android') {
            try {
                Linking.openURL('clock://alarm');
                console.log('Opening alarm app');
            } catch (e) {
                console.error('Failed to open alarm app:', e);
                Alert.alert('Error', 'Failed to open alarm app.');
            }
        }
    };

    const startRecognition = async () => {
        try {
            console.log('Requesting microphone permission');
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Voice Alarm App Permission',
                    message: 'Voice Alarm App needs access to your microphone to recognize your voice.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Microphone permission granted');
                setError(null); // Clear any previous errors
                try {
                    await Voice.start('en-US');
                    console.log('Voice recognition started');
                } catch (startError) {
                    setError(startError.message);
                    console.error('Error starting voice recognition:', startError);
                    Alert.alert('Error', 'Error starting voice recognition.');
                }
            } else {
                console.log('Microphone permission denied');
                setError('Microphone permission denied');
                Alert.alert('Permission Denied', 'Microphone permission is required to use voice recognition.');
            }
        } catch (e) {
            setError(e.message);
            console.error('Error requesting microphone permission:', e);
            Alert.alert('Error', 'Error requesting microphone permission.');
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Recognized: {recognizedText}</Text>
            <Button title="Start Voice Recognition" onPress={startRecognition} />
            {isRecognizing && <Text>Listening...</Text>}
            {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
        </View>
    );
};

export default SetAlarm;