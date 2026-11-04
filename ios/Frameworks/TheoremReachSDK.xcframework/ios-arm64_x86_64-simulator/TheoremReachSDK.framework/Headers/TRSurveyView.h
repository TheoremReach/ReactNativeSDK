//
//  TRSurveyView.h
//
//  Created by TheoremReach on 11/22/15.
//  Copyright (c) 2018 TheoremReach. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

@class TRSurveyView;

@protocol TRSurveyViewDelegate<NSObject>

- (void)TRSurveyView:(TRSurveyView *)trSurveyView donePushed:(id)sender;

@end

@interface TRSurveyView : WKWebView <WKScriptMessageHandler, WKNavigationDelegate, UIAlertViewDelegate, WKUIDelegate>

@property NSString *baseUrl;
@property BOOL showMenu;

@property (strong, nonatomic) IBOutlet UIView *containerView;
@property (strong, nonatomic) IBOutlet UIToolbar *navBar;
@property (strong, nonatomic) IBOutlet UIToolbar *bottomBar;
@property (strong, nonatomic) IBOutlet UIBarButtonItem *doneButton;
@property (strong, nonatomic) IBOutlet UIBarButtonItem *rewardsCenterButton;
@property (strong, nonatomic) IBOutlet UIBarButtonItem *flex;
@property (strong, nonatomic) IBOutlet UIBarButtonItem *toolbarTitle;
@property (strong, nonatomic) IBOutlet UIBarButtonItem *refreshButton;
@property (strong, nonatomic) IBOutlet UILabel *toolbarTitleLabel;
@property (strong, nonatomic) IBOutlet WKWebView *iframeView;
@property (strong, nonatomic) UIProgressView *progressBar;
@property NSTimer *sendAppleFlagsTimer;
// Set as the reward center closes: a page can still finish loading then, and starts no ping.
@property BOOL closed;

@property (weak, nonatomic) id<TRSurveyViewDelegate> delegate;

- (UIToolbar *)buildNavBarWithY:(float)y width:(float)width height:(float)height;
- (void)setupNavBarButtons;
- (void)resizeRewardsCenterView;
- (void)googleSignInResult: (NSString *)idToken;
- (void)sendAppleFlags;
- (void)sendPlaytimeStatus:(BOOL)campaignsAvailable;
- (void)sendErrorMessage: (NSString *)errorMessageKey;
- (void)showLoadingIndicator;
- (void)hideLoadingIndicator;
+ (UIColor*)colorWithHexString: (NSString*)hexString;

@end
