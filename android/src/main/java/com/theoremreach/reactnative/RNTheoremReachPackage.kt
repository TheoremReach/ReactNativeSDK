package com.theoremreach.reactnative

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class RNTheoremReachPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == RNTheoremReachModule.NAME) {
      RNTheoremReachModule(reactContext)
    } else {
      null
    }
  }

  // Positional arguments: React Native 0.76 names this constructor's parameters differently (_name, _className, ...),
  // so named ones compile only on later versions.
  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      RNTheoremReachModule.NAME to ReactModuleInfo(
        RNTheoremReachModule.NAME, // name
        RNTheoremReachModule.NAME, // className
        false, // canOverrideExistingModule
        false, // needsEagerInit
        false, // isCxxModule
        true // isTurboModule
      )
    )
  }
}
