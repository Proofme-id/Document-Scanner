import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2 } from "@angular/core";
import { EPopperPosition } from "../enums/popperPosition.enum";
import { EPopperTrigger } from "../enums/popperTrigger.enum";

/**
 * General note(s):
 *  - No need to calculate with rem; We calculate off of the div that triggers the popper, which is calculated with rem, thus we scale the popper automatically.
 */

@Directive({
    selector: "[popper]"
})
export class PopperDirective implements OnDestroy {
    @Input() popper: string | HTMLElement = "No text configured";
    @Input() popperTrigger: EPopperTrigger = EPopperTrigger.HOVER;
    @Input() showByDefault = false;
    @Input() popperPosition: EPopperPosition = EPopperPosition.BOTTOM;
    @Input() popperArrow = true;
    @Input() popperClasses = "";
    @Input() popperFadeOutDelay = 1000;
    popperDiv = null
    firstClick = true;
    removeTimeout: NodeJS.Timeout;
    destroyListener: ()=> void;
    resizeListener: ()=> void;

    constructor(
        private element: ElementRef,
        private renderer: Renderer2
    ) { }

    ngOnDestroy(): void {
        if (this.popperDiv) {
            this.removePopper(true, true)
        }

        if (this.destroyListener) {
            this.destroyListener();
        }

        if (this.resizeListener) {
            this.resizeListener();
        }
    }

    @HostListener("click")
    handleClick(): void {
        if (this.popperTrigger === EPopperTrigger.CLICK && !this.popperDiv) {
            this.createPopper()
            this.destroyListener = this.renderer.listen("document", "click", this.handleDocumentClick);
            this.resizeListener = this.renderer.listen("window", "resize", this.handleDocumentResize)

            // 0 Means it is persistent and we just let it stay until clicked elsewhere.
            if (this.popperFadeOutDelay > 0) {
                this.removePopper();
            }
        }
    }

    /**
     * Basically our version of clickOutside.
     * @param event Click event
     */
    handleDocumentClick = (event: Event): void => {
        if (this.popperDiv && this.popperTrigger === EPopperTrigger.CLICK) {
            const target = event.target as Node;

            if (target !== this.popperDiv && this.element.nativeElement !== target && !this.element.nativeElement.contains(target)) {
                this.removePopper(true);
                this.destroyListener();
            }
        }
    }

    // Resizing page removes all poppers instantly thus we dont have to worry about recalculating position for resized page.
    handleDocumentResize = (): void => {
        this.resizeListener();
        this.removePopper(true, true)
    }

    @HostListener("mouseenter")
    onMouseEnter(): void {
        if (this.popperTrigger === EPopperTrigger.HOVER && !this.popperDiv) {
            // We let the popper fade out after 100ms of the mouse hovering away if its a hover.
            this.popperFadeOutDelay = 100;
            this.createPopper();
        } else if (this.popperTrigger === EPopperTrigger.HOVER && this.popperDiv) {
            // Remove popper then re-create because otherwise if we hover too fast (within the duration of the animation timeout)
            // Then we dont get a popper at all; this way we always see one if that happens.
            this.removePopper(true, true);
            this.createPopper();
        }
    }

    @HostListener("mouseleave")
    onMouseLeave(): void {
        if (this.popperDiv && this.popperTrigger === EPopperTrigger.HOVER) {
            this.removePopper();
        }
    }

    createPopper(): void {
        // This if is purely for when the user hovers in and out within the time of the timeout duration;
        // Otherwise it will never be triggered.
        // If this isnt here and we hover over the div within the timeout duration, then no popper appears.
        if (this.popperDiv && this.removeTimeout) {
            this.removePopper(true)
        }

        this.popperDiv = this.renderer.createElement("div");
        this.renderer.addClass(this.popperDiv, "popper");
        if (typeof this.popper === "string") {
            const popperText = this.renderer.createText(this.popper);

            this.renderer.appendChild(this.popperDiv, popperText);
        } else {
            // If its not a string (then its an element) we append the element itself to the popper.
            // If this element is ever too big the popper will look weird, then again, if the content thats inserted is too big, it maybe shouldnt be a popper.
            this.renderer.appendChild(this.popperDiv, this.popper)
        }
        this.renderer.appendChild(document.body, this.popperDiv);


        this.handlePopperFade();
        this.addPopperClasses(this.popperClasses);
        this.calculatePopperPosition();

        if (this.popperArrow) {
            this.createPopperArrow();
        }
    }

