#import <React/RCTEventEmitter.h>
#import <RNTheoremReachSpec/RNTheoremReachSpec.h>
#import <TheoremReachSDK/TheoremReach.h>

@interface RNTheoremReach : RCTEventEmitter <NativeRNTheoremReachSpec, TheoremReachRewardDelegate,
                                             TheoremReachSurveyDelegate, TheoremReachSurveyAvailableDelegate>

@end
