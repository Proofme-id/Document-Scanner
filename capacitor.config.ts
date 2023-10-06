import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'id.proofme.document.scanner',
    appName: 'Document Scanner by Proofme',
    webDir: 'dist/document-scanner',
    server: {
        androidScheme: 'https'
    }
};

export default config;