    /**
     * Theres 3 ways of removing a popper
     *  - The default way; with fadeout animation
     *  - With fadeout but instantly (Triggered when -> Create popper with 5000 second fadeout -> Click next to that popper so its supposed to fade out instantly)
     *  - And with out animation and instantly; Only triggered on onDestroy.
     * @param instant
     * @param hideAnimation
     */
    removePopper(instant?: boolean, hideAnimation?: boolean): void {
        const transitionDuration = 150;
        if (!instant) {
            this.removeTimeout = setTimeout(() => {
                this.handlePopperFade();
                clearTimeout(this.removeTimeout)
                this.removeTimeout = setTimeout(() => {
                    this.renderer.removeChild(document.body, this.popperDiv)
                    this.popperDiv = null;
                }, transitionDuration);
            }, this.popperFadeOutDelay);
        } else if (instant && !hideAnimation) {
            this.handlePopperFade();
            // To clear already existing timeouts
            clearTimeout(this.removeTimeout)
            this.removeTimeout = setTimeout(() => {
                this.renderer.removeChild(document.body, this.popperDiv)
                this.popperDiv = null;
            }, transitionDuration);
        } else if (instant && hideAnimation) {
            // To clear already existing timeouts
            clearTimeout(this.removeTimeout)
            this.renderer.removeChild(document.body, this.popperDiv)
            this.popperDiv = null;
        }
    }

    /**
     * Calculates the position of the popper related to the rectangle (The div that triggered the popper)
     */
    calculatePopperPosition(): void {
        // Get position of popper trigger element
        const rectangle = this.element.nativeElement.getBoundingClientRect();
        // Set to 4 by default; If no arrow is present we just bump the popper by 4 pixels away from the div that triggered the popper for some whitespace atleast.
        let arrowSpacing = 4;

        if (this.popperPosition === EPopperPosition.BOTTOM || this.popperPosition === EPopperPosition.TOP) {
            let top: number;

            if (this.popperPosition === EPopperPosition.BOTTOM) {
                // Center bottom
                if (this.popperArrow) {
                    // Divide by 4 is magic number that feels right after playing with it.
                    arrowSpacing = this.popperDiv.clientHeight / 4;
                }
                top = rectangle.top + rectangle.height + arrowSpacing;
            } else {
                // Center top
                // We calculate the arrow height from cleintHeight; it is clientHeight / 2 (half of popper height)
                // Therefor we want to make space for the arrow by doing 1.5*
                if (this.popperArrow) {
                    // Multiply by 1.5x is magic number that feels right after playing with it.
                    arrowSpacing = this.popperDiv.clientHeight * 1.5;
                }
                top = rectangle.top - arrowSpacing;
            }

            // Position the popper's middle with the div's middle.
            const middle = rectangle.left + (rectangle.width / 2);
            const popperWidth = this.popperDiv.offsetWidth;
            const left = middle - (popperWidth / 2);

            this.renderer.setStyle(this.popperDiv, "top", `${top}px`);
            this.renderer.setStyle(this.popperDiv, "left", `${left}px`);
        } else if (this.popperPosition === EPopperPosition.RIGHT || this.popperPosition === EPopperPosition.LEFT) {
            // Divide height / 4 so the middle of our popper is aligned with the middle of the div that triggered the popper.
            let topDivideBy = 4;

            // If we reached max width; its highly likely (unless some major coincidence)
            // That we have a 2nd line in the popper; thus to align we need to divide by 2.5 instead of 4.
            if (this.popperLikelyHasSecondLine()) {
                topDivideBy = 2.5;
            }
            const top = rectangle.top - (this.popperDiv.clientHeight / topDivideBy);

            let left: number;
            if (this.popperPosition === EPopperPosition.RIGHT) {
                // Position the popper's middle with the div's middle.

                if (this.popperArrow) {
                    // Divide by 5 is magic number that feels right after playing with it.
                    arrowSpacing = this.popperDiv.clientHeight / 5;
                }
                left = rectangle.left + rectangle.width + arrowSpacing;
            } else {
                if (this.popperArrow) {
                    // Multiply by 0.25x is magic number that feels right after playing with it.
                    arrowSpacing = this.popperDiv.clientHeight * 0.25;
                }
                left = rectangle.left - this.popperDiv.clientWidth - arrowSpacing
            }

            this.renderer.setStyle(this.popperDiv, "top", `${top}px`);
            this.renderer.setStyle(this.popperDiv, "left", `${left}px`);
        }
    }

