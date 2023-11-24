import { Router } from '@angular/router';
import { SdkProvider } from 'src/app/providers/sdk.provider';
import { Component } from '@angular/core';
import { EHeaderType } from "src/app/enums/headerType.enum";
import { ESdkStatus } from "src/app/enums/sdkStatus.enum";

@Component({
    selector: 'main',
    templateUrl: './main.page.html',
    styleUrls: ['./main.page.scss']
})
export class MainPage {
    ESdkStatus = ESdkStatus;
    headerType = EHeaderType.STATUS;
    sdk = this.sdkProvider;

    constructor(
        private sdkProvider: SdkProvider,
        private router: Router
    ) { }

    clickedFlow(flow: string): void {
        this.sdkProvider.resetCredentials();
        this.router.navigate([flow])
    }
}
