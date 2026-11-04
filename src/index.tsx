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

// The module's own event names: the device event emitter is shared by every native module, so a public name such as
// onReward could be another SDK's.
const NATIVE_EVENTS = {
  onReward: 'TheoremReachReward',
  onRewardCenterOpened: 'TheoremReachRewardCenterOpened',
  onRewardCenterClosed: 'TheoremReachRewardCenterClosed',
  theoremreachSurveyAvailable: 'TheoremReachSurveyAvailable',
} as const satisfies Record<TheoremReachEvent, string>;

type NativeEventArgs = {
  [E in TheoremReachEvent as (typeof NATIVE_EVENTS)[E]]: EventArgs[E];
};

const nativeEmitter = new NativeEventEmitter<NativeEventArgs>(
  NativeRNTheoremReach
);

// The SDK confirms a reward with TheoremReach once it has handed it to this module, so one that arrives while the app
// has no onReward listener (before the screen that listens has mounted, say) waits here for the next listeners.
// Listening from import also means the native side never drops a reward for want of a listener.
//
// A waiting reward is the current user's: starting the SDK for another user drops it, so it can't be credited to the
// wrong account. The queue lives in memory, so a reward waiting when the app is killed is lost.
type RewardSubscription = { listener: EventListeners['onReward'] };
const rewardSubscriptions: RewardSubscription[] = [];
const pendingRewards: number[] = [];
let currentUserId: string | undefined;

function deliverReward(quantity: number) {
  rewardSubscriptions
    .slice()
    .forEach((subscription) => subscription.listener(quantity));
}

// Each reward leaves the queue as it's delivered, so a listener that throws leaves the rest for the next listener.
function deliverPendingRewards() {
  while (pendingRewards.length > 0 && rewardSubscriptions.length > 0) {
    deliverReward(pendingRewards.shift() as number);
  }
}

nativeEmitter.addListener(NATIVE_EVENTS.onReward, (quantity: number) => {
  if (rewardSubscriptions.length === 0) {
    pendingRewards.push(quantity);
    return;
  }
  deliverReward(quantity);
});

export const TheoremReachEventEmitter = {
  addListener<E extends TheoremReachEvent>(
    event: E,
    listener: EventListeners[E]
  ): TheoremReachSubscription {
    if (event === 'onReward') {
      const subscription: RewardSubscription = {
        listener: listener as EventListeners['onReward'],
      };
      rewardSubscriptions.push(subscription);
      // Delivered after the current task: an app that subscribes and then starts the SDK for a new user, in the same
      // effect, has switched users by then. And a listener that removes its own subscription can reach it.
      Promise.resolve().then(deliverPendingRewards);
      return {
        remove: () => {
          const index = rewardSubscriptions.indexOf(subscription);
          if (index !== -1) {
            rewardSubscriptions.splice(index, 1);
          }
        },
      };
    }
    return nativeEmitter.addListener(
      NATIVE_EVENTS[event],
      listener as (...args: NativeEventArgs[(typeof NATIVE_EVENTS)[E]]) => void
    );
  },
};

const TheoremReach = {
  /** Starts the SDK for this user. Call once, before the other calls. */
  initWithApiKeyAndUserId(apiKey: string, userId: string): void {
    if (userId !== currentUserId) {
      pendingRewards.length = 0;
      currentUserId = userId;
    }
    NativeRNTheoremReach.startWithApiKey(apiKey, userId);
  },

  /** Opens the reward center, at a placement when one is given. */
  showRewardCenter(placementId?: string): void {
    NativeRNTheoremReach.showRewardCenter(placementId ?? null);
  },

  /** Whether a survey is available. Since 4.0.0 a promise: it takes no callback. */
  isSurveyAvailable(...args: []): Promise<boolean> {
    // The type takes no argument; plain JS from 3.x can still pass its callback.
    if (typeof (args as unknown[])[0] === 'function') {
      throw new TypeError(
        'TheoremReach.isSurveyAvailable takes no callback since 4.0.0: it returns a promise.'
      );
    }
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
