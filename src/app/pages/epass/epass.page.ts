import { Router } from '@angular/router';
import { ESettingsType } from './../../enums/settingsType.enum';
import { Component, OnInit } from '@angular/core';
import { EHeaderType } from 'src/app/enums/headerType.enum';
import { SdkProvider } from 'src/app/providers/sdk.provider';
import { EImageType } from 'src/app/enums/imageType.enum';
import { EDataGroup } from '@proofme-id/sdk/web/reader/enums';

@Component({
    selector: 'epass',
    templateUrl: './epass.page.html',
    styleUrls: ['./epass.page.scss']
})
export class EpassPage implements OnInit {
    EHeaderType = EHeaderType;
    EImageType = EImageType;
    settingsType = ESettingsType.EPASS;
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

    async scanMrz(): Promise<void> {
        await this.sdkProvider.openMrzScanner();

        if (this.sdk.mrzCredentials) {
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
