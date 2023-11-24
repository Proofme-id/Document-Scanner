import { SdkProvider } from 'src/app/providers/sdk.provider';
import { EDataGroup } from '@proofme-id/sdk/web/reader/enums';
import { inOutFadeAnimation } from "src/animations";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ESettingsType } from "src/app/enums/settingsType.enum";

@Component({
    selector: "settings-modal",
    templateUrl: "settings.modal.html",
    styleUrls: ["settings.modal.scss"],
    animations: [inOutFadeAnimation]
})
export class SettingsModal {
    @Output() close = new EventEmitter();
    @Output() settingClicked = new EventEmitter();
    @Input() type = ESettingsType.EPASS;
    EDataGroup = EDataGroup;
    ESettingsType = ESettingsType;
    test = false;

    constructor(
        public sdkProvider: SdkProvider
    ) { }

    closeMe(): void {
        this.close.emit();
    }

    clickedSetting(dgGroup: EDataGroup): void {
        if (this.dgGroupChecked(dgGroup)) {
            this.sdkProvider.settingsDataGroups = this.sdkProvider.settingsDataGroups.filter(x => x !== dgGroup)
        } else {
            this.sdkProvider.settingsDataGroups.push(dgGroup)
        }
    }

    dgGroupChecked(dgGroup: EDataGroup): boolean {
        return this.sdkProvider.settingsDataGroups.includes(dgGroup)
    }

    detectDocumentPropertyChecked(property: string, subProperty: string): boolean {
        return this.sdkProvider.detectDocumentConfig[property][subProperty]
    }

    setDocumentConfigProperty(property: string, subProperty: string): void {
        // if detect, and detect is currently true
        if (subProperty === "detect" && this.sdkProvider.detectDocumentConfig[property].detect) {
            this.sdkProvider.detectDocumentConfig[property].detect = false
            this.sdkProvider.detectDocumentConfig[property].required = false
            this.sdkProvider.detectDocumentConfig[property].srcImage = false
        } else if (subProperty === "detect" || this.sdkProvider.detectDocumentConfig[property].detect) {
            this.sdkProvider.detectDocumentConfig[property][subProperty] = !this.sdkProvider.detectDocumentConfig[property][subProperty]
        }
    }
}
