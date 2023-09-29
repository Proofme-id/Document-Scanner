import { Component, NgZone, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit {
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

    ngOnInit(): void {
        this.initializeSdk();
    }

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
            await this.showToast("SDK not initialized");
            return;
        }

        try {
            this.mrzCredentials = await EpassReader.scanMrz({ closeText: "Close" });
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
            this.addNfcListeners();

            const scanOptions: IScanOptions = {
                documentNumber: this.mrzCredentials.documentNumber,
                birthDate: this.mrzCredentials.birthDate,
                expiryDate: this.mrzCredentials.expiryDate,
                dataGroups: [EDataGroup.DG1, EDataGroup.DG2]
            }
            this.datagroups = await EpassReader.scanNfc(scanOptions);
            if (this.datagroups) {
                console.log("this.datagroups:", this.datagroups);
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
                this.mrzCredentials.nationality = dg1Data.fields["nationality"];
                this.mrzCredentials.issuer = dg1Data.fields["issuingState"];

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
            }
        } catch (error) {
            console.error(error);
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
            const photoScannerResult = await PassphotoScanner.scan();
            if (photoScannerResult) {
                this.passportPhoto = photoScannerResult.face;
                console.log("this.passportPhoto:", this.passportPhoto);
            }
        } catch (error) {
            console.error(error);
            this.showToast(error.toString());
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
