import { Injectable, NgZone } from "@angular/core";
import { Toast } from "@capacitor/toast";
import { Configuration, EpassReader, JP2Decoder, PassphotoScanner } from "@proofme-id/sdk/web/reader";
import { IDocumentCredentials, INfcResult, IPassportNfcProgressErrorEvent, IPassportNfcProgressEvent, IScanOptions, IScanDocumentConfig } from "@proofme-id/sdk/web/reader/interfaces";
import { environment } from "src/environments/environment";
import { EImageType } from "../enums/imageType.enum";
import { ESdkStatus } from "../enums/sdkStatus.enum";
import { IVehicleCategory } from '@proofme-id/sdk/web/interfaces/vehicleCategory.interface';
import { EDataGroup } from '@proofme-id/sdk/web/reader/enums';
import { Utils } from '@proofme-id/sdk/web/reader/utils';
import { ReaderHelper } from '@proofme-id/sdk/web/reader/helpers';
import { IImage } from "../interfaces/image.interface";

@Injectable()
export class SdkProvider {
    readonly TOAST_DURATION_IN_MS = 3500;
    onPassportReadStartReference = this.onPassportReadStart.bind(this);
    onPassportReadErrorReference = this.onPassportReadError.bind(this);
    onPassportReadNfcProgressReference = this.onPassportNfcProgress.bind(this);
    initialized: boolean;
    previousToast: string;
    toastTimeout: NodeJS.Timeout;
    sdkStatus: ESdkStatus;
    progress: number;
    nfcEnabled: boolean;
    nfcTagDetected: boolean;
    retrievedDataGroups: INfcResult;
    utils = new Utils();
    readerHelper = new ReaderHelper();
    images: IImage[] = [];
    verified: boolean;
    credentials: IDocumentCredentials;
    settingsDataGroups: EDataGroup[] = [];
    detectDocumentConfig: IScanDocumentConfig = {
        mrz: {
            detect: true,
            required: true,
            srcImage: true
        },
        face: {
            detect: true,
            required: true,
            srcImage: true
        },
        maxRetries: 0
    };

    constructor(
        private ngZone: NgZone
    ) {
        this.initializeSdk();
        this.addNfcListeners();
    }

    onPassportReadStart(): void {
        console.log("onPassportReadStart");
        this.ngZone.run(() => {
            this.nfcEnabled = true;
            this.nfcTagDetected = true;
            console.log("NFC UI: ENABLED");
        });
    }

    onPassportReadFinish(): void {
        console.log("onPassportReadFinish");
        this.ngZone.run(() => {
            this.nfcEnabled = false;
            this.nfcTagDetected = false;
            console.log("NFC UI: DISABLED");
        });
    }

    async initializeSdk(): Promise<void> {
        if (this.initialized) {
            return await this.showToast("SDK already initialized");
        }

        try {
            const result = await Configuration.initialize({ jwt: environment.license });

            if (result) {
                this.initialized = true;
                this.sdkStatus = ESdkStatus.ACTIVE;
            } else if (result.exp < new Date().getDate()) {
                this.sdkStatus = ESdkStatus.REVOKED;
            }
        } catch (error) {
            console.error(error);
            await this.showToast("Failed to initialize SDK");
        }
    }

    async openMrzScanner(driverLicense?: boolean): Promise<void> {
        if (!this.initialized) {
            return await this.showToast("SDK not initialized");
        }

        try {
            this.resetCredentials();
            this.credentials = await EpassReader.scanMrz({ driverLicense });

            console.log("MRZ credentials:", this.credentials);
        } catch (error) {
            console.error(error);
            if (error.toString().includes("CAMERA_PERMISSION_DENIED")) {
                await this.showToast("Camera permission denied");
            } else {
                await this.showToast("Failed to scan MRZ");
            }
        }
    }

    resetCredentials(): void {
        this.retrievedDataGroups = null;
        this.credentials = null;
        this.verified = false;
        this.images = [];
    }

