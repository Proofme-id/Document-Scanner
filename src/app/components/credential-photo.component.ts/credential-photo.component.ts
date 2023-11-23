import { SdkProvider } from 'src/app/providers/sdk.provider';
import { IMrzCredentials } from '@proofme-id/sdk/web/reader/interfaces';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'credential-photo',
    templateUrl: './credential-photo.component.html',
    styleUrls: ['./credential-photo.component.scss']
})
export class CredentialPhotoComponent {
    sdk = this.sdkProvider;
    imageIndex: number;

    constructor(
        private sdkProvider: SdkProvider
    ) {}
}
