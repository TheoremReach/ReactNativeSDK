package com.theoremreach.reactnative

import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.core.DeviceEventManagerModule
import theoremreach.com.theoremreach.TheoremReach
import theoremreach.com.theoremreach.TheoremReachRewardListener
import theoremreach.com.theoremreach.TheoremReachSurveyAvailableListener
import theoremreach.com.theoremreach.TheoremReachSurveyListener

// React Native calls the methods below on its modules thread, while the host's pause and resume reach the SDK on the
// main thread. A show reads the SDK's activity more than once, and a pause between those reads would end the app, so
// every SDK call runs on the main thread, in the order JS made it, as on iOS.
class RNTheoremReachModule(reactContext: ReactApplicationContext) :
  NativeRNTheoremReachSpec(reactContext),
  LifecycleEventListener,
  TheoremReachRewardListener,
  TheoremReachSurveyListener,
  TheoremReachSurveyAvailableListener {

  private var started = false
  // JS heard the reward center open and hasn't heard it close. The SDK reports an open for every show, but a show
  // while the reward center is open replaces it, and only the newer one reports its close, so JS hears one open for
  // each close. The SDK calls both on the main thread.
  private var rewardCenterOpen = false

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun startWithApiKey(apiKey: String, userId: String) {
    UiThreadUtil.runOnUiThread {
      val activity = reactApplicationContext.currentActivity
      TheoremReach.initWithApiKeyAndUserIdAndActivityContext(apiKey, userId, activity)
      // The host's resume came before this call, so the SDK learns its activity here.
      TheoremReach.getInstance().onResume(activity)
      started = true

      TheoremReach.getInstance().setTheoremReachRewardListener(this)
      TheoremReach.getInstance().setTheoremReachSurveyListener(this)
      TheoremReach.getInstance().setTheoremReachSurveyAvailableListener(this)
    }
  }

  // The placement goes with every show, empty when there's none (the SDK leaves an empty one out of the URL): the SDK
  // clears it only when its reward center closes, so one destroyed from outside would hand its placement to the next.
  override fun showRewardCenter(placementId: String?) {
    UiThreadUtil.runOnUiThread { TheoremReach.getInstance().showRewardCenter(placementId.orEmpty()) }
  }

  override fun isSurveyAvailable(promise: Promise) {
    UiThreadUtil.runOnUiThread { promise.resolve(TheoremReach.getInstance().getIsSurveyAvailable()) }
  }

  override fun setLoadingBarColor(color: String) {
    UiThreadUtil.runOnUiThread { TheoremReach.getInstance().setLoadingBarColor(color) }
  }

  override fun setMmpInstallId(provider: String, installId: String) {
    UiThreadUtil.runOnUiThread { TheoremReach.getInstance().setMmpInstallId(provider, installId) }
  }

  override fun setNavigationBarText(text: String) {
    UiThreadUtil.runOnUiThread { TheoremReach.getInstance().setNavigationBarText(text) }
  }

  override fun setNavigationBarColor(color: String) {
    UiThreadUtil.runOnUiThread { TheoremReach.getInstance().setNavigationBarColor(color) }
  }

  override fun setNavigationBarTextColor(color: String) {
    UiThreadUtil.runOnUiThread { TheoremReach.getInstance().setNavigationBarTextColor(color) }
  }

  // NativeEventEmitter calls these; the JS side keeps the listeners.
  override fun addListener(eventName: String) {}

  override fun removeListeners(count: Double) {}

  override fun onReward(quantity: Int) = emit("TheoremReachReward", quantity)

  override fun onRewardCenterOpened() {
    if (rewardCenterOpen) return
    rewardCenterOpen = true
    emit("TheoremReachRewardCenterOpened", null)
  }

  override fun onRewardCenterClosed() {
    rewardCenterOpen = false
    emit("TheoremReachRewardCenterClosed", null)
  }

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
