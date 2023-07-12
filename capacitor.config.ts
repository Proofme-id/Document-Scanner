import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'id.proofme.sdk.example',
    appName: 'Proofme Example',
    webDir: 'dist/sdk-example',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        EpassReader: {
            android: {
                src: "./node_modules/@proofme-id/web/reader/android"
            },
            ios: {
                src: "./node_modules/@proofme-id/web/reader/ios"
            }
        }
    }
};

export default config;
