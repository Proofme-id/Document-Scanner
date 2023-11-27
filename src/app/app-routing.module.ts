import { EpassPage } from './pages/epass/epass.page';
import { DriverPage } from './pages/driver/driver.page';
import { DocumentPage } from './pages/document/document.page';
import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";
import { MainPage } from "./pages/main/main.page";

const routes: Routes = [
    {
        path: "",
        redirectTo: "home",
        pathMatch: "full"
    },
    {
        path: "home",
        component: MainPage,
        data: { animation: "right" }
    },
    {
        path: "epass",
        component: EpassPage,
        data: { animation: "left" }
    },
    {
        path: "driver",
        component: DriverPage,
        data: { animation: "left" }
    },
    {
        path: "document",
        component: DocumentPage,
        data: { animation: "left" }
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
