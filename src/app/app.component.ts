import { Component, NgZone } from '@angular/core';
import { EpassReader } from "@proofme-id/sdk/web/reader";
import { ReaderHelper } from "@proofme-id/sdk/web/reader/helpers";
import { EDataGroup } from "@proofme-id/sdk/web/reader/enums";
import { IMrzCredentials, INfcResult, IPassportNfcProgressErrorEvent, IPassportNfcProgressEvent, IScanOptions } from "@proofme-id/sdk/web/reader/interfaces";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    objectKeys = Object.keys
    iosMrzInvalidReference = this.iosMrzInvalidError.bind(this);
    onPassportReadStartReference = this.onPassportReadStart.bind(this);
    onPassportReadErrorReference = this.onPassportReadError.bind(this);
    onPassportReadNfcProgressReference = this.onPassportNfcProgress.bind(this);

    mrzCredentials: IMrzCredentials;
    nfcEnabled = false;
    nfcProgressValue = 0;
    datagroups: INfcResult;
    readerHelper = new ReaderHelper();

    constructor(
        private ngZone: NgZone
    ) {

    }

    async ngOnDestroy(): Promise<void> {
        this.removeNfcListeners();
        await EpassReader.stopNfc();
    }

    async initializeSdk(): Promise<void> {
        try {
            // TEST JWT
            const jwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaWQiOiJ0ZXN0OjB4NjRCRjYwOTdhNzEyYmRiMDhERDZmYjhEQ2YzZjE3QjE3YjBEYzk0ZCIsInZlcnNpb24iOiIxLjAuMCIsInNjb3BlIjpbIk5GQyIsIk1SWiIsIkxJVkVORVNTIl0sImlhdCI6MTY4NjgzOTQxMCwiZXhwIjoxNzE4NDYxODEwLCJhdWQiOiJTREsgTGljZW5zZSJ9.g9EIS6SQV8n-HfvKPYacw873evxRUs3Ol6d4AVggXtBVuUZbUA7lBLATA9_KN2jU-Xixbslkcs8ffqmDOSp3dRQBZccssGudm-0ptQHaS9PtexdnJDlAqGKCxYyejTZXWF-l1CWV-k8oh_pH8kV9m0kTGRixUkCZymn_mB29U3nk0qIVDnEtIf8jglLDy8L2R7bAZrBpxvGj6qisMcBmkOtjtK11uUv2MyKO1fz9gEmUo2GCyBOYtkz3Wpbq5IUYGWdjG0IMaJ22wZ-almosRupv1_VyKfeI7jTHaR7-lpc7vfWIf6QQngfldazdy8mEpuj6mRXDpqrsz2OqXQ_xlJ0r_sYnPtWit4MPeSam8MpKHMUiq7fzcBUtvzrOjLHs1myywHDUk3axNPzSHB7MoUx5jGLUlJ-eiYfJjaZ9Ft-yNl-_vQlj8sfQdVsygpfeHkzpkIvvIzrXIcqFsegUchJSsHf4_7s3aJj_sEvPMtisWHbC_zznubwMau3gjTO0IRwSdoYJnYxd4thdNLBDXMUoGJaOAZgXea3KNu_gE74w9cGmj-z4VftRpiH3mrd5yn6Q82p4SG2NvU47Nsu8rCjS5kMpNHNlrbaxOs9OzBFWmUnud8dLckJbRj9zh0TKK1t8v2T2eLbzGSQ_5HBjoz90C-qgsscN0WjH1wAirnc";
            // PROD JWT
            // const jwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaWQiOiJkaWQ6ZGlkdXg6MHg2NEJGNjA5N2E3MTJiZGIwOERENmZiOERDZjNmMTdCMTdiMERjOTRkIiwidmVyc2lvbiI6IjEuMC4wIiwic2NvcGUiOlsiTkZDIiwiTVJaIiwiTElWRU5FU1MiXSwiaWF0IjoxNjg2ODM5NDEwLCJleHAiOjE3MTg0NjE4MTAsImF1ZCI6IlNESyBMaWNlbnNlIn0.aPnaXyzeW3XaYXBWiINU72xi8i98wdbmQkdU0VVhYk7VvsnV_mr173MdsfQ341mNUTnD8MI5jPT_L-0p6U06Ojt45F_9o4GNOlQFwyB1cAH10LS-gvYuHTKvenN5iHhtNdJ5AtHU4eA7cpy_DgOBEQF1VAa47bUXpXQKfTKD5j2WvKhGUKvneMPwrqGEyUjmVzzRw4a-PUGXtYBK0H-srHoA1m9glD6io5YUcdh3ZGvZ8m-kfhSJloi2ws6BfAk-A78sEeCSDZg5p-gWreXLB-RCkX-6DQx-Pko46Gf3fkTmJ9O9eRlmNOl3egOnx-8zLpGkoAV7nx826uRj3whj6-FXUjLJ5fh-Cl9bVbATjejxg9qir6jtd8O1XVmFO1fC-SC1dNlZMlM2KhMhd99uDbzUG3BrWCPQZ5pzezUJVVmw2i5yl7NTysOUGV0zb39UkOGFJCdUsfZHbyqXzvl_A8smYCoNv_jS-Ft-RfM6R5fK5YOJNkONtQ9hEFwCJpircHPcaZ8wVc0ldILGfcfvYbhkddYT-jHmyIGLZVbCdCW0ZF94PlbgZ9ZE35xujWCCOH4PlRxbxMRmeXUpW15dxiL0nHKuO6LXeveJcgg_LdPqBTJMbR0lfAvGv3BJniwGtOoWS0RztGwjnKE_UJ2Mev7IHiuMx-X_0l8KGLxQgNo"
            console.log("Initialize library with JWT:", jwt);
            const result = await EpassReader.initialize({ jwt });
            console.log("Valid jwt:", result);
        } catch (error) {
            console.error(error);
        }
    }

    async mrz(): Promise<void> {
        this.mrzCredentials = await EpassReader.scanMrz();
        console.log("MRZ Credentials:", this.mrzCredentials);
    }

    async nfc(): Promise<void> {
        try {
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
            console.log("NFC Data groups:", this.datagroups);

            const dg1Data = this.readerHelper.extractMRZFromDG1(new Uint8Array(this.datagroups.DG1));
            const dg2Data = this.readerHelper.extractImageFromDG2(new Uint8Array(this.datagroups.DG2));

            console.log("Basic information:", dg1Data.fields);
            console.log("Document image:", dg2Data);
        } catch (error) {
            console.error(error);
        }
        this.removeNfcListeners();
        this.nfcEnabled = false;
    }

    onPassportReadStart(): void {
        this.nfcProgressValue = 0;
        console.log("onPassportReadStart");
    }

    onPassportNfcProgress(event: IPassportNfcProgressEvent): void {
        const nfcStep = event.step;
        const nfcTotalSteps = 7;
        this.ngZone.run(() => {
            this.nfcProgressValue = parseInt(((nfcStep / nfcTotalSteps) * 100).toFixed(0));
            console.log(`NFC Progress ${this.nfcProgressValue}%`);
        });
    }

    onPassportReadError(event: IPassportNfcProgressErrorEvent): void {
        console.error("onPassportReadError event:", event);
        // this.nfcEnabled = false;
        // When the MRZ is faulty
        if (event.error === "ConnectionLost") {
            console.error("Connection lost");
        } else if (event.exception && event.exception.includes("onPACEException") && event.message && event.message.includes("SW = 0x6300: Unknown")) {
            console.error("Incorrect MRZ credentials for NFC chip");
        }
    }

    async iosMrzInvalidError(): Promise<void> {
        this.nfcEnabled = false;
        await EpassReader.stopNfc();
    }

    addNfcListeners(): void {
        window.addEventListener("iosMrzInvalid", this.iosMrzInvalidReference);
        window.addEventListener("onPassportReadStart", this.onPassportReadStartReference);
        window.addEventListener("onPassportReadError", this.onPassportReadErrorReference);
        window.addEventListener("onPassportNfcProgress", this.onPassportReadNfcProgressReference);
    }

    removeNfcListeners(): void {
        window.removeEventListener("iosMrzInvalid", this.iosMrzInvalidReference);
        window.removeEventListener("onPassportReadStart", this.onPassportReadStartReference);
        window.removeEventListener("onPassportReadError", this.onPassportReadErrorReference);
        window.removeEventListener("onPassportNfcProgress", this.onPassportReadNfcProgressReference);
    }
}