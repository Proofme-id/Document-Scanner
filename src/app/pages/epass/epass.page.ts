import { ActivatedRoute, Router } from '@angular/router';
import { ESettingsType } from './../../enums/settingsType.enum';
import { Component, OnInit } from '@angular/core';
import { EHeaderType } from 'src/app/enums/headerType.enum';
import { SdkProvider } from 'src/app/providers/sdk.provider';
import { EImageType } from 'src/app/enums/imageType.enum';
import { EDataGroup } from '@proofme-id/sdk/web/reader/enums';
import { EDetectionType } from "src/app/enums/detectionType.enum";
import { EDocumentType } from "@proofme-id/sdk/web/enums/documentType.enum";

@Component({
    selector: 'epass',
    templateUrl: './epass.page.html',
    styleUrls: ['./epass.page.scss']
})
export class EpassPage implements OnInit {
    EHeaderType = EHeaderType;
    EImageType = EImageType;
    EDocumentType = EDocumentType;
    settingsType = ESettingsType.EPASS;
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
            EDataGroup.DG2
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
        await this.sdkProvider.openMrzScanner();

        if (this.sdk.credentials) {
            this.headerType = EHeaderType.RETURN;
        }
    }

    async detectFace(): Promise<void> {
        await this.sdkProvider.detectFace();
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
