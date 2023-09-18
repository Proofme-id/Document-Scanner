import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
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
import { environment } from "../environments/environment";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    readonly TOAST_DURATION_IN_MS = 3500;

    iosMrzInvalidReference = this.iosMrzInvalidError.bind(this);
    onPassportReadErrorReference = this.onPassportReadError.bind(this);
    onPassportReadNfcProgressReference = this.onPassportNfcProgress.bind(this);

    mrzCredentials: IMrzCredentials;
    nfcEnabled = false;
    progress = 0;
    datagroups: INfcResult;
    readerHelper = new ReaderHelper();

    initialized = false;
    verified = false;

    toastTimeout: NodeJS.Timeout;
    previousToast = "";

    images = [];
    imageIndex = 0;

    constructor(
        private ngZone: NgZone
    ) { }

    async ngOnInit(): Promise<void> {
        await this.initializeSdk();
    }

    async ngOnDestroy(): Promise<void> {
        this.removeNfcListeners();
        await EpassReader.stopNfc();
    }

    async initializeSdk(): Promise<void> {
        if (this.initialized) {
            return await this.showToast("SDK already initialized");
        }

        try {
            const result = await Configuration.initialize({ jwt: environment.license });

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
            return await this.showToast("SDK not initialized");
        }

        try {
            this.resetCredentials();
            this.mrzCredentials = await EpassReader.scanMrz({ closeText: "Close" });

            console.log("MRZ credentials:", this.mrzCredentials);
        } catch (error) {
            console.error(error);
            await this.showToast("Failed to scan MRZ");
        }
    }

    async nfc(): Promise<void> {
        if (!this.initialized) {
            return await this.showToast("SDK not initialized");
        } else if (!this.mrzCredentials) {
            return await this.showToast("Scan MRZ first");
        }

        try {
            this.progress = 0;
            this.datagroups = null;
            this.nfcEnabled = true;
            this.addNfcListeners();

            const scanOptions: IScanOptions = {
                documentNumber: this.mrzCredentials.documentNumber,
                birthDate: this.mrzCredentials.birthDateDigits,
                expiryDate: this.mrzCredentials.expiryDateDigits,
                dataGroups: [EDataGroup.DG1, EDataGroup.DG2]
            }
            this.datagroups = await EpassReader.scanNfc(scanOptions);
            if (this.datagroups) {
                delete this.datagroups.success;

                const dg1Data = this.readerHelper.extractMRZFromDG1(new Uint8Array(this.datagroups.DG1));
                const base64jp2 = this.readerHelper.extractImageFromDG2(new Uint8Array(this.datagroups.DG2));

                console.log("Basic information:", dg1Data.fields);
                console.log("AppComponent - base64jp2:", base64jp2);

                this.mrzCredentials.documentNumber = dg1Data.fields["documentNumber"];
                this.mrzCredentials.gender = dg1Data.fields["sex"];
                this.mrzCredentials.documentType = dg1Data.fields["documentCode"];
                this.mrzCredentials.firstNames = dg1Data.fields["firstName"];
                this.mrzCredentials.lastName = dg1Data.fields["lastName"];
                this.mrzCredentials.nationality = dg1Data.fields["nationality"];
                this.mrzCredentials.issuer = dg1Data.fields["issuingState"];

                try {
                    const imageObject = await JP2Decoder.convertJP2toJPEG({ image: base64jp2 });
                    this.images.unshift(imageObject.image);
                } catch (error) {
                    console.error(error);
                    await this.showToast("Could not parse jp2 image")
                }

                this.verified = true;
            }
        } catch (error) {
            console.error(error);
        }

        this.removeNfcListeners();
        this.nfcEnabled = false;
    }

    async passphoto(): Promise<void> {
        if (!this.initialized) {
            return await this.showToast("SDK not initialized");
        } else if (!this.mrzCredentials) {
            return await this.showToast("Scan MRZ first");
        }

        try {
            const photoScannerResult = await PassphotoScanner.scan();
            if (photoScannerResult) {
                this.images.push(photoScannerResult.face);
            }
        } catch (error) {
            console.error(error);
            await this.showToast(error.toString());
        }
    }

    async document(): Promise<void> {
        if (!this.initialized) {
            return await this.showToast("SDK not initialized");
        }

        try {
            this.resetCredentials();
            const documentInfo = await EpassReader.scanDocument();

            if (documentInfo) {
                this.mrzCredentials = documentInfo.mrz;

                if (documentInfo.face) {
                    this.images.push(documentInfo.face);
                }

                if (documentInfo.frontPhoto) {
                    this.images.push(documentInfo.frontPhoto);
                }

                if (documentInfo.backPhoto) {
                    this.images.push(documentInfo.backPhoto);
                }
            }

            console.log("Document info:", documentInfo);
        } catch (error) {
            console.error(error);
            await this.showToast(error.toString());
        }
    }

    resetCredentials(): void {
        this.verified = false;
        this.images = [];
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
        if (event.exception?.includes("onPACEException") && event.message?.includes("SW = 0x6300: Unknown")) {
            console.error("Incorrect MRZ credentials for NFC chip");
            this.showToast("Incorrect MRZ credentials for NFC chip");
        } else {
            console.error(event);
            this.showToast("Connection lost");
        }
        this.nfcEnabled = false;
        EpassReader.stopNfc();
    }

    /**
     * Gets called whenever the MRZ is invalid for specifically ios (android mrz error is handled inside onPassportReadError)
     */
    async iosMrzInvalidError(): Promise<void> {
        console.error("Incorrect MRZ credentials for NFC chip");
        this.showToast("Incorrect MRZ credentials for NFC chip");
        this.stopNfc();
    }

    async stopNfc(): Promise<void> {
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
        try {
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
        } catch (error) {
            console.error(error);
        }
    }
}
