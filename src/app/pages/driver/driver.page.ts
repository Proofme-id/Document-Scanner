import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { EDataGroup } from '@proofme-id/sdk/web/reader/enums';
import { EHeaderType } from 'src/app/enums/headerType.enum';
import { ESettingsType } from 'src/app/enums/settingsType.enum';
import { SdkProvider } from 'src/app/providers/sdk.provider';
import { EImageType } from 'src/app/enums/imageType.enum';
import { EDetectionType } from "src/app/enums/detectionType.enum";
import { EDocumentType } from "@proofme-id/sdk/web/enums/documentType.enum";

@Component({
    selector: 'driver',
    templateUrl: './driver.page.html',
    styleUrls: ['./driver.page.scss']
})
export class DriverPage implements OnInit {
    EHeaderType = EHeaderType;
    EImageType = EImageType;
    settingsType = ESettingsType.DRIVER;
    headerType = EHeaderType.SETTINGS;
    sdk = this.sdkProvider;
    showSettings = false;
    imageIndex: number;
    detectionType: EDetectionType;
    documentType: EDocumentType;


    constructor(
        private sdkProvider: SdkProvider,
        private router: Router,
        private route: ActivatedRoute
    ) { 
        this.route.queryParams.subscribe((queryParams) => {
            this.detectionType = queryParams["detectionType"];
            this.documentType = queryParams["documentType"];
        });
    }

    ngOnInit(): void {
        this.sdkProvider.settingsDataGroups = [
            EDataGroup.DG1,
            EDataGroup.DG5,
            EDataGroup.DG6,
            EDataGroup.DG11,
            EDataGroup.DG12
        ]
    }

    clickedBack(): void {
        this.router.navigate(["document-selector"], {
            queryParams: {
                detectionType: this.detectionType,
                documentType: this.documentType
            }
        });
    }

    async scanMrz(): Promise<void> {
        await this.sdkProvider.openMrzScanner(true);

        if (this.sdk.credentials) {
            this.headerType = EHeaderType.RETURN;
        }
    }

    async readNfc(): Promise<void> {
        await this.sdkProvider.readNfc();
    }

    async stopReadNfc(): Promise<void> {
        await this.sdkProvider.stopReadNfc();
    }

    substring(text: string, start: number, end: number) {
        return text.substring(start, end)
    }
}
