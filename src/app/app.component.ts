import { Component, HostListener, NgZone, OnDestroy, OnInit } from "@angular/core";
import { PluginListenerHandle } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { TextZoom } from "@capacitor/text-zoom";
import { Platform } from "@ionic/angular";
import { SafeArea } from "capacitor-plugin-safe-area";
import { DeviceDetectorService } from "ngx-device-detector";

@Component({
    selector: "app-root",
    templateUrl: "app.component.html",
    styleUrls: ["app.component.scss"]
})
export class AppComponent implements OnInit, OnDestroy {
    @HostListener("window:resize", ["$event.target.outerWidth"])
    onResize(width: number): void {
        this.determineFontSize(width);
    }

    addKeyBoardListener: PluginListenerHandle;
    hideKeyboardListener: PluginListenerHandle;
    showKeyboard: boolean;

    constructor(
        private platform: Platform,
        private deviceDetectorService: DeviceDetectorService,
        private ngZone: NgZone
    ) {
        const width = window.innerWidth;
        this.determineFontSize(width);
    }

    async ngOnInit(): Promise<void> {
        TextZoom.set({ value: 1.0 });
        await this.platform.ready();

        this.addSafeAreaVariables();
        setTimeout(() => {
            SplashScreen.hide();
        }, 250);

        await this.setKeyboardListeners();
    }

    ngOnDestroy(): void {
        if (this.addKeyBoardListener || this.hideKeyboardListener) {
            Keyboard.removeAllListeners()
        }
    }

    async setKeyboardListeners() {
        this.addKeyBoardListener = await Keyboard.addListener('keyboardDidShow', info => {
            this.ngZone.run(() => {
                this.showKeyboard = true;
            })
            document.documentElement.style.setProperty(
                "--keyboard-height",
                info.keyboardHeight.toString() + "px"
            );
        });

        this.hideKeyboardListener = await Keyboard.addListener('keyboardDidHide', () => {
            this.ngZone.run(() => {
                this.showKeyboard = false;
            })
            document.documentElement.style.setProperty(
                "--keyboard-height",
                "0"
            );
        });
    }

    /**
     * Determines the font size based on the width of the screen by dividing it with the fullHdWidth.
     * Once the font size is determined it is set on the root element so it can be used by rem.
     * @param {number} width
     * @Returns void
     */
    determineFontSize(width: number): void {
        const orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
        // Base fontsize & width for desktop.
        // Normally baseFontSize would be 16 but we collectively decided a while ago that for the my-page and dashboard its 14.
        // Since this is the app, it is basefontsize 16.
        const baseFontSize = 16;
        let fullWidth = 1920;

        // We need to use a different width
        // There simply just is not a way to have a formula according to desktop width (1920)
        // That also works for Tablets and mobile devices. Unless we introduce a random multiplier like we did before.
        if (this.deviceDetectorService.isMobile()) {
            const defaultMobileLandscapeWidth = 915;
            const defaultMobilePortraitWidth = 412;

            // We dont lower the fontsize here.
            if (orientation === "landscape") {
                fullWidth = defaultMobileLandscapeWidth
            } else {
                fullWidth = defaultMobilePortraitWidth
            }
        } else if (this.deviceDetectorService.isTablet()) {
            const defaultTabletLandscapeWidth = 1280;
            const defaultTabletPortraitWidth = 768;

            // For tablet's we do not change the baseFontSize.
            // Only the orientation width.
            if (orientation === "landscape") {
                fullWidth = defaultTabletLandscapeWidth
            } else {
                fullWidth = defaultTabletPortraitWidth
            }
        }

        const fontsize = (width / fullWidth * baseFontSize);
        document.documentElement.style.setProperty("font-size", `${fontsize.toFixed(3)}px`);
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
}
