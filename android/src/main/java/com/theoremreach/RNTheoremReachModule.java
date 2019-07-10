package com.theoremreach;

// import androidx.annotation.Nullable;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;

import theoremreach.com.theoremreach.TheoremReach;
import theoremreach.com.theoremreach.TheoremReachRewardListener;
import theoremreach.com.theoremreach.TheoremReachSurveyListener;
import theoremreach.com.theoremreach.TheoremReachSurveyAvailableListener;

public class RNTheoremReachModule extends ReactContextBaseJavaModule
        implements LifecycleEventListener, TheoremReachRewardListener, TheoremReachSurveyListener, TheoremReachSurveyAvailableListener {

    private final ReactApplicationContext reactContext;
    private boolean isAppInitialized = false;

    public RNTheoremReachModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addLifecycleEventListener(this);
    }

    @Override
    public String getName() {
        return "RNTheoremReach";
    }

    @ReactMethod
    public void initWithApiKeyAndUserId(String apiKey, String userId) {
        TheoremReach.initWithApiKeyAndUserIdAndActivityContext(apiKey, userId, getCurrentActivity());

        // The below code is required because onResume is called before this method by default
        // and it should be prevented for the correct working of the SDK
        TheoremReach.getInstance().onResume(getCurrentActivity());
        isAppInitialized = true;

        TheoremReach.getInstance().setTheoremReachRewardListener(this);
        TheoremReach.getInstance().setTheoremReachSurveyListener(this);
        TheoremReach.getInstance().setTheoremReachSurveyAvailableListener(this);
    }

    @ReactMethod
    public void showRewardCenter() {
        TheoremReach.getInstance().showRewardCenter();
    }

    @ReactMethod
    public void isSurveyAvailable(Callback cb) {
        cb.invoke(TheoremReach.getInstance().isSurveyAvailable());
    }

    /* Callbacks */

    private void sendEvent(ReactContext reactContext,
                           String eventName,
                           @Nullable Object params) {
        reactContext
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit(eventName, params);
    }

    @Override
    public void onReward(int quantity) {
        sendEvent(this.reactContext, "onReward", quantity);
    }

    @Override
    public void onRewardCenterOpened() {
        sendEvent(this.reactContext, "onRewardCenterOpened", null);
    }

    @Override
    public void onRewardCenterClosed() {
        sendEvent(this.reactContext, "onRewardCenterClosed", null);
    }

    @Override
    public void theoremreachSurveyAvailable(boolean surveyAvailable) {
        sendEvent(this.reactContext, "theoremreachSurveyAvailable", surveyAvailable);
    }

    /* Lifecycle methods */

    @Override
    public void onHostResume() {
        if (isAppInitialized) {
            TheoremReach.getInstance().onResume(getCurrentActivity());
        }
    }

    @Override
    public void onHostPause() {
        TheoremReach.getInstance().onPause();
    }

    @Override
    public void onHostDestroy() {
        // Actvity `onDestroy`
    }
}
