# @theoremreachnpm/react-native-theoremreach

## Before you start

### Get your API key

Sign-up for a new developer account and create a new app [here](https://theoremreach.com/developer/apps) and copy your API Key.

## Getting started

`$ npm install @theoremreachnpm/react-native-theoremreach`

`$ yarn add react-native-webview`

`$ cd ios && pod install && cd ..` # CocoaPods on iOS needs this extra step

We are all set up! Now let's use the module.

## Usage

### Initialize TheoremReach
First, you need to initialize the TheoremReach instance with `initWithApiKeyAndUserId` call.
```javascript
// Import TheoremReach native module
import TheoremReach from '@theoremreachnpm/react-native-theoremreach';

componentDidMount() {
  // In your app initialization, initialize TheoremReach
  TheoremReach.initWithApiKeyAndUserId('YOUR_API_TOKEN', 'YOUR_USER_ID');
}
```

### Reward Center
Next, implement the logic to display the reward center. Call the `showRewardCenter` method when you are ready to send the user into the reward center where they can complete surveys in exchange for your virtual currency. We automatically convert the amount of currency a user gets based on the conversion rate specified in your app.

```javascript
onPressShowRewardCenter = () => {
  TheoremReach.showRewardCenter();
}
```

### Reward Callback

To ensure safety and privacy, we recommend using a server side callback to notify you of all awards. In the developer dashboard for your App add the server callback that we should call to notify you when a user has completed an offer. Note the user ID pass into the initialize call will be returned to you in the server side callback. More information about setting up the callback can be found in the developer dashboard.

The quantity value will automatically be converted to your virtual currency based on the exchange rate you specified in your app. Currency is always rounded in favor of the app user to improve happiness and engagement.

#### Client Side Award Callback

If you do not have a server to handle server side callbacks we additionally provide you with the ability to listen to client side reward notification. 

First, import Native Module Event Emitter:
```javascript
import { TheoremReachEventEmitter } from '@theoremreachnpm/react-native-theoremreach';
```

Then, add event listener for award notification (in `componentWillMount`, for example):
```javascript
this.onRewardListener = TheoremReachEventEmitter.addListener(
  'onReward',
  this.onReward,
);
```

Implement the callback:
```javascript
onReward = (quantity) => {
  console.log('reward quantity: ', quantity);
}
```

#### Reward Center Events

You can optionally listen for the `onRewardCenterOpened` and `onRewardCenterClosed` events that are fired when your Reward Center modal is opened and closed.

Add event listeners for `onRewardCenterOpened` and `onRewardCenterClosed`:

```javascript
this.onRewardCenterOpenedListener = TheoremReachEventEmitter.addListener(
  'onRewardCenterOpened',
  this.onRewardCenterOpened,
);
this.onRewardCenterClosedListener = TheoremReachEventEmitter.addListener(
  'onRewardCenterClosed',
  this.onRewardCenterClosed,
);
```

Implement event callbacks:
```javascript
onRewardCenterOpened = () => {
  console.log('onRewardCenterOpened called!');
}

onRewardCenterClosed = () => {
  console.log('onRewardCenterClosed called!');
}
```

#### Survey Available Callback

If you'd like to be proactively alerted to when a survey is available for a user you can add this event listener. 

First, import Native Module Event Emitter:
```javascript
import { TheoremReachEventEmitter } from '@theoremreachnpm/react-native-theoremreach';
```

Then, add event listener for award notification (in `componentWillMount`, for example):
```javascript
this.theoremreachSurveyAvailableListener = TheoremReachEventEmitter.addListener(
  'theoremreachSurveyAvailable',
  this.theoremreachSurveyAvailable,
);
```

Implement the callback:
```javascript
theoremreachSurveyAvailable = (surveyAvailable) => {
  if (surveyAvailable == 1) {
    console.log('theoremreach survey is available');
  } else {
    console.log('theoremreach survey is NOT available');
  }
}
```

Finally, don't forget to remove your event listeners in the `componentWillUnmount` lifecycle method:
```javascript
componentWillUnmount() {
  this.onRewardListener.remove();
  this.onRewardCenterOpenedListener.remove();
  this.onRewardCenterClosedListener.remove();
  this.theoremreachSurveyAvailableListener.remove();
}
```

## Contact
Please send all questions, concerns, or bug reports to admin@theoremreach.com.

## FAQ
##### What do you do to protect privacy?
We take privacy very seriously. All data is encrypted before being sent over the network. We also use HTTPS to ensure the integrity and privacy of the exchanged data.

##### What kind of analytics do you provide?

Our dashboard will show metrics for sessions, impressions, revenue, and much more. We are constantly enhancing our analytics so we can better serve your needs.

##### What is your fill rate?

We have thousands of surveys and add hundreds more every day. Most users will have the opportunity to complete at least one survey on a daily basis.

##### I'm ready to go live! What are the next steps?

Let us know! We'd love to help ensure everything flows smoothly and help you achieve your monetisation goals!

## ChangeLog

### v.3.6.9
- Update bottom bar color in Android

### v.3.6.8
- Remove bitcode

### v.3.6.7
- Updated version tracking and default colors

### v.3.6.6
- Fix close and refresh buttons for iPhone 8 and earlier

### v.3.6.5
- Better third party login support

### v.3.6.4
- Fix issue with iOS linking
