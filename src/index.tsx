import { NativeEventEmitter } from 'react-native';
import NativeRNTheoremReach from './NativeRNTheoremReach';

/** Each event's arguments. `quantity` is the currency the user earned, in the app's own units. */
type EventArgs = {
  onReward: [quantity: number];
  onRewardCenterOpened: [];
  onRewardCenterClosed: [];
  theoremreachSurveyAvailable: [surveyAvailable: boolean];
};

export type TheoremReachEvent = keyof EventArgs;

type EventListeners = {
  [E in TheoremReachEvent]: (...args: EventArgs[E]) => void;
};

export type TheoremReachSubscription = { remove(): void };

const nativeEmitter = new NativeEventEmitter<EventArgs>(NativeRNTheoremReach);

// The SDK confirms a reward with TheoremReach once it has handed it to this module, so one that arrives while the app
// has no onReward listener (before the screen that listens has mounted, say) waits here for the first listener.
// Listening from import also means the native side never drops a reward for want of a listener.
const pendingRewards: number[] = [];
const rewardListeners = new Set<EventListeners['onReward']>();
nativeEmitter.addListener('onReward', (quantity: number) => {
  if (rewardListeners.size === 0) {
    pendingRewards.push(quantity);
    return;
  }
  rewardListeners.forEach((listener) => listener(quantity));
});

export const TheoremReachEventEmitter = {
  addListener<E extends TheoremReachEvent>(
    event: E,
    listener: EventListeners[E]
  ): TheoremReachSubscription {
    if (event === 'onReward') {
      const onReward = listener as EventListeners['onReward'];
      rewardListeners.add(onReward);
      pendingRewards.splice(0).forEach((quantity) => onReward(quantity));
      return {
        remove: () => {
          rewardListeners.delete(onReward);
        },
      };
    }
    return nativeEmitter.addListener(event, listener);
  },
};

const TheoremReach = {
  /** Starts the SDK for this user. Call once, before the other calls. */
  initWithApiKeyAndUserId(apiKey: string, userId: string): void {
    NativeRNTheoremReach.startWithApiKey(apiKey, userId);
  },

  /** Opens the reward center, at a placement when one is given. */
  showRewardCenter(placementId?: string): void {
    NativeRNTheoremReach.showRewardCenter(placementId ?? null);
  },

  isSurveyAvailable(): Promise<boolean> {
    return NativeRNTheoremReach.isSurveyAvailable();
  },

  /** The loading bar's color, as a hex string such as `#FC178D`. Set it after initWithApiKeyAndUserId. */
  setLoadingBarColor(color: string): void {
    NativeRNTheoremReach.setLoadingBarColor(color);
  },

  /**
   * For an app that measures installs with a mobile measurement partner (MMP): the partner, such as `apptrove`, and
   * its install id, which each survey entry then carries. Set it after initWithApiKeyAndUserId, before the reward
   * center opens.
   */
  setMmpInstallId(provider: string, installId: string): void {
    NativeRNTheoremReach.setMmpInstallId(provider, installId);
  },

  /** The reward center's title. Set it after initWithApiKeyAndUserId. */
  setNavigationBarText(text: string): void {
    NativeRNTheoremReach.setNavigationBarText(text);
  },

  /** The reward center's title bar color, as a hex string. Set it after initWithApiKeyAndUserId. */
  setNavigationBarColor(color: string): void {
    NativeRNTheoremReach.setNavigationBarColor(color);
  },

  /** The reward center's title color, as a hex string. Set it after initWithApiKeyAndUserId. */
  setNavigationBarTextColor(color: string): void {
    NativeRNTheoremReach.setNavigationBarTextColor(color);
  },
};

export default TheoremReach;
