import { SdkProvider } from 'src/app/providers/sdk.provider';
import { ESdkStatus } from './../../enums/sdkStatus.enum';
import { EPopperTrigger } from './../../enums/popperTrigger.enum';
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { EHeaderType } from 'src/app/enums/headerType.enum';
import { EPopperColors } from 'src/app/enums/popperColors.enum';

@Component({
    selector: "app-header",
    templateUrl: "header.component.html",
    styleUrls: ["header.component.scss"]
})

export class HeaderComponent {
    EPopperTrigger = EPopperTrigger;
    EHeaderType = EHeaderType;

    @Input() type_ = EHeaderType.STATUS;
    @Output() clickedSettings = new EventEmitter();

    constructor(
        private router: Router,
        private sdkProvider: SdkProvider
    ) { }

    getStatusColor(): string {
        if (this.sdkProvider.sdkStatus === ESdkStatus.ACTIVE) {
            return EPopperColors.GREEN;
        } else if (this.sdkProvider.sdkStatus === ESdkStatus.REVOKED) {
            return EPopperColors.RED;
        } else {
            return EPopperColors.GRAY;
        }
    }

    getPopperText(): string {
        if (this.sdkProvider.sdkStatus === ESdkStatus.ACTIVE) {
            return "License approved"
        } else if (this.sdkProvider.sdkStatus === ESdkStatus.REVOKED) {
            return "License expired"
        } else {
            return "License inactive"
        }
    }


    goHome(): void {
        if (!this.sdkProvider.nfcEnabled) {
            this.router.navigate(["home"]);
        }
    }

    clickedSettingsFunction(): void {
        this.clickedSettings.emit();
    }
}
