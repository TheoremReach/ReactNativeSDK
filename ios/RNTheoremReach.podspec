
Pod::Spec.new do |s|
  s.name         = "RNTheoremReach"
  s.version      = "1.0.0"
  s.summary      = "RNTheoremReach"
  s.description  = <<-DESC
                  RNTheoremReach
                   DESC
  s.homepage     = ""
  s.license      = "MIT"
  # s.license      = { :type => "MIT", :file => "FILE_LICENSE" }
  s.author             = { "author" => "author@domain.cn" }
  s.platform     = :ios, "7.0"
  s.source       = { :git => "https://github.com/author/RNTheoremReach.git", :tag => "master" }
  s.source_files  = "RNTheoremReach/**/*.{h,m}"
  s.requires_arc = true


  s.dependency "React"
  #s.dependency "others"

end

  