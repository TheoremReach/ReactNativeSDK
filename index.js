import { NativeEventEmitter, NativeModules } from 'react-native';

const { RNTheoremReach } = NativeModules;
const TheoremReachEventEmitter = new NativeEventEmitter(RNTheoremReach);

export default RNTheoremReach;
export { TheoremReachEventEmitter };
