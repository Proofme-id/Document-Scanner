import { EpassCredentialComponent } from './components/epass-credentials/epass-credentials.component';
import { SdkProvider } from './providers/sdk.provider';
import { ProofmeToggleComponent } from './components/proofme-toggle/proofme-toggle.component';
import { SettingsModal } from './modals/settings/settings.modal';
import { DocumentPage } from './pages/document/document.page';
import { DriverPage } from './pages/driver/driver.page';
import { EpassPage } from './pages/epass/epass.page';
import { PopperDirective } from './directives/popper-directive';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { ChangeDetectorRef, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule, IonicRouteStrategy } from "@ionic/angular";
import { AppComponent } from './app.component';
import { AngularSvgIconModule } from "angular-svg-icon";
import { HttpClientModule } from "@angular/common/http";
import { CarouselComponent } from './components/carousel/carousel.component';
import { RouteReuseStrategy } from '@angular/router';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppRoutingModule } from './app-routing.module';
import { MainPage } from './pages/main/main.page';
import { CommonModule } from '@angular/common';
import { DriverCredentialComponent } from './components/driver-credentials/driver-credentials.component';
import { PhotoCredentialComponent } from './components/photo-credential.component.ts/photo-credential.component';
import { FormsModule } from "@angular/forms";

@NgModule({
    declarations: [
        AppComponent,
        CarouselComponent,
        HeaderComponent,
        ProofmeToggleComponent,
        EpassCredentialComponent,
        DriverCredentialComponent,
        PhotoCredentialComponent,

        // Modals
        SettingsModal,

        // Pages
        MainPage,
        EpassPage,
        DriverPage,
        DocumentPage,

        // Directives
        PopperDirective,
    ],
    imports: [
        FormsModule,
        BrowserModule,
        RouterModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,
        CommonModule,
        IonicModule,
        AngularSvgIconModule.forRoot(),
    ],
    providers: [
        SdkProvider,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
