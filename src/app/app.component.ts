import { Component, NgZone } from '@angular/core';
import { Toast } from '@capacitor/toast';
import { EpassReader, JP2Decoder, PassphotoScanner, Configuration } from "@proofme-id/sdk/web/reader";
import { EDataGroup } from "@proofme-id/sdk/web/reader/enums";
import { ReaderHelper } from "@proofme-id/sdk/web/reader/helpers";
import {
    IMrzCredentials,
    INfcResult,
    IPassportNfcProgressErrorEvent,
    IPassportNfcProgressEvent,
    IScanOptions
} from "@proofme-id/sdk/web/reader/interfaces";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    readonly TEST_JWT = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaWQiOiJ0ZXN0OjB4MjRBNDFlREVENDRCMDdBYzBBNTYyMzJkMjE1NURiOGQ5Mzk2NjY1NCIsInZlcnNpb24iOiIxLjAuMCIsInNjb3BlIjpbIk5GQyIsIk1SWiIsIkxJVkVORVNTIl0sImlhdCI6MTY4OTE1ODk2MSwiZXhwIjoxNzIwNzgxMzYxLCJhdWQiOiJTREsgTGljZW5zZSJ9.M44xHpLNXOA18rEjeEpnv3ykL_he6aiT42QcbopaLN8hEgKFWa-4qW42Y2rlt0GKOR4b31tGJqKxAvfhL8H2aSoatHUstKZAbYSMo04q2tc7uXlrq8lPuzLO5jkJkcPPZXngFG39E8aAOxkYEOP7mEibC17le9PdakX3WeEW3EIk4EKwPb-cERTewsEDrDfZVHcX7fFHrNyYtU-x3BS-JYPxHo3ATH-I3xMSCPScYMgrtHHL9rj3r3Aj8h1Qu1kiwEaG6NHb0hmaf_SnLJLyGHdwSfZjX9b4JNlsfJ6TfLwkWnEkzquuRgd9vAfxTiqjNEP9KWJGVO8_qtCqEiBgx-4_8aA-jb84BVX6Ds3nK_HuO91DS7N4ojhyG9sMS1_nWkcOErXmPZfl46YbIoh1-xhs09dMJXZoVI17hdmry8585bZOgjCeSjvuImVVy2UqHO7FLCs7qaE316ypbjYKqgYgKs5ta-KA8Ul7q1_qkcej-ncjMr5vaEXEyAZO00y7sWyfYF7H6K6fiEZ-s-QO2ajk7aSvcGAVBI0W_-102eYAjhm1EnRh8QhSnSLsfgvgE1OB-qbNtuZFDSAEkCT9ZjEzoM3ePbMQDChe7ccmAnR3xAETzy_7ie5rq4oSJ5ipREtFAkA_TDjbM2U07q0kYBCPpv5G8lo_bX_jsQdk55A";
    readonly TOAST_DURATION_IN_MS = 3500;

    iosMrzInvalidReference = this.iosMrzInvalidError.bind(this);
    onPassportReadErrorReference = this.onPassportReadError.bind(this);
    onPassportReadNfcProgressReference = this.onPassportNfcProgress.bind(this);

    mrzCredentials: IMrzCredentials;
    nfcEnabled = false;
    progress = 0;
    datagroups: INfcResult;
    readerHelper = new ReaderHelper();
    passportPhoto: string;

    initialized = false;
    verified = false;

    toastTimeout: NodeJS.Timeout;
    previousToast = "";

    constructor(
        private ngZone: NgZone
    ) { }

    async ngOnDestroy(): Promise<void> {
        this.removeNfcListeners();
        await EpassReader.stopNfc();
    }

    async initializeSdk(): Promise<void> {
        if (this.initialized) {
            await this.showToast("SDK already initialized");
            return;
        }

        try {
            const result = await Configuration.initialize({ jwt: this.TEST_JWT });

            if (result) {
                this.initialized = true;
            }
        } catch (error) {
            console.error(error);
            await this.showToast("Failed to initialize SDK");
        }
    }

    async mrz(): Promise<void> {
        if (!this.initialized) {
            await this.showToast("SDK not initialized");
            return;
        }

        try {
            this.mrzCredentials = await EpassReader.scanMrz();
            this.verified = false;
            this.passportPhoto = "";

            console.log("MRZ credentials:", this.mrzCredentials);
        } catch (error) {
            console.error(error);
            await this.showToast("Failed to scan MRZ");
        }
    }

    async nfc(): Promise<void> {
        if (!this.initialized) {
            await this.showToast("SDK not initialized");
            return;
        } else if (!this.mrzCredentials) {
            await this.showToast("Scan MRZ first");
            return;
        }

        try {
            this.progress = 0;
            this.datagroups = null;
            this.nfcEnabled = true;
            this.passportPhoto = "";
            this.addNfcListeners();

            const scanOptions: IScanOptions = {
                documentNumber: this.mrzCredentials.documentNumber,
                birthDate: this.mrzCredentials.birthDate,
                expiryDate: this.mrzCredentials.expiryDate,
                dataGroups: [EDataGroup.DG1, EDataGroup.DG2]
            }
            this.datagroups = await EpassReader.scanNfc(scanOptions);
            delete this.datagroups.success;

            const dg1Data = this.readerHelper.extractMRZFromDG1(new Uint8Array(this.datagroups.DG1));
            const base64jp2 = this.readerHelper.extractImageFromDG2(new Uint8Array(this.datagroups.DG2));

            console.log("Basic information:", dg1Data.fields);
            console.log("AppComponent - base64jp2:", base64jp2);

            this.mrzCredentials.documentNumber = dg1Data.fields["documentNumber"];
            this.mrzCredentials.birthDate = dg1Data.fields["birthDate"];
            this.mrzCredentials.expiryDate = dg1Data.fields["expirationDate"];
            this.mrzCredentials.gender = dg1Data.fields["sex"];
            this.mrzCredentials.documentType = dg1Data.fields["documentCode"];
            this.mrzCredentials.firstNames = dg1Data.fields["firstName"];
            this.mrzCredentials.lastName = dg1Data.fields["lastName"];
            try {
                const imageObject = await JP2Decoder.convertJP2toJPEG({ image: base64jp2 });
                this.passportPhoto = imageObject.image;
            } catch (error) {
                console.error(error);
                await this.showToast("Could not parse jp2 image")
                this.passportPhoto = "";
            }

            this.verified = true;
            console.log("Document image:", this.passportPhoto);
        } catch (error) {
            console.error(error);
            await this.showToast("Failed to scan NFC");
        }

        this.removeNfcListeners();
        this.nfcEnabled = false;
    }

    async passphoto(): Promise<void> {
        if (!this.initialized) {
            await this.showToast("SDK not initialized");
            return;
        }

        try {
            this.passportPhoto = (await PassphotoScanner.scan()).face;
        } catch (error) {
            console.error(error);
            this.showToast(error);
        }
    }

    /**
     * Gets called everytime the NFC progresses to the next step
     * @param event
     */
    onPassportNfcProgress(event: IPassportNfcProgressEvent): void {
        const nfcStep = event.step;
        const nfcTotalSteps = 7;
        this.ngZone.run(() => {
            this.progress = parseInt(((nfcStep / nfcTotalSteps) * 100).toFixed(0));
        });
    }

    /**
     * Gets called whenever there is an error reading the document
     * @param event
     */
    onPassportReadError(event: IPassportNfcProgressErrorEvent): void {
        console.error("onPassportReadError event:", event);
        // this.nfcEnabled = false;
        // When the MRZ is faulty
        if (event.error === "ConnectionLost") {
            console.error("Connection lost");
        } else if (event.exception?.includes("onPACEException") && event.message?.includes("SW = 0x6300: Unknown")) {
            console.error("Incorrect MRZ credentials for NFC chip");
        }
    }

    /**
     * Gets called whenever the MRZ is invalid for specifically ios (android mrz error is handled inside onPassportReadError)
     */
    async iosMrzInvalidError(): Promise<void> {
        this.nfcEnabled = false;
        await EpassReader.stopNfc();
    }

    addNfcListeners(): void {
        window.addEventListener("iosMrzInvalid", this.iosMrzInvalidReference);
        window.addEventListener("onPassportReadError", this.onPassportReadErrorReference);
        window.addEventListener("onPassportNfcProgress", this.onPassportReadNfcProgressReference);
    }

    removeNfcListeners(): void {
        window.removeEventListener("iosMrzInvalid", this.iosMrzInvalidReference);
        window.removeEventListener("onPassportReadError", this.onPassportReadErrorReference);
        window.removeEventListener("onPassportNfcProgress", this.onPassportReadNfcProgressReference);
    }

    async showToast(text: string): Promise<void> {
        if (this.previousToast === text) {
            return;
        }

        await Toast.show({
            text,
            duration: "long",
            position: "center"
        });

        this.previousToast = text;
        clearTimeout(this.toastTimeout);

        this.toastTimeout = setTimeout(() => {
            this.previousToast = "";
        }, this.TOAST_DURATION_IN_MS);
    }
}
