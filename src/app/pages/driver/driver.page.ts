import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { EDataGroup } from '@proofme-id/sdk/web/reader/enums';
import { EHeaderType } from 'src/app/enums/headerType.enum';
import { ESettingsType } from 'src/app/enums/settingsType.enum';
import { SdkProvider } from 'src/app/providers/sdk.provider';
import { EImageType } from 'src/app/enums/imageType.enum';

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

    constructor(
        private sdkProvider: SdkProvider,
        private router: Router
    ) { }

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
        this.router.navigate(["home"]);
    }

    async scanMrz(): Promise<void> {
        await this.sdkProvider.openMrzScanner(true);

        if (this.sdk.mrzCredentials) {
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
