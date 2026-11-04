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

// A fresh copy of the package per test, so one test's pending rewards can't reach another's listeners. Events are
// emitted on that copy's own react-native, which the isolation gives it.
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

afterEach(() => {
  jest.clearAllMocks();
});

describe('the calls', () => {
  it('starts the SDK with the key and user id', () => {
    const { api, native } = load();
    api.default.initWithApiKeyAndUserId('key', 'user-1');
    expect(native.startWithApiKey).toHaveBeenCalledWith('key', 'user-1');
  });

  it('opens the reward center, at a placement when one is given', () => {
    const { api, native } = load();
    api.default.showRewardCenter();
    api.default.showRewardCenter('placement-1');
    expect(native.showRewardCenter).toHaveBeenNthCalledWith(1, null);
    expect(native.showRewardCenter).toHaveBeenNthCalledWith(2, 'placement-1');
  });

  it('answers isSurveyAvailable with a promise', async () => {
    const { api } = load();
    await expect(api.default.isSurveyAvailable()).resolves.toBe(true);
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
  it('keeps a reward that arrives with no listener, for the first listener', () => {
    const { api, events } = load();
    events.emit('onReward', 5);

    const first = jest.fn();
    const second = jest.fn();
    api.TheoremReachEventEmitter.addListener('onReward', first);
    api.TheoremReachEventEmitter.addListener('onReward', second);

    expect(first).toHaveBeenCalledWith(5);
    expect(second).not.toHaveBeenCalled();
  });

  it('delivers rewards to every listener while there are any, and keeps them again once all are removed', () => {
    const { api, events } = load();
    const listener = jest.fn();
    const subscription = api.TheoremReachEventEmitter.addListener(
      'onReward',
      listener
    );

    events.emit('onReward', 3);
    subscription.remove();
    events.emit('onReward', 2);
    expect(listener.mock.calls).toEqual([[3]]);

    const later = jest.fn();
    api.TheoremReachEventEmitter.addListener('onReward', later);
    expect(later).toHaveBeenCalledWith(2);
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

    events.emit('onRewardCenterOpened');
    events.emit('theoremreachSurveyAvailable', true);
    subscription.remove();
    events.emit('onRewardCenterOpened');

    expect(opened).toHaveBeenCalledTimes(1);
    expect(available).toHaveBeenCalledWith(true);
  });
});
