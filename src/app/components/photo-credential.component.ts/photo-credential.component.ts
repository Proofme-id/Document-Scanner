import { SdkProvider } from 'src/app/providers/sdk.provider';
import { IDocumentCredentials } from '@proofme-id/sdk/web/reader/interfaces';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'photo-credential',
    templateUrl: './photo-credential.component.html',
    styleUrls: ['./photo-credential.component.scss']
})
export class PhotoCredentialComponent {
    sdk = this.sdkProvider;
    imageIndex: number;

    constructor(
        private sdkProvider: SdkProvider
    ) {}
}
