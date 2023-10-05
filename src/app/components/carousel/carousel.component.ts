import { AfterViewInit, Component, EventEmitter, Input, NgZone, Output, ViewChild } from '@angular/core';
import { IImage } from "src/app/interfaces/image.interface";

@Component({
    selector: 'carousel',
    templateUrl: './carousel.component.html',
    styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements AfterViewInit {
    @Input() images: IImage[];

    @Output() indexChanged = new EventEmitter<number>();

    carouselContainer: HTMLDivElement;
    isDragging = false;
    currentTranslateX = 0;
    slideIndex = 0;
    startPosX = 0;

    constructor(
        private ngZone: NgZone
    ) {}

    ngAfterViewInit(): void {
        this.carouselContainer = document.querySelector('.carousel-container') as HTMLDivElement;

        this.carouselContainer.addEventListener('mousedown', (e) => this.startDrag(e));
        this.carouselContainer.addEventListener('touchstart', (e) => this.startDrag(e));

        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('touchmove', (e) => this.drag(e));

        document.addEventListener('mouseup', () => this.endDrag());
        document.addEventListener('touchend', () => this.endDrag());

        this.updateCarousel();
    }

    startDrag(event: MouseEvent | TouchEvent) {
        this.isDragging = true;
        this.startPosX = this.getPositionX(event);
        this.currentTranslateX = this.getTranslateX(this.carouselContainer);
    }

    drag(event: MouseEvent | TouchEvent) {
        if (!this.isDragging) return;

        const currentPosX = this.getPositionX(event);
        const diffX = currentPosX - this.startPosX;
        const translateX = this.currentTranslateX + diffX;

        this.carouselContainer.style.transition = 'none';
        this.carouselContainer.style.transform = `translateX(${translateX}px)`;
    }

    updateSlideIndex() {
        const slideWidth = this.carouselContainer.clientWidth;
        const dragThreshold = slideWidth / 4;

        const dragDistance = this.currentTranslateX - this.getTranslateX(this.carouselContainer);

        this.ngZone.run(() => {
            if (dragDistance < -dragThreshold && this.slideIndex > 0) {
                this.slideIndex--;
            } else if (dragDistance > dragThreshold && this.slideIndex < this.images.length - 1) {
                this.slideIndex++;
            }
            this.indexChanged.emit(this.slideIndex);
        });
    }

    endDrag() {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.updateSlideIndex();

        this.carouselContainer.style.transition = 'transform 0.5s ease-in-out';
        this.updateCarousel();
    }

    getPositionX(event: MouseEvent | TouchEvent): number {
        return event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    }

    getTranslateX(element: HTMLElement): number {
        const style = window.getComputedStyle(element);
        const transform = style.getPropertyValue('transform');
        const matrix = new DOMMatrix(transform);
        return matrix.m41;
    }

    updateCarousel() {
        const slideWidth = this.carouselContainer.clientWidth;
        const offsetX = -this.slideIndex * slideWidth;
        this.carouselContainer.style.transform = `translateX(${offsetX}px)`;
    }
}
