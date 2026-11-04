#import "RNTheoremReach.h"

#import <React/RCTUtils.h>

@implementation RNTheoremReach {
  // The app's status bar style while the reward center is open, put back when it closes.
  BOOL _statusBarStyleSaved;
  UIStatusBarStyle _savedStatusBarStyle;
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
  [TheoremReach initWithApiKey:apiKey userId:userId];

  TheoremReach *sdk = [TheoremReach getInstance];
  sdk.rewardListenerDelegate = self;
  sdk.surveyListenerDelegate = self;
  sdk.surveyAvailableDelegate = self;
}

- (void)showRewardCenter:(NSString *_Nullable)placementId
{
  // Presented from the screen on top, which a scene-based app has no key window to find.
  UIViewController *presenter = RCTPresentedViewController();
  if (placementId.length > 0) {
    if (presenter) {
      [TheoremReach showRewardCenter:placementId fromViewController:presenter];
    } else {
      [TheoremReach showRewardCenter:placementId];
    }
  } else if (presenter) {
    [TheoremReach showRewardCenterFromViewController:presenter];
  } else {
    [TheoremReach showRewardCenter];
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
  [self useLightStatusBar];
  [self sendEventWithName:@"TheoremReachRewardCenterOpened" body:nil];
}

- (void)onRewardCenterClosed
{
  [self restoreStatusBar];
  [self sendEventWithName:@"TheoremReachRewardCenterClosed" body:nil];
}

- (void)theoremreachSurveyAvailable:(BOOL)surveyAvailable
{
  [self sendEventWithName:@"TheoremReachSurveyAvailable" body:@(surveyAvailable)];
}

#pragma mark - The status bar over the reward center

// The reward center asks for a light status bar over its dark title bar, but React Native apps turn view controller
// based status bar appearance off (React Native's StatusBar module needs it off), so iOS never asks it: the app's own
// style, dark in light mode, would sit on the title bar. Such an app's style is light while the reward center is open,
// set as React Native's StatusBar module sets it.
static BOOL RNTheoremReachAppSetsStatusBar(void)
{
  NSNumber *viewControllerBased =
      [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"];
  return viewControllerBased != nil && !viewControllerBased.boolValue;
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (void)useLightStatusBar
{
  if (_statusBarStyleSaved || !RNTheoremReachAppSetsStatusBar()) {
    return;
  }
  _savedStatusBarStyle = RCTSharedApplication().statusBarStyle;
  _statusBarStyleSaved = YES;
  RCTSharedApplication().statusBarStyle = UIStatusBarStyleLightContent;
}

- (void)restoreStatusBar
{
  if (!_statusBarStyleSaved) {
    return;
  }
  RCTSharedApplication().statusBarStyle = _savedStatusBarStyle;
  _statusBarStyleSaved = NO;
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
