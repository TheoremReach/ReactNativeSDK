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
// Placements are made per app in TheoremReach's dashboard. The test apps have none, so this one opens the usual
// reward center, though the entry still carries it.
const PLACEMENT_ID = '0776c7a4-5ff7-48fd-bab2-79e7b6a626bc';
// The install id your MMP's SDK gives you. The test apps measure no installs, so any id will do here.
const MMP_INSTALL_ID = 'react-native-example-install';

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const [listeningForRewards, setListeningForRewards] = useState(true);
  const append = useCallback((line: string) => {
    setLog((lines) => [
      `${new Date().toLocaleTimeString()}  ${line}`,
      ...lines,
    ]);
  }, []);

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

    TheoremReach.initWithApiKeyAndUserId(API_KEY, USER_ID);
    // The settings go after initWithApiKeyAndUserId, which resets some of them.
    TheoremReach.setNavigationBarText('TheoremReach Example');
    TheoremReach.setNavigationBarColor('#1B0C47');
    TheoremReach.setNavigationBarTextColor('#FFFFFF');
    TheoremReach.setLoadingBarColor('#9A5CF8');
    TheoremReach.setMmpInstallId('apptrove', MMP_INSTALL_ID);

    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [append]);

  const checkAvailability = async () => {
    append(`isSurveyAvailable ${await TheoremReach.isSurveyAvailable()}`);
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
    <View style={styles.container}>
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
          listeningForRewards
            ? 'Stop listening for rewards'
            : 'Listen for rewards again'
        }
        onPress={toggleRewardListener}
      />
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
