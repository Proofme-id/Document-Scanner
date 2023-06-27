import { Component, NgZone, ViewChild } from '@angular/core';
import { EpassReader } from "@proofme-id/sdk/web/reader";
import { ReaderHelper } from "@proofme-id/sdk/web/reader/helpers";
import { EDataGroup } from "@proofme-id/sdk/web/reader/enums";
import { Toast } from '@capacitor/toast';
import { IMrzCredentials, INfcResult, IPassportNfcProgressErrorEvent, IPassportNfcProgressEvent, IScanOptions } from "@proofme-id/sdk/web/reader/interfaces";
import { jp2 } from "@proofme-id/sdk/web";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    @ViewChild("canvas") canvas: HTMLCanvasElement;

    readonly TEST_JWT = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaWQiOiJ0ZXN0OjB4NjRCRjYwOTdhNzEyYmRiMDhERDZmYjhEQ2YzZjE3QjE3YjBEYzk0ZCIsInZlcnNpb24iOiIxLjAuMCIsInNjb3BlIjpbIk5GQyIsIk1SWiIsIkxJVkVORVNTIl0sImlhdCI6MTY4NjgzOTQxMCwiZXhwIjoxNzE4NDYxODEwLCJhdWQiOiJTREsgTGljZW5zZSJ9.g9EIS6SQV8n-HfvKPYacw873evxRUs3Ol6d4AVggXtBVuUZbUA7lBLATA9_KN2jU-Xixbslkcs8ffqmDOSp3dRQBZccssGudm-0ptQHaS9PtexdnJDlAqGKCxYyejTZXWF-l1CWV-k8oh_pH8kV9m0kTGRixUkCZymn_mB29U3nk0qIVDnEtIf8jglLDy8L2R7bAZrBpxvGj6qisMcBmkOtjtK11uUv2MyKO1fz9gEmUo2GCyBOYtkz3Wpbq5IUYGWdjG0IMaJ22wZ-almosRupv1_VyKfeI7jTHaR7-lpc7vfWIf6QQngfldazdy8mEpuj6mRXDpqrsz2OqXQ_xlJ0r_sYnPtWit4MPeSam8MpKHMUiq7fzcBUtvzrOjLHs1myywHDUk3axNPzSHB7MoUx5jGLUlJ-eiYfJjaZ9Ft-yNl-_vQlj8sfQdVsygpfeHkzpkIvvIzrXIcqFsegUchJSsHf4_7s3aJj_sEvPMtisWHbC_zznubwMau3gjTO0IRwSdoYJnYxd4thdNLBDXMUoGJaOAZgXea3KNu_gE74w9cGmj-z4VftRpiH3mrd5yn6Q82p4SG2NvU47Nsu8rCjS5kMpNHNlrbaxOs9OzBFWmUnud8dLckJbRj9zh0TKK1t8v2T2eLbzGSQ_5HBjoz90C-qgsscN0WjH1wAirnc";
    readonly PROD_JWT = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaWQiOiJkaWQ6ZGlkdXg6MHg2NEJGNjA5N2E3MTJiZGIwOERENmZiOERDZjNmMTdCMTdiMERjOTRkIiwidmVyc2lvbiI6IjEuMC4wIiwic2NvcGUiOlsiTkZDIiwiTVJaIiwiTElWRU5FU1MiXSwiaWF0IjoxNjg2ODM5NDEwLCJleHAiOjE3MTg0NjE4MTAsImF1ZCI6IlNESyBMaWNlbnNlIn0.aPnaXyzeW3XaYXBWiINU72xi8i98wdbmQkdU0VVhYk7VvsnV_mr173MdsfQ341mNUTnD8MI5jPT_L-0p6U06Ojt45F_9o4GNOlQFwyB1cAH10LS-gvYuHTKvenN5iHhtNdJ5AtHU4eA7cpy_DgOBEQF1VAa47bUXpXQKfTKD5j2WvKhGUKvneMPwrqGEyUjmVzzRw4a-PUGXtYBK0H-srHoA1m9glD6io5YUcdh3ZGvZ8m-kfhSJloi2ws6BfAk-A78sEeCSDZg5p-gWreXLB-RCkX-6DQx-Pko46Gf3fkTmJ9O9eRlmNOl3egOnx-8zLpGkoAV7nx826uRj3whj6-FXUjLJ5fh-Cl9bVbATjejxg9qir6jtd8O1XVmFO1fC-SC1dNlZMlM2KhMhd99uDbzUG3BrWCPQZ5pzezUJVVmw2i5yl7NTysOUGV0zb39UkOGFJCdUsfZHbyqXzvl_A8smYCoNv_jS-Ft-RfM6R5fK5YOJNkONtQ9hEFwCJpircHPcaZ8wVc0ldILGfcfvYbhkddYT-jHmyIGLZVbCdCW0ZF94PlbgZ9ZE35xujWCCOH4PlRxbxMRmeXUpW15dxiL0nHKuO6LXeveJcgg_LdPqBTJMbR0lfAvGv3BJniwGtOoWS0RztGwjnKE_UJ2Mev7IHiuMx-X_0l8KGLxQgNo";
    readonly TOAST_DURATION_IN_MS = 3500;

    objectKeys = Object.keys
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

    uncompressedImageFrame: Uint8Array;

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
            const result = await EpassReader.initialize({ jwt: this.TEST_JWT });

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
            delete this.datagroups.success;

            const dg1Data = this.readerHelper.extractMRZFromDG1(new Uint8Array(this.datagroups.DG1));
            const base64jp2 = this.readerHelper.extractImageFromDG2(new Uint8Array(this.datagroups.DG2));
            this.passportPhoto = await jp2.JP2000toJPEG(base64jp2);
            this.verified = true;
            this.passportPhoto = "";

            console.log("Basic information:", dg1Data.fields);
            console.log("Document image:", this.passportPhoto);
        } catch (error) {
            console.error(error);
            await this.showToast("Failed to scan NFC");
        }

        this.removeNfcListeners();
        this.nfcEnabled = false;
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
