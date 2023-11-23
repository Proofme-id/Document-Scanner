import { Router } from '@angular/router';
import { SdkProvider } from 'src/app/providers/sdk.provider';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { StatusBar, Style } from "@capacitor/status-bar";
import { Platform } from "@ionic/angular";
import { SafeArea } from "capacitor-plugin-safe-area";
import { EHeaderType } from "src/app/enums/headerType.enum";
import { ESdkStatus } from "src/app/enums/sdkStatus.enum";

@Component({
    selector: 'main',
    templateUrl: './main.page.html',
    styleUrls: ['./main.page.scss']
})
export class MainPage implements OnInit {
    ESdkStatus = ESdkStatus;
    headerType = EHeaderType.STATUS;
    sdk = this.sdkProvider;

    constructor(
        private platform: Platform,
        private sdkProvider: SdkProvider,
        private router: Router
    ) { }

    async ngOnInit(): Promise<void> {
        StatusBar.setStyle({ style: Style.Dark });
        this.addSafeAreaVariables();
    }

    async addSafeAreaVariables(): Promise<void> {
        try {
            if (this.platform.is("android")) {
                const safeAreaTop = `${(await SafeArea.getStatusBarHeight()).statusBarHeight}px`;
                document.documentElement.style.setProperty(
                    "--safe-area-inset-top",
                    safeAreaTop
                );
            }
        } catch (error) {
            console.error("Safe area error:", error);
        }
    }

    clickedFlow(flow: string): void {
        this.router.navigate([flow])
        this.sdkProvider.resetCredentials();
    }
}
