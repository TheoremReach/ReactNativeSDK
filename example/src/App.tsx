import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
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

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const append = useCallback((line: string) => {
    setLog((lines) => [
      `${new Date().toLocaleTimeString()}  ${line}`,
      ...lines,
    ]);
  }, []);

  useEffect(() => {
    const subscriptions = [
      TheoremReachEventEmitter.addListener('onReward', (quantity) =>
        append(`onReward ${quantity}`)
      ),
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

    TheoremReach.initWithApiKeyAndUserId(API_KEY, USER_ID);
    // The settings go after initWithApiKeyAndUserId, which resets them on iOS.
    TheoremReach.setNavigationBarText('TheoremReach Example');

    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [append]);

  const checkAvailability = async () => {
    append(`isSurveyAvailable ${await TheoremReach.isSurveyAvailable()}`);
  };

  return (
    <View style={styles.container}>
      <Button
        title="Open the reward center"
        onPress={() => TheoremReach.showRewardCenter()}
      />
      <Button title="Is a survey available?" onPress={checkAvailability} />
      <ScrollView style={styles.log}>
        {log.map((line, index) => (
          <Text key={index}>{line}</Text>
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
});
