//
//  TRUtils.h
//
//  Created by TheoremReach on 11/22/15.
//  Copyright (c) 2018 TheoremReach. All rights reserved.
//

#include <sys/types.h>
#include <sys/sysctl.h>

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <AdSupport/ASIdentifierManager.h>
#import <SystemConfiguration/SystemConfiguration.h>
#import <CoreTelephony/CTTelephonyNetworkInfo.h>
#import <CoreTelephony/CTCarrier.h>

#if __has_include(<AppTrackingTransparency/AppTrackingTransparency.h>)
#import <AppTrackingTransparency/AppTrackingTransparency.h>
#endif

#ifdef DEBUG

#define TR_Log( s, ... ) NSLog( @"<%@:%d> %@", [[NSString stringWithUTF8String:__FILE__] lastPathComponent], __LINE__,  [NSString stringWithFormat:(s), ##__VA_ARGS__] )
#define TR_LogFunction TR_Log(@"%s called", __FUNCTION__)

#else

#define TR_Log( s, ... )
#define TR_LogFunction

#endif

#define SYSTEM_VERSION_LESS_THAN(v) ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] == NSOrderedAscending)

#define IS_PHONE_DEVICE() UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone

@interface TRUtils : NSObject
+ (UIImage *)imageWithImage:(UIImage *)image scaledToSize:(CGSize)newSize;
+ (NSString *)hardwareString;
+ (NSString *)getOsVersion;
+ (NSString *)getCarrierName;
+ (NSString *)getConnectionType;
+ (BOOL)appHasPermissionForIDFA;
+ (NSString *)getIDFA;
@end
