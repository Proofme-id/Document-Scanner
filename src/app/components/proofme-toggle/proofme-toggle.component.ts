import { Component, Input } from "@angular/core";

@Component({
    selector: "proofme-toggle",
    templateUrl: "proofme-toggle.component.html",
    styleUrls: ["proofme-toggle.component.scss"]
})
export class ProofmeToggleComponent {
    @Input() loading: boolean;
    @Input() checked: boolean;
    @Input() disabled: boolean;
}
