#import "RNTheoremReach.h"

#import <React/RCTUtils.h>

@implementation RNTheoremReach {
  // The app's status bar style while the reward center is open, put back when it closes, and the reward center's that
  // the module set in its place.
  BOOL _statusBarStyleSaved;
  UIStatusBarStyle _savedStatusBarStyle;
  UIStatusBarStyle _rewardCenterStatusBarStyle;
  // JS heard the reward center open and hasn't heard it close.
  BOOL _rewardCenterOpen;
}

RCT_EXPORT_MODULE()

// The SDK presents its reward center and changes its views, so every call runs on the main queue.
- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

// The module's own names, since every module shares the device event emitter; index.tsx maps them to the public ones.
- (NSArray<NSString *> *)supportedEvents
{
  return @[
    @"TheoremReachReward", @"TheoremReachRewardCenterOpened", @"TheoremReachRewardCenterClosed",
    @"TheoremReachSurveyAvailable"
  ];
}

- (void)startWithApiKey:(NSString *)apiKey userId:(NSString *)userId
{
  // Starting the SDK forgets an open reward center, which then never reports its close.
  [self restoreStatusBar];
  [TheoremReach initWithApiKey:apiKey userId:userId];

  TheoremReach *sdk = [TheoremReach getInstance];
  sdk.rewardListenerDelegate = self;
  sdk.surveyListenerDelegate = self;
  sdk.surveyAvailableDelegate = self;
}

- (void)showRewardCenter:(NSString *_Nullable)placementId
{
  // One reward center at a time: a second would open over the first (a timer or a deep link can call this while one
  // is open), and the first's close would then never reach JS.
  if ([TheoremReach getInstance].rewardCenterViewController.presentingViewController != nil) {
    return;
  }

  // Presented from the screen on top, which a scene-based app has no key window to find; with none, the SDK finds its
  // own. The placement goes with every show, nil when there's none: the SDK clears it only when its reward center
  // closes, so one that never closed would hand its placement to the next.
  [TheoremReach showRewardCenter:(placementId.length > 0 ? placementId : nil)
              fromViewController:RCTPresentedViewController()];

  // The SDK reports the reward center open before presenting it. If UIKit refused the presentation (the presenter
  // was mid-transition, say, or the last reward center was still sliding out), no close will come, so the app's style
  // comes back, and JS hears the close of the open it heard.
  if ([TheoremReach getInstance].rewardCenterViewController.presentingViewController == nil) {
    [self restoreStatusBar];
    if (_rewardCenterOpen) {
      _rewardCenterOpen = NO;
      [self sendEventWithName:@"TheoremReachRewardCenterClosed" body:nil];
    }
  }
}

- (void)isSurveyAvailable:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  resolve(@([TheoremReach getIsSurveyAvailable]));
}

- (void)setLoadingBarColor:(NSString *)color
{
  [[TheoremReach getInstance] setLoadingBarColor:color];
}

- (void)setMmpInstallId:(NSString *)provider installId:(NSString *)installId
{
  [[TheoremReach getInstance] setMmpProvider:provider installId:installId];
}

- (void)setNavigationBarText:(NSString *)text
{
  [[TheoremReach getInstance] setNavigationBarText:text];
}

- (void)setNavigationBarColor:(NSString *)color
{
  [[TheoremReach getInstance] setNavigationBarColor:color];
}

- (void)setNavigationBarTextColor:(NSString *)color
{
  [[TheoremReach getInstance] setNavigationBarTextColor:color];
}

#pragma mark - The SDK's callbacks

- (void)onReward:(NSNumber *)quantity
{
  [self sendEventWithName:@"TheoremReachReward" body:quantity];
}

// Called just before the SDK presents the reward center.
- (void)onRewardCenterOpened
{
  [self useRewardCenterStatusBar];
  _rewardCenterOpen = YES;
  [self sendEventWithName:@"TheoremReachRewardCenterOpened" body:nil];
}

- (void)onRewardCenterClosed
{
  [self restoreStatusBar];
  _rewardCenterOpen = NO;
  [self sendEventWithName:@"TheoremReachRewardCenterClosed" body:nil];
}

- (void)theoremreachSurveyAvailable:(BOOL)surveyAvailable
{
  [self sendEventWithName:@"TheoremReachSurveyAvailable" body:@(surveyAvailable)];
}

#pragma mark - The status bar over the reward center

// The reward center asks for a status bar that follows its title (the SDK's rewardCenterStatusBarStyle: dark under a
// dark title, light under a light one), but React Native apps turn view controller based status bar appearance off
// (React Native's StatusBar module needs it off), so iOS never asks it: the app's own style would sit on the title bar.
// Such an app gets the reward center's style while it's open, set as React Native's StatusBar module sets it.
static BOOL RNTheoremReachAppSetsStatusBar(void)
{
  NSNumber *viewControllerBased =
      [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"];
  return viewControllerBased != nil && !viewControllerBased.boolValue;
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (void)useRewardCenterStatusBar
{
  if (_statusBarStyleSaved || !RNTheoremReachAppSetsStatusBar()) {
    return;
  }
  _savedStatusBarStyle = RCTSharedApplication().statusBarStyle;
  _rewardCenterStatusBarStyle = [[TheoremReach getInstance] rewardCenterStatusBarStyle];
  _statusBarStyleSaved = YES;
  RCTSharedApplication().statusBarStyle = _rewardCenterStatusBarStyle;
}

- (void)restoreStatusBar
{
  if (!_statusBarStyleSaved) {
    return;
  }
  _statusBarStyleSaved = NO;
  // A style the app set while the reward center was open (React Native's StatusBar following the color scheme, say)
  // stands.
  if (RCTSharedApplication().statusBarStyle == _rewardCenterStatusBarStyle) {
    RCTSharedApplication().statusBarStyle = _savedStatusBarStyle;
  }
}
#pragma clang diagnostic pop

// Required by the SDK's survey delegate protocol; the module has nothing to do on either.
- (void)onRewardCenterViewSet
{
}

- (void)onSessionIdSet
{
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRNTheoremReachSpecJSI>(params);
}

@end
