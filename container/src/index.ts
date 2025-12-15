/**
 * Container entry point
 * Registers all custom Capacitor plugins
 */

import { registerPlugin } from '@capacitor/core';

// GameBridge plugin will be registered here
// The actual registration happens in the iOS native code

export * from './plugins/GameBridge/definitions';
