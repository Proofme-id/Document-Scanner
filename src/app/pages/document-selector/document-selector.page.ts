import { ActivatedRoute, Router } from '@angular/router';
import { SdkProvider } from 'src/app/providers/sdk.provider';
import { Component } from '@angular/core';
import { EHeaderType } from "src/app/enums/headerType.enum";
import { ESdkStatus } from "src/app/enums/sdkStatus.enum";
import { EDetectionType } from "src/app/enums/detectionType.enum";
import { EDocumentType } from "@proofme-id/sdk/web/enums/documentType.enum";

@Component({
    selector: 'app-document-selector',
    templateUrl: './document-selector.page.html',
    styleUrls: ['./document-selector.page.scss']
})
export class DocumentSelectorPage {
    ESdkStatus = ESdkStatus;
    EHeaderType = EHeaderType;
    EDocumentType = EDocumentType
    EDetectionType = EDetectionType;
    headerType = EHeaderType.STATUS;
    sdk = this.sdkProvider;
    detectionType: EDetectionType;
    documentType: EDocumentType;
    

    constructor(
        private sdkProvider: SdkProvider,
        private router: Router,
        private route: ActivatedRoute
    ) { 
        this.route.queryParams.subscribe((queryParams) => {
            this.detectionType = queryParams["detectionType"];
            if (queryParams["documentType"]) {
                this.documentType = queryParams["documentType"];
            }
        });
    }

    clickedFlow(documentType: EDocumentType): void {
        this.sdkProvider.resetCredentials();
        this.sdkProvider.detectDocumentConfig.documentType = documentType
        let routeUrl = "";
        if (documentType === EDocumentType.DRIVER_LICENSE) {
            routeUrl = "/driver";
        } else if (documentType === EDocumentType.ID_CARD || documentType === EDocumentType.PASSPORT) {
            if (this.detectionType === EDetectionType.MANUAL) {
                routeUrl = "/document";
            } else if (this.detectionType === EDetectionType.AUTOMATIC) {
                routeUrl = "/epass";
            }
        }
        this.router.navigate([routeUrl], { queryParams: { 
            detectionType: this.detectionType,
            documentType
        }})
    }

    clickedBack(): void {
        this.router.navigate(["home"]);
    }
}
