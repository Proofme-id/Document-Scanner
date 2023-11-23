import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EDataGroup } from '@proofme-id/sdk/web/reader/enums';
import { EHeaderType } from 'src/app/enums/headerType.enum';
import { EImageType } from 'src/app/enums/imageType.enum';
import { ESettingsType } from 'src/app/enums/settingsType.enum';
import { SdkProvider } from 'src/app/providers/sdk.provider';

@Component({
    selector: 'document',
    templateUrl: './document.page.html',
    styleUrls: ['./document.page.scss']
})
export class DocumentPage {
    EHeaderType = EHeaderType;
    EImageType = EImageType;
    settingsType = ESettingsType.DOCUMENT;
    headerType = EHeaderType.SETTINGS;
    sdk = this.sdkProvider;
    showSettings = false;
    imageIndex: number;

    constructor(
        private sdkProvider: SdkProvider,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.sdkProvider.settingsDataGroups = [
            EDataGroup.DG1,
            EDataGroup.DG2
        ]
    }

    clickedBack(): void {
        this.router.navigate(["home"]);
    }

    async detectDocument(): Promise<void> {
        await this.sdkProvider.detectDocument();
        if (this.sdk.credentials || this.sdk.images.length > 0) {
            this.headerType = EHeaderType.RETURN;
        }
    }

    async readNfc(): Promise<void> {
        await this.sdkProvider.readNfc();
    }

    async stopReadNfc(): Promise<void> {
        await this.sdkProvider.stopReadNfc();
    }
}
