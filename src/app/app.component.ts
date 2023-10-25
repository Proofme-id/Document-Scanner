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

        const DG14 = [
            110,
            130,
            1,
            217,
            49,
            130,
            1,
            213,
            48,
            13,
            6,
            8,
            4,
            0,
            127,
            0,
            7,
            2,
            2,
            2,
            2,
            1,
            1,
            48,
            15,
            6,
            10,
            4,
            0,
            127,
            0,
            7,
            2,
            2,
            3,
            2,
            4,
            2,
            1,
            1,
            48,
            18,
            6,
            10,
            4,
            0,
            127,
            0,
            7,
            2,
            2,
            4,
            2,
            4,
            2,
            1,
            2,
            2,
            1,
            14,
            48,
            23,
            6,
            6,
            103,
            129,
            8,
            1,
            1,
            5,
            2,
            1,
            1,
            6,
            10,
            4,
            0,
            127,
            0,
            7,
            1,
            1,
            4,
            1,
            3,
            48,
            130,
            1,
            132,
            6,
            9,
            4,
            0,
            127,
            0,
            7,
            2,
            2,
            1,
            2,
            48,
            130,
            1,
            117,
            48,
            130,
            1,
            29,
            6,
            7,
            42,
            134,
            72,
            206,
            61,
            2,
            1,
            48,
            130,
            1,
            16,
            2,
            1,
            1,
            48,
            52,
            6,
            7,
            42,
            134,
            72,
            206,
            61,
            1,
            1,
            2,
            41,
            0,
            211,
            94,
            71,
            32,
            54,
            188,
            79,
            183,
            225,
            60,
            120,
            94,
            210,
            1,
            224,
            101,
            249,
            143,
            207,
            166,
            246,
            244,
            13,
            239,
            79,
            146,
            185,
            236,
            120,
            147,
            236,
            40,
            252,
            212,
            18,
            177,
            241,
            179,
            46,
            39,
            48,
            84,
            4,
            40,
            62,
            227,
            11,
            86,
            143,
            186,
            176,
            248,
            131,
            204,
            235,
            212,
            109,
            63,
            59,
            184,
            162,
            167,
            53,
            19,
            245,
            235,
            121,
            218,
            102,
            25,
            14,
            176,
            133,
            255,
            169,
            244,
            146,
            243,
            117,
            169,
            125,
            134,
            14,
            180,
            4,
            40,
            82,
            8,
            131,
            148,
            157,
            253,
            188,
            66,
            211,
            173,
            25,
            134,
            64,
            104,
            138,
            111,
            225,
            63,
            65,
            52,
            149,
            84,
            180,
            154,
            204,
            49,
            220,
            205,
            136,
            69,
            57,
            129,
            111,
            94,
            180,
            172,
            143,
            177,
            241,
            166,
            4,
            81,
            4,
            67,
            189,
            126,
            154,
            251,
            83,
            216,
            184,
            82,
            137,
            188,
            196,
            142,
            229,
            191,
            230,
            242,
            1,
            55,
            209,
            10,
            8,
            126,
            182,
            231,
            135,
            30,
            42,
            16,
            165,
            153,
            199,
            16,
            175,
            141,
            13,
            57,
            226,
            6,
            17,
            20,
            253,
            208,
            85,
            69,
            236,
            28,
            200,
            171,
            64,
            147,
            36,
            127,
            119,
            39,
            94,
            7,
            67,
            255,
            237,
            17,
            113,
            130,
            234,
            169,
            199,
            120,
            119,
            170,
            172,
            106,
            199,
            211,
            82,
            69,
            209,
            105,
            46,
            142,
            225,
            2,
            41,
            0,
            211,
            94,
            71,
            32,
            54,
            188,
            79,
            183,
            225,
            60,
            120,
            94,
            210,
            1,
            224,
            101,
            249,
            143,
            207,
            165,
            182,
            143,
            18,
            163,
            45,
            72,
            46,
            199,
            238,
            134,
            88,
            233,
            134,
            145,
            85,
            91,
            68,
            197,
            147,
            17,
            2,
            1,
            1,
            3,
            82,
            0,
            4,
            124,
            207,
            32,
            217,
            239,
            31,
            38,
            5,
            181,
            181,
            123,
            228,
            206,
            223,
            129,
            130,
            18,
            145,
            191,
            58,
            12,
            112,
            67,
            64,
            181,
            163,
            225,
            28,
            180,
            251,
            94,
            159,
            172,
            25,
            29,
            229,
            229,
            227,
            197,
            51,
            52,
            168,
            241,
            240,
            134,
            4,
            9,
            170,
            27,
            202,
            72,
            177,
            106,
            99,
            233,
            115,
            73,
            112,
            142,
            45,
            88,
            46,
            199,
            104,
            135,
            59,
            80,
            146,
            194,
            33,
            214,
            76,
            155,
            6,
            208,
            94,
            196,
            227,
            230,
            94
        ];
        const DG15 = [
            111,
            130,
            1,
            121,
            48,
            130,
            1,
            117,
            48,
            130,
            1,
            29,
            6,
            7,
            42,
            134,
            72,
            206,
            61,
            2,
            1,
            48,
            130,
            1,
            16,
            2,
            1,
            1,
            48,
            52,
            6,
            7,
            42,
            134,
            72,
            206,
            61,
            1,
            1,
            2,
            41,
            0,
            211,
            94,
            71,
            32,
            54,
            188,
            79,
            183,
            225,
            60,
            120,
            94,
            210,
            1,
            224,
            101,
            249,
            143,
            207,
            166,
            246,
            244,
            13,
            239,
            79,
            146,
            185,
            236,
            120,
            147,
            236,
            40,
            252,
            212,
            18,
            177,
            241,
            179,
            46,
            39,
            48,
            84,
            4,
            40,
            62,
            227,
            11,
            86,
            143,
            186,
            176,
            248,
            131,
            204,
            235,
            212,
            109,
            63,
            59,
            184,
            162,
            167,
            53,
            19,
            245,
            235,
            121,
            218,
            102,
            25,
            14,
            176,
            133,
            255,
            169,
            244,
            146,
            243,
            117,
            169,
            125,
            134,
            14,
            180,
            4,
            40,
            82,
            8,
            131,
            148,
            157,
            253,
            188,
            66,
            211,
            173,
            25,
            134,
            64,
            104,
            138,
            111,
            225,
            63,
            65,
            52,
            149,
            84,
            180,
            154,
            204,
            49,
            220,
            205,
            136,
            69,
            57,
            129,
            111,
            94,
            180,
            172,
            143,
            177,
            241,
            166,
            4,
            81,
            4,
            67,
            189,
            126,
            154,
            251,
            83,
            216,
            184,
            82,
            137,
            188,
            196,
            142,
            229,
            191,
            230,
            242,
            1,
            55,
            209,
            10,
            8,
            126,
            182,
            231,
            135,
            30,
            42,
            16,
            165,
            153,
            199,
            16,
            175,
            141,
            13,
            57,
            226,
            6,
            17,
            20,
            253,
            208,
            85,
            69,
            236,
            28,
            200,
            171,
            64,
            147,
            36,
            127,
            119,
            39,
            94,
            7,
            67,
            255,
            237,
            17,
            113,
            130,
            234,
            169,
            199,
            120,
            119,
            170,
            172,
            106,
            199,
            211,
            82,
            69,
            209,
            105,
            46,
            142,
            225,
            2,
            41,
            0,
            211,
            94,
            71,
            32,
            54,
            188,
            79,
            183,
            225,
            60,
            120,
            94,
            210,
            1,
            224,
            101,
            249,
            143,
            207,
            165,
            182,
            143,
            18,
            163,
            45,
            72,
            46,
            199,
            238,
            134,
            88,
            233,
            134,
            145,
            85,
            91,
            68,
            197,
            147,
            17,
            2,
            1,
            1,
            3,
            82,
            0,
            4,
            17,
            170,
            253,
            211,
            27,
            14,
            121,
            227,
            4,
            9,
            42,
            186,
            95,
            235,
            166,
            111,
            111,
            39,
            27,
            15,
            176,
            46,
            123,
            89,
            174,
            67,
            231,
            55,
            193,
            56,
            75,
            73,
            118,
            20,
            253,
            233,
            110,
            45,
            125,
            119,
            0,
            62,
            58,
            243,
            203,
            113,
            252,
            171,
            130,
            83,
            55,
            221,
            171,
            3,
            142,
            183,
            173,
            113,
            211,
            82,
            126,
            191,
            105,
            29,
            34,
            183,
            161,
            162,
            6,
            123,
            151,
            98,
            85,
            179,
            21,
            137,
            167,
            234,
            145,
            204
        ];

        const dg14Data = this.readerHelper.DG14ToSecurityInfo(new Uint8Array(DG14));
        const dg15Data = this.readerHelper.extractDG15(new Uint8Array(DG15));

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
                dataGroups: [EDataGroup.DG1, EDataGroup.DG2, EDataGroup.DG14, EDataGroup.DG15]
            }
            this.datagroups = await EpassReader.scanNfc(scanOptions);
            if (this.datagroups) {
                const dg1Data = this.readerHelper.extractMRZFromDG1(new Uint8Array(this.datagroups.DG1));
                const base64jp2 = this.readerHelper.extractImageFromDG2(new Uint8Array(this.datagroups.DG2));

                const dg14Data = this.readerHelper.DG14ToSecurityInfo(new Uint8Array(this.datagroups.DG14));
                const dg15Data = this.readerHelper.extractDG15(new Uint8Array(this.datagroups.DG15));

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
                    this.images = this.images.filter(x => x.type !== EImageType.VERIFIED_FACE);
                    this.images.unshift({
                        base64Source: imageObject.image,
                        type: EImageType.VERIFIED_FACE
                    });
                    console.log("Document image:", imageObject.image);
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
            await this.showToast(error.toString());
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
