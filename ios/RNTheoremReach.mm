#import "RNTheoremReach.h"

#import <React/RCTUtils.h>

@implementation RNTheoremReach

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

- (void)onRewardCenterOpened
{
  [self sendEventWithName:@"TheoremReachRewardCenterOpened" body:nil];
}

- (void)onRewardCenterClosed
{
  [self sendEventWithName:@"TheoremReachRewardCenterClosed" body:nil];
}

- (void)theoremreachSurveyAvailable:(BOOL)surveyAvailable
{
  [self sendEventWithName:@"TheoremReachSurveyAvailable" body:@(surveyAvailable)];
}

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
