import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AngularSvgIconModule } from "angular-svg-icon";
import { HttpClientModule } from "@angular/common/http";
import { CarouselComponent } from './components/carousel/carousel.component';

@NgModule({
    declarations: [
        AppComponent,
        CarouselComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AngularSvgIconModule.forRoot(),
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
