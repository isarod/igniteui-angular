import {
    AfterContentInit,
    ChangeDetectionStrategy,
    Component,
    ContentChildren,
    Input,
    QueryList,
    forwardRef,
    OnInit,
    Inject,
    ElementRef,
    ChangeDetectorRef,
    ComponentFactoryResolver,
    IterableDiffers,
    ViewContainerRef,
    NgZone,
    AfterViewInit,
    OnChanges,
    Output,
    EventEmitter,
    Optional
} from '@angular/core';
import { IgxColumnComponent } from '.././column.component';
import { IgxHierarchicalGridComponent } from './hierarchical-grid.component';
import { IgxGridBaseComponent, IgxGridComponent, GridBaseAPIService, IgxGridTransaction } from '../grid';
import { IgxHierarchicalGridAPIService } from './hierarchical-grid-api.service';
import { IgxSelectionAPIService } from '../../core/selection';
import { Transaction, TransactionType, TransactionService, State } from '../../services/index';
import { IgxGridNavigationService } from '../grid-navigation.service';
import { DOCUMENT } from '@angular/common';
import { IgxFilteringService } from '../filtering/grid-filtering.service';
import { IDisplayDensityOptions, DisplayDensityToken, DisplayDensityBase } from '../../core/displayDensity';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'igx-row-island',
    template: ``
})
export class IgxRowIslandComponent extends IgxGridComponent implements AfterContentInit, OnInit, AfterViewInit, OnChanges {
    private layout_id = `igx-row-island-`;
    private hgridAPI;
    private isInit = false;
    public initialChanges;
    @ContentChildren(IgxColumnComponent, { read: IgxColumnComponent, descendants: false })
    public childColumns = new QueryList<IgxColumnComponent>();

    @ContentChildren(IgxColumnComponent, { read: IgxColumnComponent, descendants: true })
    public allColumns = new QueryList<IgxColumnComponent>();

    @ContentChildren(IgxRowIslandComponent, { read: IgxRowIslandComponent, descendants: false })
    children = new QueryList<IgxRowIslandComponent>();

    @Output()
    public onLayoutChange = new EventEmitter<any>();

    @Input() public key: string;

    public parent = null;

    get id() {
        const pId = this.parentId ? this.parentId.substring(this.parentId.indexOf(this.layout_id) + this.layout_id.length) + '-' : '';
        return this.layout_id + pId +  this.key;
    }

    get parentId() {
       return this.parent ? this.parent.id : null;
    }

    get level() {
        let ptr = this.parent;
        let lvl = 0;
        while (ptr) {
            lvl++;
            ptr = ptr.parent;
        }
        return lvl + 1;
    }
    ngAfterContentInit() {
        this.children.reset(this.children.toArray().slice(1));
        this.children.forEach(child => {
            child.parent = this;
        });
        const nestedColumns = this.children.map((layout) => layout.allColumns.toArray());
        const colsArray = [].concat.apply([], nestedColumns);
        const topCols = this.allColumns.filter((item) => {
            return colsArray.indexOf(item) === -1;
        });
        this.childColumns.reset(topCols);
    }
    ngOnInit() {
    }
    ngAfterViewInit() {
        console.log('rowIsland width ID: ' + this.id + ' registered');
        this.hgridAPI.registerLayout(this);
    }
    ngOnChanges(changes) {
        this.onLayoutChange.emit(changes);
        if (!this.isInit) {
            this.initialChanges = changes;
        }
    }

    reflow() {}

    getGrids() {
        return this.hgridAPI.getChildGridsForRowIsland(this.id);
    }

    constructor(
        gridAPI: GridBaseAPIService<IgxGridBaseComponent>,
        selection: IgxSelectionAPIService,
        @Inject(IgxGridTransaction) _transactions: TransactionService<Transaction, State>,
        elementRef: ElementRef,
        zone: NgZone,
        @Inject(DOCUMENT) public document,
        cdr: ChangeDetectorRef,
        resolver: ComponentFactoryResolver,
        differs: IterableDiffers,
        viewRef: ViewContainerRef,
        navigation: IgxGridNavigationService,
        filteringService: IgxFilteringService,
        @Optional() @Inject(DisplayDensityToken) protected _displayDensityOptions: IDisplayDensityOptions) {
        super(
            gridAPI,
            selection,
            _transactions,
            elementRef,
            zone,
            document,
            cdr,
            resolver,
            differs,
            viewRef,
            navigation,
            filteringService,
            _displayDensityOptions
        );
        this.hgridAPI = <IgxHierarchicalGridAPIService>gridAPI;
    }
}

