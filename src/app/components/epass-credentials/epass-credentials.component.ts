import { SdkProvider } from 'src/app/providers/sdk.provider';
import { IDocumentCredentials } from '@proofme-id/sdk/web/reader/interfaces';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'epass-credentials',
    templateUrl: './epass-credentials.component.html',
    styleUrls: ['./epass-credentials.component.scss']
})
export class EpassCredentialComponent {
    @Input() credentials_: IDocumentCredentials;
    sdk = this.sdkProvider;

    constructor(
        private sdkProvider: SdkProvider
    ) {}
}
