import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.proofme.example',
  appName: 'Proofme Example',
  webDir: 'dist/sdk-example',
  server: {
    androidScheme: 'https'
  }
};

export default config;
