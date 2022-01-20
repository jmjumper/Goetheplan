import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView, SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
import { styles } from '../style/styles';
import Tile from '../components/tile';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from "@react-native-community/netinfo";
import NetInfo from "@react-native-community/netinfo";
import NewsTile from '../components/NewsTile';
import { useInternetStatus } from '../components/internetStatus';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { _url } from '../components/api';

const { width, height } = Dimensions.get("window");

export default function Home_tomorrow({ navigation }) {

    const url = _url;

    const [_value, setValue] = useState({});
    const isConnected = useInternetStatus();

    const [apiData, setApiData] = useState({});
    const [update, setUpdate] = useState(0);
    const [classes, setClasses] = useState('---');
    const [day, setDay] = useState("-");
    const [date, setDate] = useState("xx.xx.xxxx");
    const [news, setNews] = useState("Keine Nachrichten.");
    const [uname, setUname] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        startUp();
        const willFocusSubscription = navigation.addListener('focus', () => {
            startUp();

        });
        return willFocusSubscription;

    }, [update, password, uname, isConnected]);

    function startUp() {
        getSavedLogin();
        if (uname === "" && password === "") return;
        fetchEverything();
        getData();
        getSavedClass();
        initialiseTiles();
    }

    function fetchEverything() {
        fetch(`${url}/timetables?username=${uname}&password=${password}`)
            .then(data => data.json()
                .then(json => { 
                    setApiData(json.tomorrow.information);
                    setDay(json.tomorrow.day);
                    setDate(json.tomorrow.date);
                    setNews(json.tomorrow.news);
                    const jsonData = JSON.stringify(json.tomorrow.information);
                    try {
                        AsyncStorage.setItem('@storage_Key_tomorrow', jsonData);
                    } catch (err) { console.warn("in asycn set: ", err) }
                })).catch(err => { console.log("Catched in fetchEverything:", err); }) 
    }

    const getData = async () => {
        try {
            const value = await AsyncStorage.getItem('@storage_Key_tomorrow');
            if ((value !== null && typeof value !== 'undefined')) {
                setValue(() => JSON.parse(value));
            } else { return {} }
        } catch (e) {
            console.warn("e:", e);
        }
    }

    async function getSavedLogin() {
        try {
            const value_uname = await AsyncStorage.getItem('username');
            const value_password = await AsyncStorage.getItem('password');
            if (value_uname !== null) {
                setApiData({});
                setUname(() => value_uname);
            } else { navigation.navigate("Landing"); return {} }

            if (value_password !== null) {
                setPassword(() => value_password);
            } else { navigation.navigate("Landing"); return {} }

            fetch(`${url}/timetables?username=${value_uname}&password=${value_password}`)
                .then(data => data.json()
                    .then(json => { 
                        if (json.tomorrow.information === null && isConnected) {
                            navigation.navigate("Landing");
                        }
                    })).catch(err => { console.log("Catched:", err); if (isConnected) { navigation.navigate("Landing") } }) 
        } catch (e) {
            console.warn("e:", e);
        }
    }

    const getSavedClass = async () => {
        try {
            const value = await AsyncStorage.getItem('class');
            if (value !== null) {
                setClasses(() => value);
            } else { return {} }
        } catch (e) {
            console.warn("e:", e);
        }
    }

    const initialiseTiles = () => {
        try {
            if (isConnected || isConnected === null) {
                createTiles(apiData);
            } else {
                createTiles(_value);
            }
        } catch (err) {
            alert("Der Vertretungsplan konnte nicht geladen werden. Überprüfen Sie Ihre Netzwerkverbindung.");
        };
    };

    let tiles_array_tomorrow;

    const createTiles = (_data) => {
        tiles_array_tomorrow = [];
        for (let i = 0; i < _data.length; i++) {
            if (_data[i]["classes"] === classes || classes === '---')
                tiles_array_tomorrow.push(
                <TouchableOpacity key={i + 1} onPress={() => {
                    navigation.navigate("Information", { informations: _data[i], number: i });
                    // if (_data[i]["comments"] !== "") { alert("Bemerkung:", _data[i]["comments"]) }
                }} >
                    <Tile
                        key={i + 1}
                        text={_data[i]["absent"]}
                        lessons={_data[i]["lessons"]}
                        kind={_data[i]["type"]}
                        room={_data[i]["newRoom"]}
                        comment={_data[i]["comments"]}
                        class={_data[i]["classes"]}
                        subject={_data[i]["subject"]}
                    />
                </TouchableOpacity>);
        };
    }

    initialiseTiles();

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />

            <SafeAreaView style={{ paddingTop: Platform.OS === "android" ? 30 : 0 }}>

                <View style={styles.icons}>
                    <Icon name='sync' onPress={() => setUpdate(update + 1)} color='gray' />
                    <Icon name='settings' onPress={() => navigation.navigate("Settings")} />
                </View>
                <View style={styles.wrapper}>

                    <View style={{ alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row', alignItems: 'center', }}>
                        <Text style={styles.header}>Vertretungsplan</Text>
                    </View>
                    <View style={styles.scrollWrapper}>
                        <Text style={styles.textDay}>{"Morgen - "}{day}{","} {date}{":"}</Text>
                        <NewsTile text={news} style={styles.news} />
                        <ScrollView>
                            {tiles_array_tomorrow.length === 0 ? <ActivityIndicator /> : tiles_array_tomorrow}
                        </ScrollView>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
