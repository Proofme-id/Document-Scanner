import { EpassReader, JP2Decoder, PassphotoScanner, Configuration } from "@proofme-id/sdk/web/reader";
import { IVehicleCategory } from "@proofme-id/sdk/web/interfaces/vehicleCategory.interface";
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ReaderHelper } from "@proofme-id/sdk/web/reader/helpers";
import { EDataGroup } from "@proofme-id/sdk/web/reader/enums";
import { environment } from "../environments/environment";
import { Utils } from "@proofme-id/sdk/web/reader/utils";
import { IImage } from "./interfaces/image.interface";
import { EImageType } from "./enums/imageType.enum";
import { Toast } from '@capacitor/toast';
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

    utils = new Utils();

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
            let isDriverLicense = this.mrzCredentials.documentType === "D";

            const passportIdCardDatagroups = [
                EDataGroup.DG1,
                EDataGroup.DG2
            ]

            const driverLicenseDatagroups = [
                EDataGroup.DG1,
                EDataGroup.DG5,
                EDataGroup.DG6,
                EDataGroup.DG11,
                EDataGroup.DG12
            ];

            let dataGroups: EDataGroup[] = null

            if (isDriverLicense) {
                dataGroups = driverLicenseDatagroups;
            } else {
                dataGroups = passportIdCardDatagroups
            }

            const scanOptions: IScanOptions = {
                documentType: this.mrzCredentials.documentType,
                documentNumber: this.mrzCredentials.documentNumber,
                birthDate: this.mrzCredentials.birthDateDigits,
                expiryDate: this.mrzCredentials.expiryDateDigits,
                dataGroups: dataGroups
            }
            this.datagroups = await EpassReader.scanNfc(scanOptions);
            console.log("Datagroups:", this.datagroups);

            if (this.datagroups) {
                delete this.datagroups.success;

                if (this.datagroups.DG1?.data.length > 0) {
                    const dg1Data = this.readerHelper.extractDG1Data(new Uint8Array(this.datagroups.DG1.data), isDriverLicense);
                    if (isDriverLicense) {
                        console.log("Basic information:", dg1Data.fields);
    
                        this.mrzCredentials.documentNumber = dg1Data.fields["documentNumber"];
                        this.mrzCredentials.gender = null;
                        this.mrzCredentials.documentType = dg1Data.fields["documentType"];
                        this.mrzCredentials.firstNames = dg1Data.fields["secondaryIdentifier"];
                        this.mrzCredentials.lastName = dg1Data.fields["primaryIdentifier"];
                        this.mrzCredentials.nationality = dg1Data.fields["nationality"];
                        this.mrzCredentials.issuer = dg1Data.fields["localAuthority"];
                        this.mrzCredentials.birthDate = dg1Data.fields["birthDate"];
                        this.mrzCredentials.expiryDate = dg1Data.fields["expiryDate"];

                        this.mrzCredentials.city = dg1Data.fields["city"];
                        this.mrzCredentials.issueDate = dg1Data.fields["issueDate"];
                        this.mrzCredentials.vehicleCategories = dg1Data.fields.vehicleCategories as IVehicleCategory[];
                    } else {
                        console.log("Basic information:", dg1Data.fields);
    
                        this.mrzCredentials.documentNumber = dg1Data.fields["documentNumber"];
                        this.mrzCredentials.gender = dg1Data.fields["sex"].toUpperCase();
                        this.mrzCredentials.documentType = dg1Data.fields["documentCode"];
                        this.mrzCredentials.firstNames = dg1Data.fields["firstName"];
                        this.mrzCredentials.lastName = dg1Data.fields["lastName"];
                        this.mrzCredentials.nationality = dg1Data.fields["nationality"];
                        this.mrzCredentials.issuer = dg1Data.fields["issuingState"];
                        this.mrzCredentials.birthDate = this.utils.convertSixDigitStringDate(dg1Data.fields["birthDate"], true);
                        this.mrzCredentials.expiryDate = this.utils.convertSixDigitStringDate(dg1Data.fields["expirationDate"], false);
                    }
                }
                if (this.datagroups.DG2?.data.length > 0) {
                    this.readPassphotoFromDatagroup(isDriverLicense, this.datagroups.DG2.data)
                }

                if (this.datagroups.DG5?.data.length > 0) {
                    const signatureBase64 = this.readerHelper.extractImageFromDG7(new Uint8Array(this.datagroups.DG5.data), isDriverLicense);
                    console.log("AppComponent - signatureBase64:", signatureBase64);
                    this.mrzCredentials.signatureBase64 = signatureBase64
                }

                if (this.datagroups.DG6?.data.length > 0) {
                    this.readPassphotoFromDatagroup(isDriverLicense, this.datagroups.DG6.data)
                }

                if (this.datagroups.DG11?.data.length > 0) {
                    const dg11Data = this.readerHelper.extractDataFromDG11(new Uint8Array(this.datagroups.DG11.data));
                    this.mrzCredentials.personalNumber = dg11Data.fields.personalNumber;
                }

                if (this.datagroups.DG12?.data.length > 0) {
                    const dg12Data = this.readerHelper.extractDataFromDG12(new Uint8Array(this.datagroups.DG12.data));
                    this.mrzCredentials.mrz = dg12Data.fields.mrz
                }

                if (this.datagroups.DG13?.data.length > 0) {
                    this.readerHelper.extractDataFromDG13(new Uint8Array(this.datagroups.DG13.data));
                }

                if (this.datagroups.DG14?.data.length > 0) {
                    this.readerHelper.extractDataFromDG14(new Uint8Array(this.datagroups.DG14.data));
                }

                console.log("Result:", this.mrzCredentials);
                this.verified = true;
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
        this.datagroups = null;
        this.mrzCredentials = null;
        this.verified = false;
        this.images = [];
    }

    /**
     * Gets called everytime the NFC progresses to the next step
     * @param event
     */
    onPassportNfcProgress(event: IPassportNfcProgressEvent): void {
        console.log("onPassportNfcProgress:", event);
        const currentStep = event.currentStep;
        const totalSteps = event.totalSteps;
        this.ngZone.run(() => {
            this.progress = parseInt(((currentStep / totalSteps) * 100).toFixed(0));
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
        let swHex = null;
        if (event.sw) {
            swHex = `0x${parseInt(event.sw, 10).toString(16).toUpperCase()}`
        }
        console.log("swHex:", swHex);
        if (swHex) {
            // RAPDU = 6982 (SW = 0x6982: SECURITY STATUS NOT SATISFIED) = 27010
            // RAPDU = 6A86 (SW = 0x6A86: INCORRECT P1P2) = 27270
            if (swHex === "0x6982" || swHex === "0x6A86") {
                console.error("Incorrect MRZ credentials for NFC chip");
                this.showToast("Incorrect MRZ credentials for NFC chip");
            } else {
                this.showToast("Connection lost");
            }
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

    async readPassphotoFromDatagroup(isDriverLicense: boolean, dgNumber: number[]) {
        const base64jp2 = this.readerHelper.extractImageFromDG2(new Uint8Array(dgNumber), isDriverLicense);
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
        } catch (error) {
            console.error(error);
            await this.showToast("Could not parse jp2 image");
        }
    }
}