    async detectFace(): Promise<void> {
        if (!this.initialized) {
            return await this.showToast("SDK not initialized");
        } else if (!this.credentials) {
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


    /**
     * Gets called everytime the NFC progresses to the next step
     * @param event
     */
    onPassportNfcProgress(event: IPassportNfcProgressEvent): void {
        console.log("onPassportNfcProgress:", event);
        this.progress = event.progress
    }

    /**
     * Gets called whenever there is an error reading the document
     * @param event
     */
    onPassportReadError(event: IPassportNfcProgressErrorEvent): void {
        console.error("onPassportReadError event:", event);
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
        this.nfcTagDetected = false;
    }

    async stopReadNfc(): Promise<void> {
        this.nfcEnabled = false;
        this.nfcTagDetected = false;
        await EpassReader.stopNfc();
    }

    addNfcListeners(): void {
        window.addEventListener("onPassportReadStart", this.onPassportReadStartReference);
        window.addEventListener("onPassportReadError", this.onPassportReadErrorReference);
        window.addEventListener("onPassportNfcProgress", this.onPassportReadNfcProgressReference);
    }

    async readNfc(): Promise<void> {
        if (!this.initialized) {
            return await this.showToast("SDK not initialized");
        } else if (!this.credentials) {
            return await this.showToast("Scan MRZ first");
        }

        try {
            this.progress = 0;
            this.retrievedDataGroups = null;
            this.nfcTagDetected = false
            this.nfcEnabled = true;
            // this.addNfcListeners();
            const isDriverLicense = this.credentials.documentType === "D";

            const scanOptions: IScanOptions = {
                driverMrzKey: this.credentials.driverMrzKey,
                documentType: this.credentials.documentType,
                documentNumber: this.credentials.documentNumber,
                birthDate: this.credentials.birthDateDigits,
                expiryDate: this.credentials.expiryDateDigits,
                dataGroups: this.settingsDataGroups
            }

            this.retrievedDataGroups = await EpassReader.scanNfc(scanOptions);
            console.log("Datagroups:", this.retrievedDataGroups);

            if (this.retrievedDataGroups) {
                if (this.retrievedDataGroups.DG1?.data.length > 0) {
                    const dg1Data = this.readerHelper.extractDG1Data(new Uint8Array(this.retrievedDataGroups.DG1.data), isDriverLicense);
                    if (isDriverLicense) {
                        console.log("Basic information:", dg1Data.fields);

                        this.credentials.documentNumber = dg1Data.fields["documentNumber"];
                        this.credentials.gender = null;
                        this.credentials.documentType = dg1Data.fields["documentType"];
                        this.credentials.firstNames = dg1Data.fields["secondaryIdentifier"];
                        this.credentials.lastName = dg1Data.fields["primaryIdentifier"];
                        this.credentials.nationality = dg1Data.fields["nationality"];
                        this.credentials.issuer = dg1Data.fields["localAuthority"];
                        this.credentials.birthDate = dg1Data.fields["birthDate"].toISOString();
                        this.credentials.expiryDate = dg1Data.fields["expiryDate"].toISOString();

                        this.credentials.city = dg1Data.fields["city"];
                        this.credentials.issueDate = dg1Data.fields["issueDate"].toISOString();
                        this.credentials.vehicleCategories = dg1Data.fields.vehicleCategories as IVehicleCategory[];
                    } else {
                        console.log("Basic information:", dg1Data.fields);

                        this.credentials.documentNumber = dg1Data.fields["documentNumber"];
                        this.credentials.gender = dg1Data.fields["sex"].toUpperCase();
                        this.credentials.documentType = dg1Data.fields["documentCode"];
                        this.credentials.firstNames = dg1Data.fields["firstName"];
                        this.credentials.lastName = dg1Data.fields["lastName"];
                        this.credentials.nationality = dg1Data.fields["nationality"];
                        this.credentials.issuer = dg1Data.fields["issuingState"];
                        this.credentials.birthDate = this.utils.convertSixDigitStringDate(dg1Data.fields["birthDate"], true).toISOString();
                        this.credentials.expiryDate = this.utils.convertSixDigitStringDate(dg1Data.fields["expirationDate"], false).toISOString();
                    }
                }
                if (this.retrievedDataGroups.DG2?.data.length > 0) {
                    this.readPassphotoFromDatagroup(isDriverLicense, this.retrievedDataGroups.DG2.data)
                }

                if (this.retrievedDataGroups.DG5?.data.length > 0) {
                    const signatureBase64 = this.readerHelper.extractImageFromDG7(new Uint8Array(this.retrievedDataGroups.DG5.data), isDriverLicense);
                    console.log("AppComponent - signatureBase64:", signatureBase64);
                    this.credentials.signatureBase64 = signatureBase64
                }

                if (this.retrievedDataGroups.DG6?.data.length > 0) {
                    this.readPassphotoFromDatagroup(isDriverLicense, this.retrievedDataGroups.DG6.data)
                }

                if (this.retrievedDataGroups.DG11?.data.length > 0) {
                    const dg11Data = this.readerHelper.extractDataFromDG11(new Uint8Array(this.retrievedDataGroups.DG11.data));
                    this.credentials.personalNumber = dg11Data.fields.personalNumber;
                }

                if (this.retrievedDataGroups.DG12?.data.length > 0) {
                    const dg12Data = this.readerHelper.extractDataFromDG12(new Uint8Array(this.retrievedDataGroups.DG12.data));
                    this.credentials.mrz = dg12Data.fields.mrz
                }

                if (this.retrievedDataGroups.DG13?.data.length > 0) {
                    this.readerHelper.extractDataFromDG13(new Uint8Array(this.retrievedDataGroups.DG13.data));
                }

                if (this.retrievedDataGroups.DG14?.data.length > 0) {
                    this.readerHelper.extractDataFromDG14(new Uint8Array(this.retrievedDataGroups.DG14.data));
                }

                console.log("Result:", this.credentials);
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

        // this.removeNfcListeners();
        this.nfcEnabled = false;
    }

    async readPassphotoFromDatagroup(isDriverLicense: boolean, dgNumber: number[]) {
        console.log("readPassphotoFromDatagroup", isDriverLicense, dgNumber)
        const base64jp2 = this.readerHelper.extractImageFromDG2(new Uint8Array(dgNumber), isDriverLicense);
        try {
            let image = base64jp2;
            if (!isDriverLicense) {
                const imageObject = await JP2Decoder.convertJP2toJPEG({ image: base64jp2 });
                image = imageObject.image
            }

            this.images = this.images.filter(x => x.type !== EImageType.VERIFIED_FACE && x.type !== EImageType.UNVERIFIED_FACE);
            this.images.unshift({
                base64Source: image,
                type: EImageType.VERIFIED_FACE
            });
        } catch (error) {
            console.error(error);
            await this.showToast("Could not parse jp2 image");
        }
    }

    async detectDocument(): Promise<void> {
        if (!this.initialized) {
            return await this.showToast("SDK not initialized");
        }

        try {
            console.log("this.detectDocumentConfig:", this.detectDocumentConfig);
            this.resetCredentials();
            const documentInfo = await EpassReader.scanDocument({
                translations: {
                    firstResultScan: "Scan front",
                    secondResultScan: "Scan back",
                    processing: "Processing...",
                    rotate: "Please rotate the document",
                    tryAgain: "Try again",
                    success: "Success"
                },
                config: this.detectDocumentConfig
            });

            if (documentInfo) {
                this.credentials = documentInfo.mrz;

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
}
