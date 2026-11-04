require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RNTheoremReach"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = { :type => "Commercial", :file => "LICENSE" }
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/TheoremReach/ReactNativeSDK.git", :tag => s.version.to_s }

  # Only the module's own files: the SDK's headers ship inside its framework.
  s.source_files = "ios/*.{h,m,mm}"
  s.private_header_files = "ios/*.h"

  # The TheoremReach iOS SDK, bundled from TheoremReach/iOSSDK's release tag, since CocoaPods trunk takes no new
  # versions (CI checks it against the tag). The system frameworks are the ones it links.
  s.vendored_frameworks = "ios/Frameworks/TheoremReachSDK.xcframework"
  s.frameworks = "AdSupport", "CoreTelephony", "JavaScriptCore", "Security", "SystemConfiguration", "UIKit", "WebKit"

  install_modules_dependencies(s)
end
