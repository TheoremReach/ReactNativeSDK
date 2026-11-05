/// <reference types="jest" />
// TypeScript 6 includes no @types package unless asked.

jest.mock('../NativeRNTheoremReach', () => ({
  __esModule: true,
  default: {
    startWithApiKey: jest.fn(),
    showRewardCenter: jest.fn(),
    isSurveyAvailable: jest.fn(() => Promise.resolve(true)),
    setLoadingBarColor: jest.fn(),
    setMmpInstallId: jest.fn(),
    setNavigationBarText: jest.fn(),
    setNavigationBarColor: jest.fn(),
    setNavigationBarTextColor: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

// A fresh copy of the package per test, so one test's waiting rewards can't reach another's listeners. Events are
// emitted on that copy's own react-native, which the isolation gives it, under the module's own event names.
function load() {
  let loaded!: {
    api: typeof import('../index');
    native: typeof import('../NativeRNTheoremReach').default;
    events: typeof import('react-native').DeviceEventEmitter;
  };
  jest.isolateModules(() => {
    loaded = {
      api: require('../index'),
      native: require('../NativeRNTheoremReach').default,
      events: require('react-native').DeviceEventEmitter,
    };
  });
  return loaded;
}

// Waiting rewards go out after the task that subscribed.
const afterSubscribing = () => Promise.resolve();

afterEach(() => {
  jest.clearAllMocks();
});

describe('the calls', () => {
  it('starts the SDK with the key and user id', () => {
    const { api, native } = load();
    api.default.initWithApiKeyAndUserId('key', 'user-1');
    expect(native.startWithApiKey).toHaveBeenCalledWith('key', 'user-1');
  });

  it('starts the native SDK once for the same key and user', () => {
    const { api, native } = load();
    api.default.initWithApiKeyAndUserId('key', 'user-1');
    api.default.initWithApiKeyAndUserId('key', 'user-1');
    api.default.initWithApiKeyAndUserId('key', 'user-2');
    api.default.initWithApiKeyAndUserId('key', 'user-1');
    expect(native.startWithApiKey).toHaveBeenCalledTimes(3);
  });

  // A null would crash Android, whose parameters can't be null, and iOS's SDK would take nil or a number.
  it("refuses arguments that aren't strings before they reach the native module", () => {
    const { api, native } = load();
    const loose = api.default as unknown as {
      initWithApiKeyAndUserId(apiKey: unknown, userId: unknown): void;
      showRewardCenter(placementId: unknown): void;
      setLoadingBarColor(color: unknown): void;
      setMmpInstallId(provider: unknown, installId: unknown): void;
      setNavigationBarText(text: unknown): void;
      setNavigationBarColor(color: unknown): void;
      setNavigationBarTextColor(color: unknown): void;
    };
    expect(() => loose.initWithApiKeyAndUserId('key', undefined)).toThrow(
      TypeError
    );
    expect(() => loose.initWithApiKeyAndUserId(null, 'user-1')).toThrow(
      TypeError
    );
    expect(() => loose.initWithApiKeyAndUserId('key', '')).toThrow(TypeError);
    expect(() => loose.showRewardCenter(5)).toThrow(TypeError);
    expect(() => loose.setLoadingBarColor(null)).toThrow(TypeError);
    expect(() => loose.setMmpInstallId('apptrove', undefined)).toThrow(
      TypeError
    );
    expect(() => loose.setMmpInstallId(undefined, 'install-1')).toThrow(
      TypeError
    );
    expect(() => loose.setNavigationBarText(undefined)).toThrow(TypeError);
    expect(() => loose.setNavigationBarColor(0x1b0c47)).toThrow(TypeError);
    expect(() => loose.setNavigationBarTextColor({})).toThrow(TypeError);
    for (const call of [
      native.startWithApiKey,
      native.showRewardCenter,
      native.setLoadingBarColor,
      native.setMmpInstallId,
      native.setNavigationBarText,
      native.setNavigationBarColor,
      native.setNavigationBarTextColor,
    ]) {
      expect(call).not.toHaveBeenCalled();
    }
  });

  it('opens the reward center, at a placement when one is given', () => {
    const { api, native } = load();
    api.default.showRewardCenter();
    api.default.showRewardCenter('placement-1');
    expect(native.showRewardCenter).toHaveBeenNthCalledWith(1, null);
    expect(native.showRewardCenter).toHaveBeenNthCalledWith(2, 'placement-1');
  });

  it('answers isSurveyAvailable with a promise, and refuses 3.x callbacks', async () => {
    const { api } = load();
    await expect(api.default.isSurveyAvailable()).resolves.toBe(true);
    const isSurveyAvailable = api.default.isSurveyAvailable as (
      callback: () => void
    ) => Promise<boolean>;
    expect(() => isSurveyAvailable(() => {})).toThrow(TypeError);
  });

  it('passes the settings through', () => {
    const { api, native } = load();
    api.default.setLoadingBarColor('#FC178D');
    api.default.setMmpInstallId('apptrove', 'install-1');
    api.default.setNavigationBarText('Surveys');
    api.default.setNavigationBarColor('#1B0C47');
    api.default.setNavigationBarTextColor('#FFFFFF');
    expect(native.setLoadingBarColor).toHaveBeenCalledWith('#FC178D');
    expect(native.setMmpInstallId).toHaveBeenCalledWith(
      'apptrove',
      'install-1'
    );
    expect(native.setNavigationBarText).toHaveBeenCalledWith('Surveys');
    expect(native.setNavigationBarColor).toHaveBeenCalledWith('#1B0C47');
    expect(native.setNavigationBarTextColor).toHaveBeenCalledWith('#FFFFFF');
  });
});

describe('rewards', () => {
  it('keeps a reward that arrives with no listener, for the listeners that subscribe next', async () => {
    const { api, events } = load();
    api.default.initWithApiKeyAndUserId('key', 'user-1');
    events.emit('TheoremReachReward', 5);

    const first = jest.fn();
    const second = jest.fn();
    api.TheoremReachEventEmitter.addListener('onReward', first);
    api.TheoremReachEventEmitter.addListener('onReward', second);
    expect(first).not.toHaveBeenCalled();
    await afterSubscribing();

    expect(first.mock.calls).toEqual([[5]]);
    expect(second.mock.calls).toEqual([[5]]);
  });

  it("drops a waiting reward when the SDK starts for another user: it isn't theirs", async () => {
    const { api, events } = load();
    api.default.initWithApiKeyAndUserId('key', 'user-a');
    events.emit('TheoremReachReward', 5);

    // The README's hook for user B: subscribe, then start the SDK, in one effect.
    const listener = jest.fn();
    api.TheoremReachEventEmitter.addListener('onReward', listener);
    api.default.initWithApiKeyAndUserId('key', 'user-b');
    await afterSubscribing();
    expect(listener).not.toHaveBeenCalled();

    events.emit('TheoremReachReward', 3);
    expect(listener.mock.calls).toEqual([[3]]);
  });

  it('keeps a waiting reward when the SDK starts again for the same user', async () => {
    const { api, events } = load();
    api.default.initWithApiKeyAndUserId('key', 'user-a');
    events.emit('TheoremReachReward', 5);
    api.default.initWithApiKeyAndUserId('key', 'user-a');

    const listener = jest.fn();
    api.TheoremReachEventEmitter.addListener('onReward', listener);
    await afterSubscribing();
    expect(listener.mock.calls).toEqual([[5]]);
  });

  it('delivers rewards to every listener while there are any, and keeps them again once all are removed', async () => {
    const { api, events } = load();
    api.default.initWithApiKeyAndUserId('key', 'user-1');
    const listener = jest.fn();
    const subscription = api.TheoremReachEventEmitter.addListener(
      'onReward',
      listener
    );

    events.emit('TheoremReachReward', 3);
    subscription.remove();
    events.emit('TheoremReachReward', 2);
    expect(listener.mock.calls).toEqual([[3]]);

    const later = jest.fn();
    api.TheoremReachEventEmitter.addListener('onReward', later);
    await afterSubscribing();
    expect(later.mock.calls).toEqual([[2]]);
  });

  it('removes only its own subscription when two share a listener', () => {
    const { api, events } = load();
    api.default.initWithApiKeyAndUserId('key', 'user-1');
    const listener = jest.fn();
    const first = api.TheoremReachEventEmitter.addListener(
      'onReward',
      listener
    );
    api.TheoremReachEventEmitter.addListener('onReward', listener);

    first.remove();
    events.emit('TheoremReachReward', 4);
    expect(listener.mock.calls).toEqual([[4]]);
  });

  it('lets a one-shot listener remove itself, and keeps the rest of the queue for the next listener', async () => {
    const { api, events } = load();
    api.default.initWithApiKeyAndUserId('key', 'user-1');
    events.emit('TheoremReachReward', 1);
    events.emit('TheoremReachReward', 2);

    const once = jest.fn();
    const subscription = api.TheoremReachEventEmitter.addListener(
      'onReward',
      (quantity) => {
        once(quantity);
        subscription.remove();
      }
    );
    await afterSubscribing();
    expect(once.mock.calls).toEqual([[1]]);

    const next = jest.fn();
    api.TheoremReachEventEmitter.addListener('onReward', next);
    await afterSubscribing();
    expect(next.mock.calls).toEqual([[2]]);
  });

  it('ignores another module\'s "onReward" on the shared emitter', async () => {
    const { api, events } = load();
    api.default.initWithApiKeyAndUserId('key', 'user-1');
    const listener = jest.fn();
    api.TheoremReachEventEmitter.addListener('onReward', listener);

    events.emit('onReward', 100);
    await afterSubscribing();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('the other events', () => {
  it('reach their listeners, and stop after remove', () => {
    const { api, events } = load();
    const opened = jest.fn();
    const available = jest.fn();
    const subscription = api.TheoremReachEventEmitter.addListener(
      'onRewardCenterOpened',
      opened
    );
    api.TheoremReachEventEmitter.addListener(
      'theoremreachSurveyAvailable',
      available
    );

    events.emit('TheoremReachRewardCenterOpened');
    events.emit('TheoremReachSurveyAvailable', true);
    subscription.remove();
    events.emit('TheoremReachRewardCenterOpened');

    expect(opened).toHaveBeenCalledTimes(1);
    expect(available).toHaveBeenCalledWith(true);
  });

  // An unknown name would reach Android's module as null, which crashes it, and a listener that isn't a function would
  // throw only when a reward arrives, after the reward has left the queue.
  it('refuses an event it has no name for, and a listener that is not a function', () => {
    const { api, native } = load();
    const loose = api.TheoremReachEventEmitter as unknown as {
      addListener(event: unknown, listener: unknown): unknown;
    };
    // Cleared, since the package's own reward listener registers at import.
    (native.addListener as jest.Mock).mockClear();
    expect(() => loose.addListener('onRewardCenterOpen', () => {})).toThrow(
      TypeError
    );
    expect(() => loose.addListener('toString', () => {})).toThrow(TypeError);
    expect(() => loose.addListener('onReward', undefined)).toThrow(TypeError);
    expect(() =>
      loose.addListener('onRewardCenterClosed', 'not a function')
    ).toThrow(TypeError);
    expect(native.addListener).not.toHaveBeenCalled();
  });
});
