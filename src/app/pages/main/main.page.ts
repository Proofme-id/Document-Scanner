import { Router } from '@angular/router';
import { SdkProvider } from 'src/app/providers/sdk.provider';
import { Component } from '@angular/core';
import { EHeaderType } from "src/app/enums/headerType.enum";
import { ESdkStatus } from "src/app/enums/sdkStatus.enum";
import { EDetectionType } from "src/app/enums/detectionType.enum";

@Component({
    selector: 'main',
    templateUrl: './main.page.html',
    styleUrls: ['./main.page.scss']
})
export class MainPage {
    ESdkStatus = ESdkStatus;
    headerType = EHeaderType.STATUS;
    sdk = this.sdkProvider;
    EDetectionType = EDetectionType

    constructor(
        private sdkProvider: SdkProvider,
        private router: Router
    ) { }

    clickedType(detectionType: EDetectionType): void {
        this.sdkProvider.resetCredentials();
        this.router.navigate(["/document-selector"], {
            queryParams: {
                detectionType
            }
        })
    }
}
