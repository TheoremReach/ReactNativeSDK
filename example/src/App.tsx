import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type StatusBarStyle,
} from 'react-native';
import TheoremReach, {
  TheoremReachEventEmitter,
} from '@theoremreachnpm/react-native-theoremreach';

// TheoremReach's test apps (iOS 12451, Android 12453), as the native SDKs' examples use.
const API_KEY =
  Platform.OS === 'ios'
    ? '30a936dc7328c6e2bef47c0b1e13'
    : 'f4bfc509292953a3cf4274038763';
const USER_ID = 'REACT_NATIVE_EXAMPLE_USER';
// A second user, to start for while the reward center is open, as an app that switches users at a login can.
const OTHER_USER_ID = 'REACT_NATIVE_EXAMPLE_USER_2';
// Placements are made per app in TheoremReach's dashboard. The test apps have none, so this one opens the usual
// reward center, though the entry still carries it.
const PLACEMENT_ID = '0776c7a4-5ff7-48fd-bab2-79e7b6a626bc';
// The install id your MMP's SDK gives you. The test apps measure no installs, so any id will do here.
const MMP_INSTALL_ID = 'react-native-example-install';
// The title bar's colors: the example's own, unlike the SDK's defaults (#1B0C47 and #FFFFFF) so a setter that didn't
// take shows, and a light one with a dark title, which the status bar over the reward center follows with dark icons.
const TITLE_BAR = { color: '#0B3D91', textColor: '#FFD60A' };
const LIGHT_TITLE_BAR = { color: '#F2F2F7', textColor: '#1C1C1E' };

// iOS's default status bar follows the system's scheme. On Android the status bar is transparent over the app (edge
// to edge), and its icons follow the scheme only when the app sets them.
function statusBarStyle(dark: boolean): StatusBarStyle {
  if (Platform.OS === 'ios') {
    return 'default';
  }
  return dark ? 'light-content' : 'dark-content';
}

export default function App() {
  // React Native's default text is black in either mode, so the colors follow the system's.
  const dark = useColorScheme() === 'dark';
  const [log, setLog] = useState<string[]>([]);
  const [listeningForRewards, setListeningForRewards] = useState(true);
  const [lightTitleBar, setLightTitleBar] = useState(false);
  const [userId, setUserId] = useState(USER_ID);
  const append = useCallback((line: string) => {
    setLog((lines) => [
      `${new Date().toLocaleTimeString()}  ${line}`,
      ...lines,
    ]);
  }, []);

  // The settings go after the start, which resets some of them.
  const start = useCallback(
    (user: string, titleBar: typeof TITLE_BAR) => {
      TheoremReach.initWithApiKeyAndUserId(API_KEY, user);
      TheoremReach.setNavigationBarText('TheoremReach Example');
      TheoremReach.setNavigationBarColor(titleBar.color);
      TheoremReach.setNavigationBarTextColor(titleBar.textColor);
      TheoremReach.setLoadingBarColor('#9A5CF8');
      TheoremReach.setMmpInstallId('apptrove', MMP_INSTALL_ID);
    },
    []
  );

  // With no onReward listener, a reward waits in the package for the next one.
  useEffect(() => {
    if (listeningForRewards) {
      const onReward = TheoremReachEventEmitter.addListener(
        'onReward',
        (quantity) => append(`onReward ${quantity}`)
      );
      return () => onReward.remove();
    }
    return undefined;
  }, [listeningForRewards, append]);

  useEffect(() => {
    const subscriptions = [
      TheoremReachEventEmitter.addListener('onRewardCenterOpened', () =>
        append('onRewardCenterOpened')
      ),
      TheoremReachEventEmitter.addListener('onRewardCenterClosed', () =>
        append('onRewardCenterClosed')
      ),
      TheoremReachEventEmitter.addListener(
        'theoremreachSurveyAvailable',
        (available) => append(`theoremreachSurveyAvailable ${available}`)
      ),
    ];

    start(USER_ID, TITLE_BAR);

    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [append, start]);

  const checkAvailability = async () => {
    append(`isSurveyAvailable ${await TheoremReach.isSurveyAvailable()}`);
  };

  // The colors apply from the next open.
  const toggleTitleBar = () => {
    const next = lightTitleBar ? TITLE_BAR : LIGHT_TITLE_BAR;
    TheoremReach.setNavigationBarColor(next.color);
    TheoremReach.setNavigationBarTextColor(next.textColor);
    append(
      lightTitleBar
        ? "The example's title bar"
        : 'A light title bar, with a dark title'
    );
    setLightTitleBar(!lightTitleBar);
  };

  // Open the reward center within the five seconds, and the start comes while it's open: JS should hear its close
  // then, or when it closes.
  const switchUserSoon = () => {
    const next = userId === USER_ID ? OTHER_USER_ID : USER_ID;
    const titleBar = lightTitleBar ? LIGHT_TITLE_BAR : TITLE_BAR;
    append(`Starting for ${next} in 5 seconds`);
    setTimeout(() => {
      start(next, titleBar);
      append(`Started for ${next}`);
    }, 5000);
    setUserId(next);
  };

  const toggleRewardListener = () => {
    append(
      listeningForRewards
        ? 'No onReward listener: rewards wait'
        : 'onReward listener back'
    );
    setListeningForRewards(!listeningForRewards);
  };

  return (
    <View style={[styles.container, dark ? styles.dark : styles.light]}>
      <StatusBar barStyle={statusBarStyle(dark)} />
      <Button
        title="Open the reward center"
        onPress={() => TheoremReach.showRewardCenter()}
      />
      <Button
        title="Open it at a placement"
        onPress={() => TheoremReach.showRewardCenter(PLACEMENT_ID)}
      />
      <Button title="Is a survey available?" onPress={checkAvailability} />
      <Button
        title={
          lightTitleBar
            ? "Use the example's title bar"
            : 'Use a light title bar'
        }
        onPress={toggleTitleBar}
      />
      <Button
        title={
          listeningForRewards
            ? 'Stop listening for rewards'
            : 'Listen for rewards again'
        }
        onPress={toggleRewardListener}
      />
      <Button
        title={`Start for ${userId === USER_ID ? OTHER_USER_ID : USER_ID} in 5 s`}
        onPress={switchUserSoon}
      />
      <ScrollView style={styles.log}>
        {log.map((line, index) => (
          <Text key={index} style={dark ? styles.darkText : styles.lightText}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 16,
    gap: 12,
  },
  log: {
    flex: 1,
  },
  light: {
    backgroundColor: '#FFFFFF',
  },
  dark: {
    backgroundColor: '#000000',
  },
  lightText: {
    color: '#000000',
  },
  darkText: {
    color: '#FFFFFF',
  },
});
