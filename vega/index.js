import { AppRegistry, LogBox } from 'react-native';
import config from './app.json'
import RootLayout from '../src/app/_layout'

// Temporary workaround for problem with nested text
// not working currently.
LogBox.ignoreAllLogs();

AppRegistry.registerComponent(config.name, () => RootLayout);