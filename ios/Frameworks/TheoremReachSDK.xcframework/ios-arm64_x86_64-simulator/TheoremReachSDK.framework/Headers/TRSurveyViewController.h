//
//  TRSurveyrViewController.h
//
//  Created by TheoremReach on 11/22/15.
//  Copyright (c) 2018 TheoremReach. All rights reserved.
//


#import <UIKit/UIKit.h>
#import "TRSurveyView.h"

@class TRSurveyViewController;

@interface TRSurveyViewController : UIViewController <TRSurveyViewDelegate>

@property (strong, nonatomic) IBOutlet TRSurveyView *trWebView;
@property NSString *baseUrl;

- (void)answerPlaytimeTeaser;
- (void)launchPlaytimeCatalog;

@end
