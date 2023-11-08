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
import { IImage } from "./interfaces/image.interface";
import { EImageType } from "./enums/imageType.enum";
import { IVehicleCategory } from "@proofme-id/sdk/web/interfaces/vehicleCategory.interface";

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

    images: IImage[] = [];
    imageIndex = 0;

    constructor(
        private ngZone: NgZone
    ) { }

    async ngOnInit(): Promise<void> {
        await this.initializeSdk();

        this.mrzCredentials = {
            "documentType": "P",
            "documentNumber": "NXC8RPRB6",
            "birthDateDigits": "030129",
            "birthDate": "29-01-2003",
            "expiryDateDigits": "310602",
            "expiryDate": "02-06-2031",
            "firstNames": "MARTEN",
            "gender": "MALE",
            "lastName": "SCHELFHORST",
            "issuer": "NLD",
            "nationality": "NLD",
            "documentNumberCheckDigitCorrect": true,
            "expiryDateCheckDigitCorrect": true,
            "birthDateCheckDigitCorrect": true
        };

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

    async mrz(driverLicense?: boolean): Promise<void> {
        if (!this.initialized) {
            return await this.showToast("SDK not initialized");
        }

        try {
            this.resetCredentials();
            this.mrzCredentials = await EpassReader.scanMrz({ driverLicense });

            console.log("MRZ credentials:", this.mrzCredentials);
        } catch (error) {
            console.error(error);
            if (error.toString().includes("CAMERA_PERMISSION_DENIED")) {
                await this.showToast("Camera permission denied");
            } else {
                await this.showToast("Failed to scan MRZ");
            }
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
            console.log("this.datagroups:", this.datagroups);

            console.log("DG1:", JSON.stringify(this.datagroups.DG1))
            // console.log("DG2:", JSON.stringify(this.datagroups.DG2))
            console.log("DG11:", JSON.stringify(this.datagroups.DG11))
            console.log("DG14:", JSON.stringify(this.datagroups.DG14))

            if (this.datagroups) {
                delete this.datagroups.success;

                const dg1Data = this.readerHelper.extractDG1Data(new Uint8Array(this.datagroups.DG1));
                // this.readerHelper.extractDataFromDG2(new Uint8Array(this.datagroups.DG6));
                // const isDriverLicense = dg1Data.fields.documentType == "D";
                const isDriverLicense = true
                if (this.datagroups.DG6) {
                    const base64jp2 = this.readerHelper.extractImageFromDG2(new Uint8Array(this.datagroups.DG6), isDriverLicense);
                    console.log("AppComponent - base64jp2:", base64jp2);

                    try {
                        let image = base64jp2;
                        if (!isDriverLicense) {
                            const imageObject = await JP2Decoder.convertJP2toJPEG({ image: base64jp2 });
                            image = imageObject.image
                        }

                        this.images = this.images.filter(x => x.type !== EImageType.VERIFIED_FACE);
                        this.images.unshift({ 
                            base64Source: image,
                            type: EImageType.VERIFIED_FACE
                        });
                        console.log("Document image:", image);
                    } catch (error) {
                        console.error(error);
                        await this.showToast("Could not parse jp2 image");
                    }
                }

                if (isDriverLicense) {
                    console.log("Basic information:", dg1Data.fields);
                    this.mrzCredentials = {
                        "documentType": "",
                        "documentNumber": "",
                        "birthDateDigits": "",
                        "birthDate": "",
                        "expiryDateDigits": "",
                        "expiryDate": "",
                        "firstNames": "",
                        "gender": "",
                        "lastName": "",
                        "issuer": "",
                        "nationality": "",
                        "documentNumberCheckDigitCorrect": false,
                        "expiryDateCheckDigitCorrect": false,
                        "birthDateCheckDigitCorrect": false
                    };

                    this.mrzCredentials.documentNumber = dg1Data.fields["documentNumber"];
                    this.mrzCredentials.gender = null;
                    this.mrzCredentials.documentType = dg1Data.fields["documentType"];
                    this.mrzCredentials.city = dg1Data.fields["city"];
                    this.mrzCredentials.firstNames = dg1Data.fields["secondaryIdentifier"];
                    this.mrzCredentials.lastName = dg1Data.fields["primaryIdentifier"];
                    this.mrzCredentials.nationality = dg1Data.fields["nationality"];
                    this.mrzCredentials.issuer = dg1Data.fields["localAuthority"];
                    this.mrzCredentials.birthDate = dg1Data.fields["birthDate"];
                    this.mrzCredentials.issueDate = dg1Data.fields["issueDate"];
                    this.mrzCredentials.expiryDate = dg1Data.fields["expiryDate"];
                    this.mrzCredentials.vehicleCategories = dg1Data.fields.vehicleCategories as IVehicleCategory[];
                } else {
                    console.log("Basic information:", dg1Data.fields);

                    this.mrzCredentials.documentNumber = dg1Data.fields["documentNumber"];
                    this.mrzCredentials.gender = dg1Data.fields["sex"];
                    this.mrzCredentials.documentType = dg1Data.fields["documentCode"];
                    this.mrzCredentials.firstNames = dg1Data.fields["firstName"];
                    this.mrzCredentials.lastName = dg1Data.fields["lastName"];
                    this.mrzCredentials.nationality = dg1Data.fields["nationality"];
                    this.mrzCredentials.issuer = dg1Data.fields["issuingState"];
                }

                this.verified = true;

                const dg11Data = this.readerHelper.extractDataFromDG11(new Uint8Array(this.datagroups.DG11));
                this.mrzCredentials.personalNumber = dg11Data.fields.personalNumber;
                // this.mrzCredentials.city = dg11Data.fields.city

                const dg12Data = this.readerHelper.extractDataFromDG12(new Uint8Array(this.datagroups.DG12));
                this.mrzCredentials.mrz = dg12Data.fields.mrz

                if (this.datagroups.DG5) {
                    const signatureBase64 = this.readerHelper.extractImageFromDG7(new Uint8Array(this.datagroups.DG5), isDriverLicense);
                    console.log("AppComponent - signatureBase64:", signatureBase64);
                    this.mrzCredentials.signatureBase64 = signatureBase64
                }

                if (this.datagroups.DG13) {
                    this.readerHelper.extractDataFromDG13(new Uint8Array(this.datagroups.DG13));
                }

                if (this.datagroups.DG14) {
                    this.readerHelper.extractDataFromDG14(new Uint8Array(this.datagroups.DG14));
                }
            }
        } catch (error) {
            if (error.toString().includes("USER_CANCELED")) {
                console.error("User canceled");
                this.showToast("User canceled");
            } else if (error.toString().includes("SYSTEM_RESOURCE_UNAVAILABLE")) {
                console.error("System resource unavailable");
                this.showToast("System resource unavailable");
            } else {
                console.error(error);
            }
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
            console.log("photoScannerResult:", photoScannerResult);
            if (photoScannerResult?.face) {
                this.images = this.images.filter(x => x.type !== EImageType.UNVERIFIED_FACE);
                this.images.push({
                    base64Source: photoScannerResult.face,
                    type: EImageType.UNVERIFIED_FACE  
                });
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
            const documentInfo = await EpassReader.scanDocument({
                translations: {
                    frontScan: "Scan front",
                    backScan: "Scan back",
                    processing: "Processing...",
                    rotate: "Please rotate the document",
                    tryAgain: "Try again",
                    success: "Success"
                }
            });

            if (documentInfo) {
                this.mrzCredentials = documentInfo.mrz;

                if (documentInfo.face) {
                    this.images.push({
                        base64Source: documentInfo.face,
                        type: EImageType.UNVERIFIED_FACE  
                    });
                }

                if (documentInfo.frontPhoto) {
                    this.images.push({
                        base64Source: documentInfo.frontPhoto,
                        type: EImageType.FRONT  
                    });
                }

                if (documentInfo.backPhoto) {
                    this.images.push({
                        base64Source: documentInfo.backPhoto,
                        type: EImageType.BACK  
                    });
                }
            }

            console.log("Document info:", documentInfo);
        } catch (error) {
            console.error(error);
            if (error.toString().includes("CAMERA_PERMISSION_DENIED")) {
                await this.showToast("Camera permission denied");
            } else {
                await this.showToast(error.toString());
            }
        }
    }

    resetCredentials(): void {
        this.mrzCredentials = null;
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

    substring(text: string, start: number, end: number) {
        return text.substring(start, end)
    }
}
