Pod::Spec.new do |spec|
  spec.name             = 'RNTheoremReach'
  spec.version          = '3.6.3'
  spec.summary          = 'Monetize your users through rewarded surveys!'
  spec.homepage         = 'https://theoremreach.com'
  spec.platform         = :ios, "9.0"
  spec.license          = { :type => 'MIT' }
  spec.authors          = { 'Andy Keller' => 'andy@theoremreach.com' }
  spec.source           = { :git => 'https://github.com/TheoremReach/ReactNativeSDK.git', :tag => 'master' }
  spec.source_files     = 'ios/**/*.{h,m,mm}'
  spec.requires_arc     = true
  
  spec.dependency 'React'
  spec.dependency 'TheoremReach', '3.5.3'
end
