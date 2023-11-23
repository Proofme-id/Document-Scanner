import {Injectable, OnDestroy} from "@angular/core";
import { Subject } from "rxjs";

@Injectable()
export abstract class BaseComponent implements OnDestroy {
    private destroySubject: Subject<boolean>;

    get destroy$() {
        if (!this.destroySubject) { 
            // Perf optimization:
            // since this is likely used as base component everywhere
            // only construct a Subject instance if actually used
            this.destroySubject = new Subject();
        }
        return this.destroySubject;
    }

    ngOnDestroy() {
        if (this.destroySubject) {
            this.destroySubject.next(true);
            this.destroySubject.complete();
        }
    }
}
