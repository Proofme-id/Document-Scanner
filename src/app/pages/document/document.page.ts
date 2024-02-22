import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EDataGroup } from '@proofme-id/sdk/web/reader/enums';
import { EDetectionType } from "src/app/enums/detectionType.enum";
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
    detectionType: EDetectionType

    constructor(
        private sdkProvider: SdkProvider,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.route.queryParams.subscribe((queryParams) => {
            this.detectionType = queryParams["detectionType"];
        });
    }

    ngOnInit(): void {
        this.sdkProvider.settingsDataGroups = [
            EDataGroup.DG1,
            EDataGroup.DG2
        ];
    }

    clickedBack(): void {
        this.router.navigate(["document-selector"], {
            queryParams: {
                detectionType: this.detectionType
            }
        });
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
