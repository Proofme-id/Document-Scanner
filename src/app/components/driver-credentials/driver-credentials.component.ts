import { SdkProvider } from 'src/app/providers/sdk.provider';
import { IMrzCredentials } from '@proofme-id/sdk/web/reader/interfaces';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'driver-credentials',
    templateUrl: './driver-credentials.component.html',
    styleUrls: ['./driver-credentials.component.scss']
})
export class DriverCredentialComponent {
    @Input() credentials_: IMrzCredentials;
    sdk = this.sdkProvider;

    constructor(
        private sdkProvider: SdkProvider
    ) {}

    substring(text: string, start: number, end: number) {
        return text.substring(start, end)
    }
}
