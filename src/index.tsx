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
// wrong account. The queue lives in memory, so a reward waiting when the app is killed, or its JS reloads, is lost.
type RewardSubscription = { listener: EventListeners['onReward'] };
const rewardSubscriptions: RewardSubscription[] = [];
const pendingRewards: number[] = [];
let currentApiKey: string | undefined;
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
    // An unknown name would reach Android's module as null, which crashes it, and a listener that isn't a function
    // would throw only when its event arrives: for onReward, after the reward has left the queue.
    if (!Object.prototype.hasOwnProperty.call(NATIVE_EVENTS, event)) {
      throw new TypeError(
        `TheoremReachEventEmitter.addListener: there's no event named ${String(event)}.`
      );
    }
    if (typeof listener !== 'function') {
      throw new TypeError(
        'TheoremReachEventEmitter.addListener: the listener must be a function.'
      );
    }
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

// The native modules take strings: a null would crash Android, whose parameters can't be null, and iOS's SDK would
// take nil or a number. So each call checks its arguments first, as plain JS can pass anything.
function checkStrings(
  call: string,
  args: Record<string, unknown>,
  { nonEmpty = false } = {}
): void {
  for (const [name, value] of Object.entries(args)) {
    if (typeof value !== 'string' || (nonEmpty && value === '')) {
      throw new TypeError(
        `TheoremReach.${call}: ${name} must be a ${nonEmpty ? 'non-empty ' : ''}string.`
      );
    }
  }
}

const TheoremReach = {
  /** Starts the SDK for this user. Call once, before the other calls; a second call for the same key and user does nothing. */
  initWithApiKeyAndUserId(apiKey: string, userId: string): void {
    checkStrings(
      'initWithApiKeyAndUserId',
      { apiKey, userId },
      { nonEmpty: true }
    );
    // Each native start fetches the user afresh and checks for rewards, so two in one round trip could hand over a
    // waiting reward twice (iOS); a start also resets some settings.
    if (apiKey === currentApiKey && userId === currentUserId) {
      return;
    }
    if (userId !== currentUserId) {
      pendingRewards.length = 0;
      currentUserId = userId;
    }
    currentApiKey = apiKey;
    NativeRNTheoremReach.startWithApiKey(apiKey, userId);
  },

  /** Opens the reward center, at a placement when one is given. */
  showRewardCenter(placementId?: string): void {
    if (placementId != null) {
      checkStrings('showRewardCenter', { placementId });
    }
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
    checkStrings('setLoadingBarColor', { color });
    NativeRNTheoremReach.setLoadingBarColor(color);
  },

  /**
   * For an app that measures installs with a mobile measurement partner (MMP): the partner, such as `apptrove`, and
   * its install id, which each survey entry then carries. Set it after initWithApiKeyAndUserId, before the reward
   * center opens.
   */
  setMmpInstallId(provider: string, installId: string): void {
    checkStrings('setMmpInstallId', { provider, installId });
    NativeRNTheoremReach.setMmpInstallId(provider, installId);
  },

  /** The reward center's title. Set it after initWithApiKeyAndUserId. */
  setNavigationBarText(text: string): void {
    checkStrings('setNavigationBarText', { text });
    NativeRNTheoremReach.setNavigationBarText(text);
  },

  /** The reward center's title bar color, as a hex string. Set it after initWithApiKeyAndUserId. */
  setNavigationBarColor(color: string): void {
    checkStrings('setNavigationBarColor', { color });
    NativeRNTheoremReach.setNavigationBarColor(color);
  },

  /** The reward center's title color, as a hex string. Set it after initWithApiKeyAndUserId. */
  setNavigationBarTextColor(color: string): void {
    checkStrings('setNavigationBarTextColor', { color });
    NativeRNTheoremReach.setNavigationBarTextColor(color);
  },
};

export default TheoremReach;