    /**
     * Create the popper arrow:
     *  - Arrow is always on the reverse side of the popper, e.g: popperPosition = top, then arrow = bottom.
     *  - Arrow width + height is always half of the popper's width / height.
     *       - We should never aim for big poppers anyway, these are small tooltips to explain, if they get too big then its not a popper that should be used.
     */
    createPopperArrow(): void {
        const arrowDiv = this.renderer.createElement("div");
        this.renderer.addClass(arrowDiv, "popper-arrow")

        let divideBy = 2;
        if (this.popperLikelyHasSecondLine()) {
            divideBy = 4
        }

        this.renderer.setStyle(arrowDiv, "width", `${Math.floor(this.popperDiv.clientHeight / divideBy)}px`)
        this.renderer.setStyle(arrowDiv, "height", `${Math.floor(this.popperDiv.clientHeight / divideBy)}px`)

        // We calculate the position of the arrow off of the height of the popper div.
        const height = this.popperDiv.clientHeight

        // For up / down arrows we divide the height by 4 so the arrow is shown on top / bottom.
        const upDownDivider = 4;
        // For left / right arrows we divide the height by 6 so the arrow is shown on the left / right.
        const leftRightDivider = 6;

        // Correctionpixels = 20% of the arrow height.
        const correctionPixels = Math.floor((this.popperDiv.clientHeight / divideBy) / 5);

        // Calculate the position + round down.
        if (this.popperPosition === EPopperPosition.TOP) {
            this.renderer.setStyle(arrowDiv, EPopperPosition.BOTTOM, `-${Math.floor(height / upDownDivider)}px`)
        } else if (this.popperPosition === EPopperPosition.BOTTOM) {
            this.renderer.setStyle(arrowDiv, EPopperPosition.TOP, `-${Math.floor(height / upDownDivider - correctionPixels)}px`)
        } else if (this.popperPosition === EPopperPosition.RIGHT) {
            this.renderer.setStyle(arrowDiv, EPopperPosition.LEFT, `-${Math.floor(height / leftRightDivider - correctionPixels)}px`)
        } else if (this.popperPosition === EPopperPosition.LEFT) {
            this.renderer.setStyle(arrowDiv, EPopperPosition.RIGHT, `-${Math.floor(height / leftRightDivider - correctionPixels)}px`)
        }

        this.renderer.appendChild(this.popperDiv, arrowDiv)
    }

    /**
     * Adds fade class to popper / removes if already added to popperTrigger opacity transition.
     */
    handlePopperFade(): void {
        const fadeClassName = "full-opacity"
        if (this.popperDiv.classList.contains(fadeClassName)) {
            this.renderer.removeClass(this.popperDiv, fadeClassName)
        } else {
            // Need timeout to update since otherwise the 0 -> 1 opacity transition doesnt work.
            setTimeout(() => {
                this.renderer.addClass(this.popperDiv, fadeClassName)
            });
        }
    }

    /**
     * If we reached max width; its highly likely (unless some major coincidence)
     * That we have a 2nd line in the popper
     * @returns boolean of whether we likely have a second line.
     */
    popperLikelyHasSecondLine(): boolean {
        const currentWidth = Math.floor(this.popperDiv.offsetWidth);
        const maxWidth = Math.floor(parseInt(getComputedStyle(this.popperDiv).maxWidth));
        return currentWidth === maxWidth
    }

    /**
     * Not much explaining to do; split on , for class array, then loop through class array
     * @param classes The classes from input popperClasses
     */
    addPopperClasses(classes: string): void {
        if (classes) {
            // Split comma seperated string into array
            const classesArray: string[] = classes.split(",").map(className => className.trim());

            for (const cssClass of classesArray) {
                this.renderer.addClass(this.popperDiv, cssClass)
            }
        }
    }
}
