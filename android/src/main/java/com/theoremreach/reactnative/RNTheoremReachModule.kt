package com.theoremreach.reactnative

import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import theoremreach.com.theoremreach.TheoremReach
import theoremreach.com.theoremreach.TheoremReachRewardListener
import theoremreach.com.theoremreach.TheoremReachSurveyAvailableListener
import theoremreach.com.theoremreach.TheoremReachSurveyListener

class RNTheoremReachModule(reactContext: ReactApplicationContext) :
  NativeRNTheoremReachSpec(reactContext),
  LifecycleEventListener,
  TheoremReachRewardListener,
  TheoremReachSurveyListener,
  TheoremReachSurveyAvailableListener {

  private var started = false

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun startWithApiKey(apiKey: String, userId: String) {
    val activity = reactApplicationContext.currentActivity
    TheoremReach.initWithApiKeyAndUserIdAndActivityContext(apiKey, userId, activity)
    // The host's resume came before this call, so the SDK learns its activity here.
    TheoremReach.getInstance().onResume(activity)
    started = true

    TheoremReach.getInstance().setTheoremReachRewardListener(this)
    TheoremReach.getInstance().setTheoremReachSurveyListener(this)
    TheoremReach.getInstance().setTheoremReachSurveyAvailableListener(this)
  }

  override fun showRewardCenter(placementId: String?) {
    if (placementId.isNullOrEmpty()) {
      TheoremReach.getInstance().showRewardCenter()
    } else {
      TheoremReach.getInstance().showRewardCenter(placementId)
    }
  }

  override fun isSurveyAvailable(promise: Promise) {
    promise.resolve(TheoremReach.getInstance().getIsSurveyAvailable())
  }

  override fun setLoadingBarColor(color: String) {
    TheoremReach.getInstance().setLoadingBarColor(color)
  }

  override fun setMmpInstallId(provider: String, installId: String) {
    TheoremReach.getInstance().setMmpInstallId(provider, installId)
  }

  override fun setNavigationBarText(text: String) {
    TheoremReach.getInstance().setNavigationBarText(text)
  }

  override fun setNavigationBarColor(color: String) {
    TheoremReach.getInstance().setNavigationBarColor(color)
  }

  override fun setNavigationBarTextColor(color: String) {
    TheoremReach.getInstance().setNavigationBarTextColor(color)
  }

  // NativeEventEmitter calls these; the JS side keeps the listeners.
  override fun addListener(eventName: String) {}

  override fun removeListeners(count: Double) {}

  override fun onReward(quantity: Int) = emit("TheoremReachReward", quantity)

  override fun onRewardCenterOpened() = emit("TheoremReachRewardCenterOpened", null)

  override fun onRewardCenterClosed() = emit("TheoremReachRewardCenterClosed", null)

  override fun theoremreachSurveyAvailable(surveyAvailable: Boolean) =
    emit("TheoremReachSurveyAvailable", surveyAvailable)

  // The module's own names, since every module shares the device event emitter; index.tsx maps them to the public ones.
  private fun emit(event: String, payload: Any?) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(event, payload)
  }

  override fun onHostResume() {
    if (started) {
      TheoremReach.getInstance().onResume(reactApplicationContext.currentActivity)
    }
  }

  override fun onHostPause() {
    if (started) {
      TheoremReach.getInstance().onPause()
    }
  }

  override fun onHostDestroy() {}

  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    super.invalidate()
  }

  companion object {
    const val NAME = NativeRNTheoremReachSpec.NAME
  }
}
