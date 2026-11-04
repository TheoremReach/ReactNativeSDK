# TheoremReach React Native SDK

Monetize your users through rewarded surveys. This package wraps TheoremReach's native SDKs: Android 3.7.0 and iOS
3.6.0.

## Requirements

- React Native 0.76 or later, on the new architecture.
- iOS 15.1 or later (React Native's own minimum).
- Android: `compileSdk` 35 or later (Google sign-in uses Credential Manager), `minSdk` 24 or later.

## Install

```sh
npm install @theoremreachnpm/react-native-theoremreach
cd ios && pod install
```

The package bundles the iOS SDK, so there's nothing else to add on iOS. Android takes
`com.theoremreach:theoremreach` from Maven Central.

## Get your API key

Sign up for a developer account, create an app [here](https://theoremreach.com/developer/apps), and copy its API key.

## Usage

```tsx
import { useEffect } from 'react';
import TheoremReach, { TheoremReachEventEmitter } from '@theoremreachnpm/react-native-theoremreach';

export function useTheoremReach(userId: string) {
  useEffect(() => {
    const onReward = TheoremReachEventEmitter.addListener('onReward', (quantity) => {
      // Credit `quantity` of your currency to the user.
    });

    TheoremReach.initWithApiKeyAndUserId('YOUR_API_KEY', userId);

    return () => onReward.remove();
  }, [userId]);
}

// When the user is ready to take surveys:
TheoremReach.showRewardCenter();
```

A reward that arrives while nothing listens for `onReward` waits for the next listeners, unless the SDK starts for
another user first: a waiting reward is only ever the current user's. The wait is in memory, so a reward is lost if
the app is killed while it waits. Subscribe on a screen that's mounted while the reward center is open, or soon
after.

### Calls

| Call | What it does |
| --- | --- |
| `initWithApiKeyAndUserId(apiKey, userId)` | Starts the SDK for this user. Call it once, before the others. |
| `showRewardCenter(placementId?)` | Opens the reward center, at a placement when you pass one. |
| `isSurveyAvailable()` | A promise of whether a survey is available. |
| `setLoadingBarColor(color)` | The loading bar's color, as a hex string such as `#FC178D`. |
| `setMmpInstallId(provider, installId)` | For an app that measures installs with a mobile measurement partner (MMP): the partner, such as `apptrove`, and its install id. Call it before the reward center opens. |
| `setNavigationBarText(text)` | The reward center's title. |
| `setNavigationBarColor(color)` | The title bar's color, as a hex string. |
| `setNavigationBarTextColor(color)` | The title's color, as a hex string. |

Call the settings after `initWithApiKeyAndUserId`: starting the SDK resets some of them (the colors on iOS, the title
on Android).

### Events

Listen with `TheoremReachEventEmitter.addListener(event, listener)`, which returns a subscription with `remove()`.

| Event | Listener |
| --- | --- |
| `onReward` | `(quantity: number) => void`: currency the user earned, in your app's units. |
| `onRewardCenterOpened` | `() => void` |
| `onRewardCenterClosed` | `() => void` |
| `theoremreachSurveyAvailable` | `(surveyAvailable: boolean) => void` |

## Upgrading from 3.x

- The package now needs React Native 0.76 or later, on the new architecture. Apps on older versions can keep 3.8.3.
- `isSurveyAvailable` returns a promise instead of taking a callback.
- On iOS, drop any `pod 'TheoremReach'` from your Podfile: the package bundles the SDK.
- The default export is an object of the calls above, not the native module. `TheoremReachEventEmitter` has
  `addListener` only; remove each subscription with its `remove()`.
- `react-native-webview` isn't needed: remove it if you added it for 3.x.
- On Expo, the package needs a development build, as any package with native code does.
- On Android, the package class moved to `com.theoremreach.reactnative.RNTheoremReachPackage`. Autolinking finds it;
  only an app that registered it by hand changes its import.
- The native SDKs now send user ids URL-encoded, so a user id with characters such as `&`, `#` or `+` may show up as
  a new user.

## Troubleshooting

- **`pod install` fails with `cannot load such file -- kconv`:** your Gemfile pins an older CFPropertyList, which
  CocoaPods uses to read the bundled framework, on Ruby 3.4 or later. Add `gem "nkf"` to the Gemfile, then
  `bundle install`.

## Example app

`example/` holds an app that opens the reward center and logs every event. From the repository's root: `yarn`, then
`yarn example ios` or `yarn example android`.

## Other platforms

[iOS](https://theoremreach.com/docs/ios) · [Android](https://theoremreach.com/docs/android) ·
[Unity](https://theoremreach.com/docs/unity) · [Web](https://theoremreach.com/docs/web)

## Changelog

### 4.0.0

- Rebuilt as a TurboModule for React Native's new architecture, with TypeScript types.
- On TheoremReach's Android SDK 3.7.0 and iOS SDK 3.6.0, which the package bundles.
- New: placements, the loading bar's color, the MMP install id, and the title bar's settings.
- `isSurveyAvailable` returns a promise.
- A reward that arrives while nothing listens waits for the next `onReward` listeners, unless the SDK starts for
  another user first.

## License

The TheoremReach SDK is licensed under the
[TheoremReach Publisher Terms and Conditions](https://info.theoremreach.com/terms-of-service/); see
[LICENSE](LICENSE). The example app's code is under the MIT License ([its LICENSE](example/LICENSE)).
