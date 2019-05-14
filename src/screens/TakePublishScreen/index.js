import React from 'react';
import {
  View,
  ScrollView,
  Image,
  Keyboard,
  Alert,
  TextInput,
  Text,
  Platform,
} from 'react-native';
import {
  Video,
  MapView,
  Permissions,
  Constants,
  Location,
} from 'expo';

/* from app */
import IconButton from 'app/src/components/IconButton';
import firebase from 'app/src/firebase';
import GA from 'app/src/analytics';
import I18n from 'app/src/i18n';
import styles from './styles';

export default class TakePublishScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    headerLeft: <IconButton name="ios-arrow-back" onPress={() => navigation.goBack()} />,
    headerTitle: I18n.t('TakePublish.title'),
    headerRight: navigation.getParam('headerRight', null),
  })

  constructor(props) {
    super(props);

    const { navigation } = this.props;

    this.state = {
      mode: navigation.getParam('mode', 'photo'),
      photo: navigation.getParam('photo', {}),
      movie: navigation.getParam('movie', {}),
      text: '',
      latitude: null,
      longitude: null,
      message: '位置情報取得中',
    };

    GA.ScreenHit('TakePublish');
  }

  componentDidMount() {
    const { photo = {}, movie = {} } = this.state;
    const { navigation } = this.props;

    if (!photo.uri && !movie.uri) {
      navigation.goBack();
    }

    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        message: 'Androidシミュレータでは動きません。実機で試してください。',
      });
    } else {
      this.getLocationAsync();
    }

    navigation.setParams({
      headerRight: <IconButton name="ios-send" onPress={this.onPublish} />,
    });
  }

  getLocationAsync = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        message: '位置情報のパーミッションの取得に失敗しました。',
      });
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    this.setState({ latitude: location.coords.latitude, longitude: location.coords.longitude });
  }

  onChangeText = (text) => {
    this.setState({ text });
  }

  onPublish = async () => {
    const {
      mode,
      photo,
      movie,
      text,
      latitude,
      longitude,
    } = this.state;
    const { navigation } = this.props;

    Keyboard.dismiss();

    navigation.setParams({
      headerRight: <IconButton name="ios-refresh" />,
    });

    const result = await firebase.createPost(text, mode === 'photo' ? photo : movie, mode, latitude, longitude);

    navigation.setParams({
      headerRight: <IconButton name="ios-send" onPress={this.onPublish} />,
    });

    if (result.error) {
      Alert.alert(I18n.t('TakePublish.alert'), result.error);
    } else {
      navigation.dispatch({ type: 'TAKEMODAL_CLOSE' });
    }
  }


  render() {
    const {
      mode,
      photo,
      movie,
      text,
      latitude,
      longitude,
      message,
    } = this.state;

    if (latitude && longitude) {
      return (
        <ScrollView scrollEnabled={false} style={styles.container} contentContainerstyle={styles.container}>
          <View style={styles.row}>
            {mode === 'photo' && <Image source={{ uri: photo.uri }} style={styles.photo} />}
            {mode === 'movie' && (
              <Video
                source={{ uri: movie.uri }}
                style={styles.photo}
                resizeMode="cover"
                shouldPlay
                isLooping
              />
            )}
            <TextInput
              multiline
              style={styles.textInput}
              placeholder={I18n.t('TakePublish.placeholder')}
              underlineColorAndroid="transparent"
              textAlignVertical="top"
              value={text}
              onChangeText={this.onChangeText}
            />
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.00922,
                longitudeDelta: 0.00521,
              }}
              showsUserLocation
            />
          </View>
        </ScrollView>
      );
    }
    return (
      <ScrollView scrollEnabled={false} style={styles.container} contentContainerstyle={styles.container}>
        <View style={styles.row}>
          {mode === 'photo' && <Image source={{ uri: photo.uri }} style={styles.photo} />}
          {mode === 'movie' && (
            <Video
              source={{ uri: movie.uri }}
              style={styles.photo}
              resizeMode="cover"
              shouldPlay
              isLooping
            />
          )}
          <TextInput
            multiline
            style={styles.textInput}
            placeholder={I18n.t('TakePublish.placeholder')}
            underlineColorAndroid="transparent"
            textAlignVertical="top"
            value={text}
            onChangeText={this.onChangeText}
          />
        </View>
        <View style={styles.row}>
          <Text>{message}</Text>
        </View>
      </ScrollView>
    );
  }
}
