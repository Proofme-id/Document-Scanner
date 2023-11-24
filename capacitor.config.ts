import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
    appId: 'id.proofme.document.scanner',
    appName: 'Document Scanner by Proofme',
    webDir: 'dist/document-scanner',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        Keyboard: {
            resize: KeyboardResize.None
        },
        SplashScreen: {
            layoutName: "splash_screen",
            launchAutoHide: false,
            useDialog: true
        }
    }
};

export default config;
