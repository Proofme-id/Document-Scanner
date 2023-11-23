import { trigger, transition, style, animate } from "@angular/animations";

export const inOutFadeAnimation = trigger(
    "inOutFadeAnimation",
    [
        transition(
            ":enter",
            [
                style({ opacity: 0 }),
                animate("0.2s linear", style({ opacity: 1 }))
            ]
        ),
        transition(
            ":leave",
            [
                style({ opacity: 1 }),
                animate("0.2s linear", style({ opacity: 0 }))
            ]
        )
    ]
)
