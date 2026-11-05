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
    // Any settings go after the start, which resets some of them.
    TheoremReach.setNavigationBarText('Earn rewards');

    return () => onReward.remove();
  }, [userId]);
}

// When the user is ready to take surveys:
TheoremReach.showRewardCenter();
```

A reward that arrives while nothing listens for `onReward` waits for the next listeners, unless the SDK starts for
another user first: a waiting reward is only ever the current user's. The wait is in memory, so a reward is lost if
the app is killed, or its JS reloads (an over-the-air update's restart, say), while it waits. Subscribe on a screen
that's mounted while the reward center is open, or soon after.

### Calls

| Call | What it does |
| --- | --- |
| `initWithApiKeyAndUserId(apiKey, userId)` | Starts the SDK for this user. Call it once, before the others; a second call for the same key and user does nothing. |
| `showRewardCenter(placementId?)` | Opens the reward center, at a placement when you pass one. |
| `isSurveyAvailable()` | A promise of whether a survey is available. |
| `setLoadingBarColor(color)` | The loading bar's color, as a hex string such as `#FC178D`. |
| `setMmpInstallId(provider, installId)` | For an app that measures installs with a mobile measurement partner (MMP): the partner, such as `apptrove`, and its install id. Call it before the reward center opens. |
| `setNavigationBarText(text)` | The reward center's title. |
| `setNavigationBarColor(color)` | The title bar's color, as a hex string. |
| `setNavigationBarTextColor(color)` | The title's color, as a hex string. |

Call the settings after `initWithApiKeyAndUserId`: starting the SDK resets some of them (the colors on iOS, the title
on Android). Each call takes strings, and throws a `TypeError` for anything else, such as an install id that isn't
there yet.

### Events

Listen with `TheoremReachEventEmitter.addListener(event, listener)`, which returns a subscription with `remove()`.

| Event | Listener |
| --- | --- |
| `onReward` | `(quantity: number) => void`: currency the user earned, in your app's units. |
| `onRewardCenterOpened` | `() => void` |
| `onRewardCenterClosed` | `() => void` |
| `theoremreachSurveyAvailable` | `(surveyAvailable: boolean) => void` |

## Upgrading from 3.x

- The package now needs React Native 0.76 or later, on the new architecture. Apps on older versions, or on 0.76 to
  0.81 with the new architecture turned off, can keep 3.8.3. On iOS, `pod install` stops with that message on the old
  architecture.
- `isSurveyAvailable` returns a promise instead of taking a callback.
- The calls throw a `TypeError` for an argument that isn't a string, and for an empty API key or user id, which 3.x
  passed on. `TheoremReachEventEmitter.addListener` throws one for an event name it doesn't know, or a listener that
  isn't a function.
- A second `initWithApiKeyAndUserId` for the same key and user does nothing, so it no longer sends a fresh
  `theoremreachSurveyAvailable`. An app that started the SDK on every screen to learn that should call
  `isSurveyAvailable()` instead.
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
- **An Android release build fails with `Manifest merger failed : Attribute application@usesCleartextTraffic`:** the
  Android SDK's manifest allows cleartext (http) traffic, and apps made from React Native's template since 0.81.2 turn
  it off in release builds. To keep your app's setting, add `android:usesCleartextTraffic` to `tools:replace` on the
  `<application>` element of `android/app/src/main/AndroidManifest.xml` (comma-separated, if it already lists
  attributes), with `xmlns:tools="http://schemas.android.com/tools"` on its `<manifest>` element. The example app does
  the same. An app whose main manifest doesn't set it, as earlier templates' don't, builds without the error, and the
  SDK's value allows cleartext traffic in its release builds.

## Example app

`example/` holds an app that opens the reward center and logs every event. From the repository's root: `yarn`, then
`yarn example ios` or `yarn example android`.

## Other platforms

[iOS](https://theoremreach.com/docs/ios) · [Android](https://theoremreach.com/docs/android) ·
[Unity](https://theoremreach.com/docs/unity) · [Web](https://theoremreach.com/docs/web)

## Changelog

### 4.0.0

- Rebuilt as a TurboModule for React Native's new architecture, with TypeScript types.
- On TheoremReach's Android SDK 3.7.0, from Maven Central, and iOS SDK 3.6.0, which the package bundles.
- New: placements, the loading bar's color, the MMP install id, and the title bar's settings.
- `isSurveyAvailable` returns a promise.
- Each call checks its arguments are strings, and throws a `TypeError` for anything else, rather than crash in native
  code. A second start for the same key and user does nothing.
- A reward that arrives while nothing listens waits for the next `onReward` listeners, unless the SDK starts for
  another user first.
- iOS: the status bar is light over the reward center's title bar, as in native apps, and goes back to the app's own
  style when it closes.

## License

The TheoremReach SDK is licensed under the
[TheoremReach Publisher Terms and Conditions](https://info.theoremreach.com/terms-of-service/); see
[LICENSE](LICENSE). The example app's code is under the MIT License ([its LICENSE](example/LICENSE)).
