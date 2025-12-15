class BridgeImpl {
    getPlugin() {
        return window.Capacitor?.Plugins?.GameBridge;
    }
    async getAppInfo() {
        const plugin = this.getPlugin();
        if (!plugin) {
            throw new Error('GameBridge plugin not available');
        }
        return await plugin.getAppInfo();
    }
    async getEntitlements() {
        const plugin = this.getPlugin();
        if (!plugin) {
            throw new Error('GameBridge plugin not available');
        }
        return await plugin.getEntitlements();
    }
    async showInterstitialAd() {
        const plugin = this.getPlugin();
        if (!plugin) {
            return false;
        }
        try {
            return await plugin.showInterstitialAd();
        }
        catch (error) {
            console.error('Failed to show ad:', error);
            return false;
        }
    }
    haptic(type) {
        const plugin = this.getPlugin();
        if (!plugin) {
            return;
        }
        try {
            plugin.haptic({ type });
        }
        catch (error) {
            console.error('Failed to trigger haptic:', error);
        }
    }
    playSound(id) {
        const plugin = this.getPlugin();
        if (!plugin) {
            return;
        }
        try {
            plugin.playSound({ id });
        }
        catch (error) {
            console.error('Failed to play sound:', error);
        }
    }
    analytics(event, params) {
        const plugin = this.getPlugin();
        if (!plugin) {
            return;
        }
        try {
            plugin.analytics({ event, params: params || {} });
        }
        catch (error) {
            console.error('Failed to log analytics:', error);
        }
    }
    get debug() {
        const plugin = this.getPlugin();
        if (!plugin || !plugin.debug) {
            return undefined;
        }
        return {
            setGameState: (state) => {
                try {
                    plugin.debug.setGameState({ state });
                }
                catch (error) {
                    console.error('Failed to set game state:', error);
                }
            },
            resetLocalData: () => {
                try {
                    plugin.debug.resetLocalData();
                }
                catch (error) {
                    console.error('Failed to reset local data:', error);
                }
            },
            forceContentRefresh: () => {
                try {
                    plugin.debug.forceContentRefresh();
                }
                catch (error) {
                    console.error('Failed to force content refresh:', error);
                }
            },
        };
    }
}
export const bridge = new BridgeImpl();
//# sourceMappingURL=bridge.js.map