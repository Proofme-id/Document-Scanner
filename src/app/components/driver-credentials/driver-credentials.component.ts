import { SdkProvider } from 'src/app/providers/sdk.provider';
import { IDocumentCredentials } from '@proofme-id/sdk/web/reader/interfaces';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'driver-credentials',
    templateUrl: './driver-credentials.component.html',
    styleUrls: ['./driver-credentials.component.scss']
})
export class DriverCredentialComponent {
    @Input() credentials_: IDocumentCredentials;
    sdk = this.sdkProvider;

    constructor(
        private sdkProvider: SdkProvider
    ) {}
}
