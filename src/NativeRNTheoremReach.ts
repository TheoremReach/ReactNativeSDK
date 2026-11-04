import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  // Not initWithApiKeyAndUserId: an Objective-C method whose name starts with "init" is in ARC's init family, which
  // must return an object. index.tsx keeps the public name.
  startWithApiKey(apiKey: string, userId: string): void;
  showRewardCenter(placementId: string | null): void;
  isSurveyAvailable(): Promise<boolean>;
  setLoadingBarColor(color: string): void;
  setMmpInstallId(provider: string, installId: string): void;
  setNavigationBarText(text: string): void;
  setNavigationBarColor(color: string): void;
  setNavigationBarTextColor(color: string): void;

  // NativeEventEmitter's listener bookkeeping.
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNTheoremReach');
