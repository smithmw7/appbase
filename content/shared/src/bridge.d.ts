export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';
export interface AppInfo {
    version: string;
    build: number;
}
export interface Entitlements {
    removeAds: boolean;
}
export interface NativeBridge {
    getAppInfo(): Promise<AppInfo>;
    getEntitlements(): Promise<Entitlements>;
    showInterstitialAd(): Promise<boolean>;
    haptic(type: HapticType): void;
    playSound(id: string): void;
    analytics(event: string, params?: Record<string, any>): void;
    debug?: {
        setGameState(state: unknown): void;
        resetLocalData(): void;
        forceContentRefresh(): void;
    };
}
export declare const bridge: NativeBridge;
//# sourceMappingURL=bridge.d.ts.map