import { DOCUMENT } from '@angular/common';
import {
    AfterContentInit,
    AfterViewInit,
    ChangeDetectorRef,
    ComponentFactoryResolver,
    ContentChildren,
    ContentChild,
    ElementRef,
    EventEmitter,
    HostBinding,
    Inject,
    Input,
    IterableChangeRecord,
    IterableDiffers,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    InjectionToken,
    Optional
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, first, filter } from 'rxjs/operators';
import { IgxSelectionAPIService } from '../core/selection';
import { cloneArray, isEdge, isNavigationKey, CancelableEventArgs, flatten, mergeObjects } from '../core/utils';
import { DataType } from '../data-operations/data-util';
import { FilteringLogic, IFilteringExpression } from '../data-operations/filtering-expression.interface';
import { IGroupByRecord } from '../data-operations/groupby-record.interface';
import { ISortingExpression } from '../data-operations/sorting-expression.interface';
import { IForOfState, IgxGridForOfDirective } from '../directives/for-of/for_of.directive';
import { IgxTextHighlightDirective } from '../directives/text-highlight/text-highlight.directive';
import {
    IgxBaseExporter,
    IgxExporterOptionsBase,
    AbsoluteScrollStrategy,
    HorizontalAlignment,
    VerticalAlignment,
    IgxOverlayService
} from '../services/index';
import { IgxCheckboxComponent } from './../checkbox/checkbox.component';
import { GridBaseAPIService } from './api.service';
import { IgxGridCellComponent } from './cell.component';
import { IColumnVisibilityChangedEventArgs } from './column-hiding-item.directive';
import { IgxColumnComponent } from './column.component';
import { ISummaryExpression } from './summaries/grid-summary';
import { DropPosition, ContainerPositioningStrategy, IgxDecimalPipeComponent, IgxDatePipeComponent } from './grid.common';
import { IgxGridToolbarComponent } from './grid-toolbar.component';
import { IgxRowComponent } from './row.component';
import { IgxGridHeaderComponent } from './grid-header.component';
import { IgxOverlayOutletDirective, IgxToggleDirective } from '../directives/toggle/toggle.directive';
import { FilteringExpressionsTree, IFilteringExpressionsTree } from '../data-operations/filtering-expressions-tree';
import { IFilteringOperation } from '../data-operations/filtering-condition';
import { Transaction, TransactionType, TransactionService, State } from '../services/index';
import {
    IgxRowEditTemplateDirective,
    IgxRowEditTabStopDirective,
    IgxRowEditTextDirective,
    IgxRowEditActionsDirective
} from './grid.rowEdit.directive';
import { IgxGridNavigationService } from './grid-navigation.service';
import { IDisplayDensityOptions, DisplayDensityToken, DisplayDensityBase, DisplayDensity } from '../core/displayDensity';
import { IgxGridRowComponent } from './grid';
import { IgxFilteringService } from './filtering/grid-filtering.service';
import { IgxGridFilteringCellComponent } from './filtering/grid-filtering-cell.component';
import { WatchChanges } from './watch-changes';
import { IgxGridHeaderGroupComponent } from './grid-header-group.component';
import { IgxGridToolbarCustomContentDirective } from './grid-toolbar.component';
import { IGridResourceStrings } from '../core/i18n/grid-resources';
import { CurrentResourceStrings } from '../core/i18n/resources';
import { IgxGridSummaryService } from './summaries/grid-summary.service';
import { IgxSummaryRowComponent } from './summaries/summary-row.component';
import { DeprecateMethod, DeprecateProperty } from '../core/deprecateDecorators';
import { IgxGridSelectionService, GridSelectionRange, IgxGridCRUDService, IgxRow, IgxCell } from '../core/grid-selection';
import { DragScrollDirection } from './drag-select.directive';
import { ICachedViewLoadedEventArgs, IgxTemplateOutletDirective } from '../directives/template-outlet/template_outlet.directive';
import {
    IgxExcelStyleSortingTemplateDirective,
    IgxExcelStylePinningTemplateDirective,
    IgxExcelStyleHidingTemplateDirective,
    IgxExcelStyleMovingTemplateDirective
} from './filtering/excel-style/grid.excel-style-filtering.component';
import { IgxGridColumnResizerComponent } from './grid-column-resizer.component';
import { IgxGridFilteringRowComponent } from './filtering/grid-filtering-row.component';
import { IgxDragIndicatorIconDirective } from './row-drag.directive';
import { IgxDragDirective } from '../directives/dragdrop/dragdrop.directive';

const MINIMUM_COLUMN_WIDTH = 136;
const FILTER_ROW_HEIGHT = 50;

// By default row editing overlay outlet is inside grid body so that overlay is hidden below grid header when scrolling.
// In cases when grid has 1-2 rows there isn't enough space in grid body and row editing overlay should be shown above header.
// Default row editing overlay height is higher then row height that is why the case is valid also for row with 2 rows.
// More accurate calculation is not possible, cause row editing overlay is still not shown and we don't know its height,
// but in the same time we need to set row editing overlay outlet before opening the overlay itself.
const MIN_ROW_EDITING_COUNT_THRESHOLD = 2;

export const IgxGridTransaction = new InjectionToken<string>('IgxGridTransaction');

export interface IGridCellEventArgs {
    cell: IgxGridCellComponent;
    event: Event;
}

export interface IGridEditEventArgs extends CancelableEventArgs {
    rowID: any;
    cellID?: {
        rowID: any,
        columnID: any,
        rowIndex: number
    };
    oldValue: any;
    newValue?: any;
    event?: Event;
}

export interface IPinColumnEventArgs {
    column: IgxColumnComponent;
    insertAtIndex: number;
    isPinned: boolean;
}

export interface IPageEventArgs {
    previous: number;
    current: number;
}

export interface IRowDataEventArgs {
    data: any;
}

export interface IColumnResizeEventArgs {
    column: IgxColumnComponent;
    prevWidth: string;
    newWidth: string;
}

export interface IRowSelectionEventArgs {
    oldSelection: any[];
    newSelection: any[];
    row?: IgxRowComponent<IgxGridBaseComponent & IGridDataBindable>;
    event?: Event;
}

export interface ISearchInfo {
    searchText: string;
    caseSensitive: boolean;
    exactMatch: boolean;
    activeMatchIndex: number;
    matchInfoCache: any[];
}

export interface IGridToolbarExportEventArgs {
    grid: IgxGridBaseComponent;
    exporter: IgxBaseExporter;
    options: IgxExporterOptionsBase;
    cancel: boolean;
}

export interface IColumnMovingStartEventArgs {
    source: IgxColumnComponent;
}

export interface IColumnMovingEventArgs {
    source: IgxColumnComponent;
    cancel: boolean;
}

export interface IColumnMovingEndEventArgs {
    source: IgxColumnComponent;
    target: IgxColumnComponent;
}

// TODO: to be deleted when onFocusChange event is removed #4054
export interface IFocusChangeEventArgs {
    cell: IgxGridCellComponent;
    event: Event;
    cancel: boolean;
}

export interface IGridKeydownEventArgs {
    targetType: GridKeydownTargetType;
    target: Object;
    event: Event;
    cancel: boolean;
}

export interface ICellPosition {
    rowIndex: number;
    visibleColumnIndex: number;
}
export interface IGridDataBindable {
    data: any[];
    filteredData: any[];
}

export interface IRowDragEndEventArgs {
    owner: IgxDragDirective;
    dragData: IgxRowComponent<IgxGridBaseComponent & IGridDataBindable>;
}

export interface IRowDragStartEventArgs extends IRowDragEndEventArgs, CancelableEventArgs { }

export enum GridSummaryPosition {
    top = 'top',
    bottom = 'bottom'
}

export enum GridSummaryCalculationMode {
    rootLevelOnly = 'rootLevelOnly',
    childLevelsOnly = 'childLevelsOnly',
    rootAndChildLevels = 'rootAndChildLevels'
}

export enum FilterMode {
    quickFilter = 'quickFilter',
    excelStyleFilter = 'excelStyleFilter'
}

export enum GridKeydownTargetType {
    dataCell = 'dataCell',
    summaryCell = 'summaryCell',
    groupRow = 'groupRow',
    hierarchicalRow = 'hierarchicalRow'
}

export abstract class IgxGridBaseComponent extends DisplayDensityBase implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {
    private _scrollWidth: number;

    public get scrollWidth() {
        return this._scrollWidth;
    }

    private _resourceStrings = CurrentResourceStrings.GridResStrings;
    private _emptyGridMessage = null;
    private _emptyFilteredGridMessage = null;
    private _isLoading = false;
    private _locale = null;
    private _observer: MutationObserver;
    private _destroyed = false;
    private overlayIDs = [];
    /**
     * An accessor that sets the resource strings.
     * By default it uses EN resources.
    */
    @Input()
    set resourceStrings(value: IGridResourceStrings) {
        this._resourceStrings = Object.assign({}, this._resourceStrings, value);
    }

    /**
     * An accessor that returns the resource strings.
    */
    get resourceStrings(): IGridResourceStrings {
        return this._resourceStrings;
    }

    /**
     * An @Input property that autogenerates the `IgxGridComponent` columns.
     * The default value is false.
     * ```html
     * <igx-grid [data]="Data" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    public autoGenerate = false;

    public abstract id: string;

    /**
     * An @Input property that sets a custom template when the `IgxGridComponent` is empty.
     * ```html
     * <igx-grid [id]="'igx-grid-1'" [data]="Data" [emptyGridTemplate]="myTemplate" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    public emptyGridTemplate: TemplateRef<any>;

    /**
     * An @Input property that sets a custom template when the `IgxGridComponent` is loading.
     * ```html
     * <igx-grid [id]="'igx-grid-1'" [data]="Data" [loadingGridTemplate]="myTemplate" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    public loadingGridTemplate: TemplateRef<any>;

    @WatchChanges()
    @Input()
    public get filteringLogic() {
        return this._filteringExpressionsTree.operator;
    }

    /**
     * Sets the filtering logic of the `IgxGridComponent`.
     * The default is AND.
     * ```html
     * <igx-grid [data]="Data" [autoGenerate]="true" [filteringLogic]="filtering"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set filteringLogic(value: FilteringLogic) {
        this._filteringExpressionsTree.operator = value;
    }

    /**
     * Returns the filtering state of `IgxGridComponent`.
     * ```typescript
     * let filteringExpressionsTree = this.grid.filteringExpressionsTree;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    get filteringExpressionsTree() {
        return this._filteringExpressionsTree;
    }

    /**
     * Sets the filtering state of the `IgxGridComponent`.
     * ```typescript
     * const logic = new FilteringExpressionsTree(FilteringLogic.And, "ID");
     * logic.filteringOperands = [
     *     {
     *          condition: IgxNumberFilteringOperand.instance().condition('greaterThan'),
     *          fieldName: 'ID',
     *          searchVal: 1
     *     }
     * ];
     * this.grid.filteringExpressionsTree = (logic);
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set filteringExpressionsTree(value) {
        if (value && value instanceof FilteringExpressionsTree) {
            const val = (value as FilteringExpressionsTree);
            for (let index = 0; index < val.filteringOperands.length; index++) {
                if (!(val.filteringOperands[index] instanceof FilteringExpressionsTree)) {
                    const newExpressionsTree = new FilteringExpressionsTree(FilteringLogic.And, val.filteringOperands[index].fieldName);
                    newExpressionsTree.filteringOperands.push(val.filteringOperands[index] as IFilteringExpression);
                    val.filteringOperands[index] = newExpressionsTree;
                }
            }

            // clone the filtering expression tree in order to trigger the filtering pipe
            const filteringExpressionTreeClone = new FilteringExpressionsTree(value.operator, value.fieldName);
            filteringExpressionTreeClone.filteringOperands = value.filteringOperands;
            this._filteringExpressionsTree = filteringExpressionTreeClone;

            if (this.filteringService.isFilteringExpressionsTreeEmpty()) {
                this.filteredData = null;
            }

            this.filteringService.refreshExpressions();
            this.summaryService.clearSummaryCache();
            this.markForCheck();
        }
    }

    /**
     * Returns the locale of the grid.
     * If not set, returns browser's language.
     */
    @Input()
    get locale(): string {
        if (this._locale) {
            return this._locale;
        } else {
            return 'en';
        }
    }

    /**
     * Sets the locale of the grid.
     */
    set locale(value) {
        this._locale = value;
    }

    /**
     * Returns whether the paging feature is enabled/disabled.
     * The default state is disabled (false).
     * ```
     * const paging = this.grid.paging;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    get paging(): boolean {
        return this._paging;
    }

    /**
     * Enables/Disables the paging feature.
     * ```html
     * <igx-grid #grid [data]="Data" [autoGenerate]="true" [paging]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set paging(value: boolean) {
        this._paging = value;
        this._pipeTrigger++;

        if (this._ngAfterViewInitPassed) {
            this.cdr.detectChanges();
            this.calculateGridHeight();
            this.cdr.detectChanges();
        }
    }

    /**
     * Returns the current page index.
     * ```html
     * let gridPage = this.grid.page;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    get page(): number {
        return this._page;
    }

    /**
     * Sets the current page index.
     * <igx-grid #grid [data]="Data" [paging]="true" [page]="5" [autoGenerate]="true"></igx-grid>
     */
    set page(val: number) {
        if (val === this._page || val < 0 || val > this.totalPages - 1) {
            return;
        }

        this.onPagingDone.emit({ previous: this._page, current: val });
        this._page = val;
        this.cdr.markForCheck();
    }

    /**
     * Returns the number of visible items per page of the `IgxGridComponent`.
     * The default is 15.
     * ```html
     * let itemsPerPage = this.grid.perPage;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    get perPage(): number {
        return this._perPage;
    }

    /**
     * Sets the number of visible items per page of the `IgxGridComponent`.
     * ```html
     * <igx-grid #grid [data]="Data" [paging]="true" [perPage]="5" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set perPage(val: number) {
        if (val < 0) {
            return;
        }

        this.selectionService.clear();
        this._perPage = val;
        this.page = 0;
        this.endEdit(true);
        this.cdr.markForCheck();
    }

    /**
     * You can provide a custom `ng-template` for the pagination UI of the grid.
     * ```html
     * <igx-grid #grid [paging]="true" [myTemplate]="myTemplate" [height]="'305px'"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    public paginationTemplate: TemplateRef<any>;

    /**
     * Returns whether the column hiding UI for the `IgxGridComponent` is enabled.
     * By default it is disabled (false).
     * ```typescript
     * let gridColHiding = this.grid.columnHiding;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    get columnHiding() {
        return this._columnHiding;
    }

    /**
     * Sets whether the column hiding UI for the `IgxGridComponent` is enabled.
     * In order for the UI to work, you need to enable the toolbar as shown in the example below.
     * ```html
     * <igx-grid [data]="Data" [autoGenerate]="true" [showToolbar]="true" [columnHiding]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set columnHiding(value) {
        if (this._columnHiding !== value) {
            this._columnHiding = value;
            if (this.gridAPI.grid) {
                this.markForCheck();
                if (this._ngAfterViewInitPassed) {
                    this.calculateGridSizes();
                }
            }
        }
    }

    /**
     * Sets whether the `IgxGridRowComponent` selection is enabled.
     * By default it is set to false.
     * ```typescript
     * let rowSelectable = this.grid.rowSelectable;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    get rowSelectable(): boolean {
        return this._rowSelection;
    }

    /**
     * Sets whether rows can be selected.
     * ```html
     * <igx-grid #grid [showToolbar]="true" [rowSelectable]="true" [columnHiding]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set rowSelectable(val: boolean) {
        this._rowSelection = val;
        if (this.gridAPI.grid && this.columnList) {

            // should selection persist?
            this.allRowsSelected = false;
            this.deselectAllRows();
            this.calculateGridSizes();
        }
    }

    @Input()
    get rowDraggable(): boolean {
        return this._rowDrag;
    }

    /**
     * Sets whether rows can be moved.
     * ```html
     * <igx-grid #grid [rowDraggable]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set rowDraggable(val: boolean) {
        this._rowDrag = val;
        if (this.gridAPI.grid && this.columnList) {
            this.calculateGridSizes();
        }
    }

    /**
     * @hidden
     * @internal
     */
    public rowDragging = false;


    /**
 * Sets whether the `IgxGridRowComponent` is editable.
 * By default it is set to false.
 * ```typescript
 * let rowEditable = this.grid.rowEditable;
 * ```
 * @memberof IgxGridBaseComponent
 */
    @WatchChanges()
    @Input()
    get rowEditable(): boolean {
        return this._rowEditable;
    }
    /**
    * Sets whether rows can be edited.
    * ```html
    * <igx-grid #grid [showToolbar]="true" [rowEditable]="true" [primaryKey]="'ProductID'" [columnHiding]="true"></igx-grid>
    * ```
    * @memberof IgxGridBaseComponent
    */
    set rowEditable(val: boolean) {
        if (val && (this.primaryKey === undefined || this.primaryKey === null)) {
            console.warn('The grid must have a `primaryKey` specified when using `rowEditable`!');
        }
        this._rowEditable = val;
        if (this.gridAPI.grid) {
            this.refreshGridState();
        }
    }

    /**
     * Returns the height of the `IgxGridComponent`.
     * ```typescript
     * let gridHeight = this.grid.height;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @HostBinding('style.height')
    @Input()
    public get height() {
        return this._height;
    }

    /**
     * Sets the height of the `IgxGridComponent`.
     * ```html
     * <igx-grid #grid [data]="Data" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set height(value: string) {
        if (this._height !== value) {
            this._height = value;
            requestAnimationFrame(() => {
                if (!this._destroyed) {
                    this.reflow();
                    this.cdr.markForCheck();
                }
            });
        }
    }

    /**
     * Returns the width of the `IgxGridComponent`.
     * ```typescript
     * let gridWidth = this.grid.width;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @HostBinding('style.width')
    @Input()
    public get width() {
        return this._width;
    }

    /**
     * Sets the width of the `IgxGridComponent`.
     * ```html
     * <igx-grid #grid [data]="Data" [width]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set width(value: string) {
        if (this._width !== value) {
            this._width = value;
            requestAnimationFrame(() => {
                // Calling reflow(), because the width calculation
                // might make the horizontal scrollbar appear/disappear.
                // This will change the height, which should be recalculated.
                if (!this._destroyed) {
                    this.reflow();
                }
            });
        }
    }

    /**
     * Returns the width of the header of the `IgxGridComponent`.
     * ```html
     * let gridHeaderWidth = this.grid.headerWidth;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get headerWidth() {
        return parseInt(this._width, 10) - 17;
    }

    /**
     * An @Input property that adds styling classes applied to all even `IgxGridRowComponent`s in the grid.
     * ```html
     * <igx-grid #grid [data]="Data" [evenRowCSS]="'igx-grid--my-even-class'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    public evenRowCSS = 'igx-grid__tr--even';

    /**
     * An @Input property that adds styling classes applied to all odd `IgxGridRowComponent`s in the grid.
     * ```html
     * <igx-grid #grid [data]="Data" [evenRowCSS]="'igx-grid--my-odd-class'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    public oddRowCSS = 'igx-grid__tr--odd';

    /**
     * Returns the row height.
     * ```typescript
     * const rowHeight = this.grid.rowHeight;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    public get rowHeight() {
        return this._rowHeight ? this._rowHeight : this.defaultRowHeight;
    }

    /**
     * Sets the row height.
     * ```html
     * <igx-grid #grid [data]="localData" [showToolbar]="true" [rowHeight]="100" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set rowHeight(value) {
        this._rowHeight = parseInt(value, 10);
    }

    /**
     * An @Input property that sets the default width of the `IgxGridComponent`'s columns.
     * ```html
     * <igx-grid #grid [data]="localData" [showToolbar]="true" [columnWidth]="100" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    public get columnWidth(): string {
        return this._columnWidth;
    }
    public set columnWidth(value: string) {
        this._columnWidth = value;
        this.columnWidthSetByUser = true;
    }

    /**
     * An @Input property that sets the primary key of the `IgxGridComponent`.
     * ```html
     * <igx-grid #grid [data]="localData" [showToolbar]="true" [primaryKey]="'ProductID'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    public primaryKey;

    /**
     * An @Input property that sets the message displayed when there are no records.
     * ```html
     * <igx-grid #grid [data]="Data" [emptyGridMessage]="'The grid is empty'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    set emptyGridMessage(value: string) {
        this._emptyGridMessage = value;
    }

    /**
     * An accessor that returns the message displayed when there are no records.
    */
    get emptyGridMessage(): string {
        return this._emptyGridMessage || this.resourceStrings.igx_grid_emptyGrid_message;
    }

    /**
     * An @Input property that sets whether the grid is going to show loading indicator.
     * ```html
     * <igx-grid #grid [data]="Data" [isLoading]="true" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    set isLoading(value: boolean) {
        this._isLoading = value;
        if (this.gridAPI.grid) {
            this.markForCheck();
        }
    }

    /**
     * An accessor that returns whether the grid is showing loading indicator.
     */
    get isLoading(): boolean {
        return this._isLoading;
    }

    /**
     * A property that allows the columns to be auto-generated once again after the initialization of the grid.
     * This will allow to bind the grid to remote data and having auto-generated columns at the same time.
     * Note that after generating the columns, this property would be disabled to avoid re-creating
     * columns each time a new data is assigned.
     * ```typescript
     *  this.grid.shouldGenerate = true;
     *  this.remoteData = this.remoteService.remoteData;
     * ```
     */
    public shouldGenerate: boolean;

    /**
     * An @Input property that sets the message displayed when there are no records and the grid is filtered.
     * ```html
     * <igx-grid #grid [data]="Data" [emptyGridMessage]="'The grid is empty'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    set emptyFilteredGridMessage(value: string) {
        this._emptyFilteredGridMessage = value;
    }

    /**
     * An accessor that returns the message displayed when there are no records and the grid is filtered.
    */
    get emptyFilteredGridMessage(): string {
        return this._emptyFilteredGridMessage || this.resourceStrings.igx_grid_emptyFilteredGrid_message;
    }

    /**
     * An @Input property that sets the title to be displayed in the built-in column hiding UI.
     * ```html
     * <igx-grid [showToolbar]="true" [columnHiding]="true" columnHidingTitle="Column Hiding"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    public columnHidingTitle = '';

    /**
     * Returns if the built-in column pinning UI should be shown in the toolbar.
     * ```typescript
     *  let colPinning = this.grid.columnPinning;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    get columnPinning() {
        return this._columnPinning;
    }

    /**
     * Sets if the built-in column pinning UI should be shown in the toolbar.
     * By default it's disabled.
     * ```html
     * <igx-grid #grid [data]="localData" [columnPinning]="'true" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set columnPinning(value) {
        if (this._columnPinning !== value) {
            this._columnPinning = value;
            if (this.gridAPI.grid) {
                this.markForCheck();
                if (this._ngAfterViewInitPassed) {
                    this.calculateGridSizes();
                }
            }
        }
    }

    /**
     * An @Input property that sets the title to be displayed in the UI of the column pinning.
     * ```html
     * <igx-grid #grid [data]="localData" [columnPinning]="'true" [columnPinningTitle]="'Column Hiding'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    public columnPinningTitle = '';

    /**
     * Returns if the filtering is enabled.
     * ```typescript
     *  let filtering = this.grid.allowFiltering;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    get allowFiltering() {
        return this._allowFiltering;
    }

    /**
     * Sets if the filtering is enabled.
     * By default it's disabled.
     * ```html
     * <igx-grid #grid [data]="localData" [allowFiltering]="'true" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set allowFiltering(value) {
        if (this._allowFiltering !== value) {
            this._allowFiltering = value;
            if (this.calcHeight) {
                this.calcHeight += value ? -FILTER_ROW_HEIGHT : FILTER_ROW_HEIGHT;
            }
            if (this._ngAfterViewInitPassed) {
                if (this.maxLevelHeaderDepth) {
                    this.theadRow.nativeElement.style.height = `${(this.maxLevelHeaderDepth + 1) * this.defaultRowHeight +
                        (value && this.filterMode === FilterMode.quickFilter ? FILTER_ROW_HEIGHT : 0) + 1}px`;
                }
            }

            this.filteringService.isFilterRowVisible = false;
            this.filteringService.filteredColumn = null;

            this.filteringService.registerSVGIcons();
            if (this.gridAPI.grid) {
                this.markForCheck();
            }
        }
    }

    /**
     * Returns the filter mode.
     * ```typescript
     *  let filtering = this.grid.filterMode;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    get filterMode() {
        return this._filterMode;
    }

    /**
     * Sets filter mode.
     * By default it's set to FilterMode.quickFilter.
     * ```html
     * <igx-grid #grid [data]="localData" [filterMode]="'quickFilter'" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set filterMode(value) {
        this._filterMode = value;
    }

    /**
     * Returns the summary position.
     * ```typescript
     *  let summaryPosition = this.grid.summaryPosition;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    get summaryPosition() {
        return this._summaryPosition;
    }

    /**
     * Sets summary position.
     * By default it is bottom.
     * ```html
     * <igx-grid #grid [data]="localData" summaryPosition="top" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set summaryPosition(value) {
        this._summaryPosition = value;
        if (this.gridAPI.grid) {
            this.markForCheck();
        }
    }

    /**
     * Returns the summary calculation mode.
     * ```typescript
     *  let summaryCalculationMode = this.grid.summaryCalculationMode;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Input()
    get summaryCalculationMode() {
        return this._summaryCalculationMode;
    }

    /**
     * Sets summary calculation mode.
     * By default it is rootAndChildLevels which means the summaries are calculated for the root level and each child level.
     * ```html
     * <igx-grid #grid [data]="localData" summaryCalculationMode="rootLevelOnly" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set summaryCalculationMode(value) {
        this._summaryCalculationMode = value;
        if (this.gridAPI.grid) {
            this.summaryService.resetSummaryHeight();
            this.endEdit(true);
            this.calculateGridHeight();
            this.cdr.markForCheck();
        }
    }

    /**
     * Emitted when `IgxGridCellComponent` is clicked. Returns the `IgxGridCellComponent`.
     * ```html
     * <igx-grid #grid (onCellClick)="onCellClick($event)" [data]="localData" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
     * ```typescript
     * public onCellClick(e){
     *     alert("The cell has been clicked!");
     * }
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onCellClick = new EventEmitter<IGridCellEventArgs>();

    /**
     * Emitted when `IgxGridCellComponent` is selected. Returns the `IgxGridCellComponent`.
     * ```html
     * <igx-grid #grid (onSelection)="onCellSelect($event)" [data]="localData" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
     * ```typescript
     * public onCellSelect(e){
     *     alert("The cell has been selected!");
     * }
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onSelection = new EventEmitter<IGridCellEventArgs>();

    /**
     *  Emitted when `IgxGridRowComponent` is selected.
     * ```html
     * <igx-grid #grid (onRowSelectionChange)="onRowClickChange($event)" [data]="localData" [autoGenerate]="true"></igx-grid>
     * ```
     * ```typescript
     * public onCellClickChange(e){
     *     alert("The selected row has been changed!");
     * }
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onRowSelectionChange = new EventEmitter<IRowSelectionEventArgs>();

    /**
     * Emitted when `IgxColumnComponent` is pinned.
     * The index that the column is inserted at may be changed through the `insertAtIndex` property.
     * ```typescript
     * public columnPinning(event) {
     *     if (event.column.field === "Name") {
     *       event.insertAtIndex = 0;
     *     }
     * }
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onColumnPinning = new EventEmitter<IPinColumnEventArgs>();

    /**
     * An @Output property emitting an event when `IgxGridCellComponent`
     * editing has been performed in the grid and the values have **not** been submitted (e.g. `Esc` key was pressed).
     * This event is cancelable.
     *
     * args: IGridEditEventArgs = {
     *      cancel: bool,
     *      cellID: {
     *          columnID: int,
     *          rowID: int,
     *          rowIndex: int
     *      }
     *      newValue: object,
     *      oldValue: object,
     *      rowID: int
     *  }
     *
     * ```typescript
     * editCancel(event: IGridEditEventArgs){
     *    const rowID: IgxColumnComponent = event.rowID;
     * }
     * ```
     * ```html
     * <igx-grid #grid3 (onCellEditCancel)="editCancel($event)" [data]="remote | async" (onSortingDone)="process($event)"
     *          [primaryKey]="'ProductID'" [rowSelectable]="true">
     *          <igx-column [sortable]="true" [field]="'ProductID'"></igx-column>
     *          <igx-column [editable]="true" [field]="'ProductName'"></igx-column>
     *          <igx-column [sortable]="true" [field]="'UnitsInStock'" [header]="'Units in Stock'"></igx-column>
     * </igx-grid>
     * ```
	 * @memberof IgxGridComponent
     */
    @Output()
    public onCellEditCancel = new EventEmitter<IGridEditEventArgs>();

    /**
     * An @Output property emitting an event when `IgxGridCellComponent` enters edit mode.
     * This event is cancelable.
     *
     * args: IGridEditEventArgs = {
     *      cancel: bool,
     *      cellID: {
     *          columnID: int,
     *          rowID: int,
     *          rowIndex: int
     *      }
     *      oldValue: object,
     *      rowID: int
     *  }
     *
     * ```typescript
     * editStart(event: IGridEditEventArgs){
     *    const value: IgxColumnComponent = event.newValue;
     * }
     * ```
     * ```html
     * <igx-grid #grid3 (onCellEditEnter)="editStart($event)" [data]="remote | async" (onSortingDone)="process($event)"
     *          [primaryKey]="'ProductID'" [rowSelectable]="true">
     *          <igx-column [sortable]="true" [field]="'ProductID'"></igx-column>
     *          <igx-column [editable]="true" [field]="'ProductName'"></igx-column>
     *          <igx-column [sortable]="true" [field]="'UnitsInStock'" [header]="'Units in Stock'"></igx-column>
     * </igx-grid>
     * ```
	 * @memberof IgxGridComponent
     */
    @Output()
    public onCellEditEnter = new EventEmitter<IGridEditEventArgs>();

    /**
     * An @Output property emitting an event when `IgxGridCellComponent` editing has been performed in the grid.
     * Event is fired after editing is completed, when the cell is exiting edit mode.
     * This event is cancelable.
     *
     * args: IGridEditEventArgs = {
     *      cancel: bool,
     *      cellID: {
     *          columnID: int,
     *          rowID: int,
     *          rowIndex: int
     *      }
     *      newValue: object,
     *      oldValue: object,
     *      rowID: int
     *  }
     *
     * ```typescript
     * editDone(event: IGridEditEventArgs){
     *    const value: IgxColumnComponent = event.newValue;
     * }
     * ```
     * ```html
     * <igx-grid #grid3 (onCellEdit)="editDone($event)" [data]="remote | async" (onSortingDone)="process($event)"
     *          [primaryKey]="'ProductID'" [rowSelectable]="true">
     *          <igx-column [sortable]="true" [field]="'ProductID'"></igx-column>
     *          <igx-column [editable]="true" [field]="'ProductName'"></igx-column>
     *          <igx-column [sortable]="true" [field]="'UnitsInStock'" [header]="'Units in Stock'"></igx-column>
     * </igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onCellEdit = new EventEmitter<IGridEditEventArgs>();

    /**
     * An @Output property emitting an event when [rowEditable]="true" a row enters edit mode.
     * This event is cancelable.
     *
     * args: IGridEditEventArgs = {
     *      cancel: bool,
     *      oldValue: <rowObj>,
     *      rowID: int
     *  }
     *
     * Bind to the event in markup as follows:
     * ```html
     * <igx-grid #grid3 (onRowEditEnter)="editStart($event)" [data]="remote | async" (onSortingDone)="process($event)"
     *          [primaryKey]="'ProductID'" [rowSelectable]="true" [rowEditable]="true">
     *          <igx-column [sortable]="true" [field]="'ProductID'"></igx-column>
     *          <igx-column [editable]="true" [field]="'ProductName'"></igx-column>
     *          <igx-column [sortable]="true" [field]="'UnitsInStock'" [header]="'Units in Stock'"></igx-column>
     * </igx-grid>
     * ```
     * ```typescript
     *      editStart(event: IGridEditEventArgs) {
     *          const editedRowObj = event.oldValue;
     *          const cancelValue = event.cancel;
     *          const rowID = event.rowID;
     *      }
     * ```
	 * @memberof IgxGridComponent
     */
    @Output()
    public onRowEditEnter = new EventEmitter<IGridEditEventArgs>();

    /**
     * An @Output property emitting an event when [rowEditable]="true" & `endEdit(true)` is called.
     * Emitted when changing rows during edit mode, selecting an un-editable cell in the edited row,
     * performing paging operation, column resizing, pinning, moving or hitting  `Done`
     * button inside of the rowEditingOverlay, or hitting the `Enter` key while editing a cell.
     * This event is cancelable.
     *
     * args: IGridEditEventArgs = {
     *      cancel: bool,
     *      newValue: <rowObj>,
     *      oldValue: <rowObj>,
     *      rowID: int
     *  }
     *
     * Bind to the event in markup as follows:
     * ```html
     * <igx-grid #grid3 (onRowEdit)="editDone($event)" [data]="remote | async" (onSortingDone)="process($event)"
     *          [primaryKey]="'ProductID'" [rowSelectable]="true" [rowEditable]="true">
     *          <igx-column [sortable]="true" [field]="'ProductID'"></igx-column>
     *          <igx-column [editable]="true" [field]="'ProductName'"></igx-column>
     *          <igx-column [sortable]="true" [field]="'UnitsInStock'" [header]="'Units in Stock'"></igx-column>
     * </igx-grid>
     * ```
     *
     * ```typescript
     *      editDone(event: IGridEditEventArgs) {
     *          const originalRowObj = event.oldValue;
     *          const updatedRowObj = event.newValue;
     *          const cancelValue = event.cancel;
     *          const rowID = event.rowID;
     *      }
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onRowEdit = new EventEmitter<IGridEditEventArgs>();

    /**
     * An @Output property emitting an event when [rowEditable]="true" & `endEdit(false)` is called.
     * Emitted when changing hitting `Esc` key during cell editing and when click on the `Cancel` button
     * in the row editing overlay.
     * This event is cancelable.
     *
     * args: IGridEditEventArgs = {
     *      cancel: bool,
     *      newValue: <rowObj>,
     *      oldValue: <rowObj>,
     *      rowID: int
     *  }
     *
     * Bind to the event in markup as follows:
     * ```html
     * <igx-grid #grid3 (onRowEditCancel)="editCancel($event)" [data]="remote | async" (onSortingDone)="process($event)"
     *          [primaryKey]="'ProductID'" [rowSelectable]="true" [rowEditable]="true">
     *          <igx-column [sortable]="true" [field]="'ProductID'"></igx-column>
     *          <igx-column [editable]="true" [field]="'ProductName'"></igx-column>
     *          <igx-column [sortable]="true" [field]="'UnitsInStock'" [header]="'Units in Stock'"></igx-column>
     * </igx-grid>
     * ```
     * ```typescript
     *      editCancel(emitted: { row: IgxGridRowComponent, newValue: any, oldValue: any }): void {
     *          const originalRowObj = event.oldValue;
     *          const updatedRowObj = event.newValue;
     *          const cancelValue = event.cancel;
     *          const rowID = event.rowID;
     *      }
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onRowEditCancel = new EventEmitter<IGridEditEventArgs>();

    /**
     * Emitted when a grid column is initialized. Returns the column object.
     * ```html
     * <igx-grid #grid [data]="localData" [onColumnInit]="initColumns($event)" [autoGenerate]="true"></igx-grid>
     * ```
     * ```typescript
     * initColumns(event: IgxColumnComponent) {
     * const column: IgxColumnComponent = event;
     *       column.filterable = true;
     *       column.sortable = true;
     *       column.editable = true;
     * }
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onColumnInit = new EventEmitter<IgxColumnComponent>();

    /**
     * Emitted when sorting is performed through the UI. Returns the sorting expression.
     * ```html
     * <igx-grid #grid [data]="localData" [autoGenerate]="true" (onSortingDone)="sortingDone($event)"></igx-grid>
     * ```
     * ```typescript
     * sortingDone(event: SortingDirection){
     *     const sortingDirection = event;
     * }
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onSortingDone = new EventEmitter<ISortingExpression | Array<ISortingExpression>>();

    /**
     * Emitted when filtering is performed through the UI.
     * Returns the filtering expressions tree of the column for which filtering was performed.
     * ```typescript
     * filteringDone(event: IFilteringExpressionsTree){
     *     const filteringTree = event;
     *}
     * ```
     * ```html
     * <igx-grid #grid [data]="localData" [height]="'305px'" [autoGenerate]="true" (onFilteringDone)="filteringDone($event)"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onFilteringDone = new EventEmitter<IFilteringExpressionsTree>();

    /**
     * Emitted when paging is performed. Returns an object consisting of the previous and next pages.
     * ```typescript
     * pagingDone(event: IPageEventArgs){
     *     const paging = event;
     * }
     * ```
     * ```html
     * <igx-grid #grid [data]="localData" [height]="'305px'" [autoGenerate]="true" (onPagingDone)="pagingDone($event)"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onPagingDone = new EventEmitter<IPageEventArgs>();

    /**
     * Emitted when a `IgxGridRowComponent` is being added to the `IgxGridComponent` through the API.
     * Returns the data for the new `IgxGridRowComponent` object.
     * ```typescript
     * rowAdded(event: IRowDataEventArgs){
     *    const rowInfo = event;
     * }
     * ```
     * ```html
     * <igx-grid #grid [data]="localData" (onRowAdded)="rowAdded($event)" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onRowAdded = new EventEmitter<IRowDataEventArgs>();

    /**
     * Emitted when a `IgxGridRowComponent` is deleted through the `IgxGridComponent` API.
     * Returns an `IRowDataEventArgs` object.
     * ```typescript
     * rowDeleted(event: IRowDataEventArgs){
     *    const rowInfo = event;
     * }
     * ```
     * ```html
     * <igx-grid #grid [data]="localData" (onRowDeleted)="rowDeleted($event)" [height]="'305px'" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onRowDeleted = new EventEmitter<IRowDataEventArgs>();

    /**
     * Emitted when a new chunk of data is loaded from virtualization.
     * ```typescript
     *  <igx-grid #grid [data]="localData" [autoGenerate]="true" (onDataPreLoad)='handleDataPreloadEvent()'></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onDataPreLoad = new EventEmitter<IForOfState>();

    /**
     * Emitted when `IgxColumnComponent` is resized.
     * Returns the `IgxColumnComponent` object's old and new width.
     * ```typescript
     * resizing(event: IColumnResizeEventArgs){
     *     const grouping = event;
     * }
     * ```
     * ```html
     * <igx-grid #grid [data]="localData" (onColumnResized)="resizing($event)" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onColumnResized = new EventEmitter<IColumnResizeEventArgs>();

    /**
     * Emitted when a `IgxGridCellComponent` is right clicked. Returns the `IgxGridCellComponent` object.
     * ```typescript
     * contextMenu(event: IGridCellEventArgs){
     *     const resizing = event;
     *     console.log(resizing);
     * }
     * ```
     * ```html
     * <igx-grid #grid [data]="localData" (onContextMenu)="contextMenu($event)" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onContextMenu = new EventEmitter<IGridCellEventArgs>();

    /**
     * Emitted when a `IgxGridCellComponent` is double clicked. Returns the `IgxGridCellComponent` object.
     * ```typescript
     * dblClick(event: IGridCellEventArgs){
     *     const dblClick = event;
     *     console.log(dblClick);
     * }
     * ```
     * ```html
     * <igx-grid #grid [data]="localData" (onDoubleClick)="dblClick($event)" [autoGenerate]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onDoubleClick = new EventEmitter<IGridCellEventArgs>();

    /**
     * Emitted when `IgxColumnComponent` visibility is changed. Args: { column: any, newValue: boolean }
     * ```typescript
     * visibilityChanged(event: IColumnVisibilityChangedEventArgs){
     *    const visiblity = event;
     * }
     * ```
     * ```html
     * <igx-grid [columnHiding]="true" [showToolbar]="true" (onColumnVisibilityChanged)="visibilityChanged($event)"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onColumnVisibilityChanged = new EventEmitter<IColumnVisibilityChangedEventArgs>();

    /**
     * Emitted when `IgxColumnComponent` moving starts. Returns the moved `IgxColumnComponent` object.
     * ```typescript
     * movingStart(event: IColumnMovingStartEventArgs){
     *     const movingStarts = event;
     * }
     * ```
     * ```html
     * <igx-grid [columnHiding]="true" [showToolbar]="true" (onColumnMovingStart)="movingStart($event)"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onColumnMovingStart = new EventEmitter<IColumnMovingStartEventArgs>();

    /**
     * Emitted throughout the `IgxColumnComponent` moving operation.
     * Returns the source and target `IgxColumnComponent` objects. This event is cancelable.
     * ```typescript
     * moving(event: IColumnMovingEventArgs){
     *     const moving = event;
     * }
     * ```
     * ```html
     * <igx-grid [columnHiding]="true" [showToolbar]="true" (onColumnMoving)="moving($event)"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onColumnMoving = new EventEmitter<IColumnMovingEventArgs>();

    /**
     * Emitted when `IgxColumnComponent` moving ends.
     * Returns the source and target `IgxColumnComponent` objects.
     * ```typescript
     * movingEnds(event: IColumnMovingEndEventArgs){
     *     const movingEnds = event;
     * }
     * ```
     * ```html
     * <igx-grid [columnHiding]="true" [showToolbar]="true" (onColumnMovingEnd)="movingEnds($event)"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onColumnMovingEnd = new EventEmitter<IColumnMovingEndEventArgs>();

    /**
     * @deprecated you should use onGridKeydown event
     */
    @Output()
    @DeprecateProperty('onFocusChange event is deprecated. Use onGridKeydown event instead.')
    public onFocusChange = new EventEmitter<IFocusChangeEventArgs>();

    /**
     * Emitted when keydown is triggered over element inside grid's body.
     * This event is fired only if the key combination is supported in the grid.
     * Return the target type, target object and the original event. This event is cancelable.
     * ```typescript
     * customKeydown(args: IGridKeydownEventArgs) {
     *  const keydownEvent = args.event;
     * }
     * ```
     * ```html
     *  <igx-grid (onGridKeydown)="customKeydown($event)"></igx-grid>
     * ```
     */
    @Output()
    public onGridKeydown = new EventEmitter<IGridKeydownEventArgs>();

     /**
     * Emitted when start dragging a row.
     * Return the dragged row.
    */
    @Output()
    public onRowDragStart = new EventEmitter<IRowDragStartEventArgs>();

    /**
     * Emitted when dropping a row.
     * Return the dropped row.
    */
    @Output()
    public onRowDragEnd = new EventEmitter<IRowDragEndEventArgs>();

    /**
     * @hidden
     */
    @ViewChild(IgxGridColumnResizerComponent, { static: false })
    public resizeLine: IgxGridColumnResizerComponent;

    /**
     * @hidden
     */
    @ContentChildren(IgxColumnComponent, { read: IgxColumnComponent, descendants: true })
    public columnList: QueryList<IgxColumnComponent>;

    /**
     *@hidden
     */
    @ContentChild(IgxExcelStyleSortingTemplateDirective, { read: IgxExcelStyleSortingTemplateDirective, static: true })
    public excelStyleSortingTemplateDirective: IgxExcelStyleSortingTemplateDirective;

    /**
     *@hidden
     */
    @ContentChild(IgxExcelStyleMovingTemplateDirective, { read: IgxExcelStyleMovingTemplateDirective, static: true })
    public excelStyleMovingTemplateDirective: IgxExcelStyleMovingTemplateDirective;

    /**
     *@hidden
     */
    @ContentChild(IgxExcelStyleHidingTemplateDirective, { read: IgxExcelStyleHidingTemplateDirective, static: true })
    public excelStyleHidingTemplateDirective: IgxExcelStyleHidingTemplateDirective;

    /**
     *@hidden
     */
    @ContentChild(IgxExcelStylePinningTemplateDirective, { read: IgxExcelStylePinningTemplateDirective, static: true })
    public excelStylePinningTemplateDirective: IgxExcelStylePinningTemplateDirective;


    /**
     * @hidden
     */
    @ViewChildren(IgxGridHeaderGroupComponent, { read: IgxGridHeaderGroupComponent })
    public headerGroups: QueryList<IgxGridHeaderGroupComponent>;

    /**
     * A list of all `IgxGridHeaderGroupComponent`.
     * ```typescript
     * const headerGroupsList = this.grid.headerGroupsList;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get headerGroupsList(): IgxGridHeaderGroupComponent[] {
        return this.headerGroups ? flatten(this.headerGroups.toArray()) : [];
    }

    /**
     * A list of all `IgxGridHeaderComponent`.
     * ```typescript
     * const headers = this.grid.headerCellList;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get headerCellList(): IgxGridHeaderComponent[] {
        return this.headerGroupsList.map((headerGroup) => headerGroup.headerCell).filter((headerCell) => headerCell);
    }

    /**
     * A list of all `IgxGridFilteringCellComponent`.
     * ```typescript
     * const filterCells = this.grid.filterCellList;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get filterCellList(): IgxGridFilteringCellComponent[] {
        return this.headerGroupsList.map((headerGroup) => headerGroup.filterCell).filter((filterCell) => filterCell);
    }

    @ViewChildren('row')
    private _rowList: QueryList<IgxGridRowComponent>;

    @ViewChildren('summaryRow', { read: IgxSummaryRowComponent })
    protected _summaryRowList: QueryList<IgxSummaryRowComponent>;

    public get summariesRowList() {
        const res = new QueryList<any>();
        if (!this._summaryRowList) {
            return res;
        }
        const sumList = this._summaryRowList.filter((item) => {
            return item.element.nativeElement.parentElement !== null;
        });
        res.reset(sumList);
        return res;
    }

    /**
     * A list of `IgxGridRowComponent`.
     * ```typescript
     * const rowList = this.grid.rowList;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public get rowList() {
        const res = new QueryList<any>();
        if (!this._rowList) {
            return res;
        }
        const rList = this._rowList
            .filter((item) => {
                return item.element.nativeElement.parentElement !== null;
            })
            .sort((a, b) => {
                return a.index - b.index;
            });
        res.reset(rList);
        return res;
    }

    @ViewChildren(IgxRowComponent, { read: IgxRowComponent })
    private _dataRowList: QueryList<any>;

    /**
     * A list of `IgxGridRowComponent`, currently rendered.
     * ```typescript
     * const dataList = this.grid.dataRowList;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public get dataRowList() {
        const res = new QueryList<any>();
        if (!this._dataRowList) {
            return res;
        }
        const rList = this._dataRowList.filter((item) => {
            return item.element.nativeElement.parentElement !== null;
        }).sort((a, b) => {
            return a.index - b.index;
        });
        res.reset(rList);
        return res;
    }

    /**
     * A template reference for the template when the filtered `IgxGridComponent` is empty.
     * ```
     * const emptyTempalte = this.grid.emptyGridTemplate;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @ViewChild('emptyFilteredGrid', { read: TemplateRef, static: true })
    public emptyFilteredGridTemplate: TemplateRef<any>;

    /**
     * A template reference for the template when the `IgxGridComponent` is empty.
     * ```
     * const emptyTempalte = this.grid.emptyGridTemplate;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @ViewChild('defaultEmptyGrid', { read: TemplateRef, static: true })
    public emptyGridDefaultTemplate: TemplateRef<any>;

    @ViewChild('defaultLoadingGrid', { read: TemplateRef, static: true })
    public loadingGridDefaultTemplate: TemplateRef<any>;

    /**
     * @hidden
     */
    @ViewChild('scrollContainer', { read: IgxGridForOfDirective, static: true })
    public parentVirtDir: IgxGridForOfDirective<any>;

    /**
     * Returns the template which will be used by the toolbar to show custom content.
     * ```typescript
     * let customContentTemplate = this.grid.toolbarCustomContentTemplate;
     * ```
     * @memberof IgxGridBaseComponent
     */
    public get toolbarCustomContentTemplate(): IgxGridToolbarCustomContentDirective {
        return this.toolbarCustomContentTemplates.first;
    }

    @ContentChildren(IgxGridToolbarCustomContentDirective, { read: IgxGridToolbarCustomContentDirective, descendants: false })
    public toolbarCustomContentTemplates: QueryList<IgxGridToolbarCustomContentDirective>;

    /**
     * @hidden
     */
    @ViewChild('verticalScrollContainer', { read: IgxGridForOfDirective, static: true })
    public verticalScrollContainer: IgxGridForOfDirective<any>;

        /**
     * @hidden
     */
    @ViewChild('verticalScrollHolder', { read: IgxGridForOfDirective, static: true })
    public verticalScroll: IgxGridForOfDirective<any>;

    /**
     * @hidden
     */
    @ViewChild('scr', { read: ElementRef, static: true })
    public scr: ElementRef;

    /**
     * @hidden
     */
    @ViewChild('paginator', { read: ElementRef, static: false })
    public paginator: ElementRef;

    /**
     * @hidden
     */
    @ViewChild('headerContainer', { read: IgxGridForOfDirective, static: false })
    public headerContainer: IgxGridForOfDirective<any>;

    /**
     * @hidden
     */
    @ViewChild('headerCheckboxContainer', { static: false })
    public headerCheckboxContainer: ElementRef;

    /**
     * @hidden
     */
    @ViewChild('headerDragContainer', { static: false })
    public headerDragContainer: ElementRef;

    /**
     * @hidden
     */
    @ViewChild('headerGroupContainer', { static: false })
    public headerGroupContainer: ElementRef;

    /**
     * @hidden
     */
    @ViewChild('headerCheckbox', { read: IgxCheckboxComponent, static: false })
    public headerCheckbox: IgxCheckboxComponent;

    /**
     * @hidden
     */
    @ViewChild('filteringRow', { read: IgxGridFilteringRowComponent, static: false })
    public filteringRow: IgxGridFilteringRowComponent;

    /**
     * @hidden
     */
    @ViewChild('theadRow', { static: true })
    public theadRow: ElementRef;

    /**
     * @hidden
     */
    @ViewChild('tbody', { static: true })
    public tbody: ElementRef;

    /**
     * @hidden
     */
    @ViewChild('tfoot', { static: true })
    public tfoot: ElementRef;


    /**
     * @hidden
     */
    @ViewChild('igxFilteringOverlayOutlet', { read: IgxOverlayOutletDirective, static: true })
    protected _outletDirective: IgxOverlayOutletDirective;

    /**
     * @hidden
     */
    public get outletDirective() {
        return this._outletDirective;
    }

    /**
     * @hidden
     */
    @ViewChild('igxRowEditingOverlayOutlet', { read: IgxOverlayOutletDirective, static: true })
    public rowEditingOutletDirective: IgxOverlayOutletDirective;

    /**
     * @hidden
    */
    @ViewChildren(IgxTemplateOutletDirective, { read: IgxTemplateOutletDirective })
    public tmpOutlets: QueryList<any>;


    /**
     * @hidden
     */
    public get rowOutletDirective() {
        return this.rowEditingOutletDirective;
    }

    /**
     * @hidden
     */
    public get parentRowOutletDirective() {
        return null;
    }

    /**
     * @hidden
     * @internal
     */
    @ViewChild('dragIndicatorIconBase', { read: TemplateRef, static: true })
    public dragIndicatorIconBase: TemplateRef<any>;

    /**
     * @hidden
     */
    @ViewChild('defaultRowEditTemplate', { read: TemplateRef, static: true })
    private defaultRowEditTemplate: TemplateRef<any>;
    /**
     * @hidden
     */
    @ContentChild(IgxRowEditTemplateDirective, { read: TemplateRef, static: true })
    public rowEditCustom: TemplateRef<any>;

    /** @hidden */
    public get rowEditContainer(): TemplateRef<any> {
        return this.rowEditCustom ? this.rowEditCustom : this.defaultRowEditTemplate;
    }
    /** @hidden */
    @ContentChild(IgxRowEditTextDirective, { read: TemplateRef, static: true })
    public rowEditText: TemplateRef<any>;
    /** @hidden */
    @ContentChild(IgxRowEditActionsDirective, { read: TemplateRef, static: true })
    public rowEditActions: TemplateRef<any>;

    /**
     * @hidden
     */
    public get rowInEditMode(): IgxRowComponent<IgxGridBaseComponent & IGridDataBindable> {
        const editRowState = this.crudService.row;
        return editRowState !== null ? this.rowList.find(e => e.rowID === editRowState.id) : null;
    }

    /**
     * @hidden
     */
    public get firstEditableColumnIndex(): number {
        const index = [...this.pinnedColumns, ...this.unpinnedColumns].filter(e => !e.columnGroup).findIndex(e => e.editable);
        return index !== -1 ? index : null;
    }

    /**
     * @hidden
     */
    public get lastEditableColumnIndex(): number {
        const orderedColumns = [...this.pinnedColumns, ...this.unpinnedColumns].filter(e => !e.columnGroup);
        const index = orderedColumns.reverse().findIndex(e => e.editable);
        return index !== -1 ? orderedColumns.length - 1 - index : null;
    }

    /**
     * @hidden
     */
    @ViewChildren(IgxRowEditTabStopDirective)
    public rowEditTabsDEFAULT: QueryList<IgxRowEditTabStopDirective>;

    /**
     * @hidden
     */
    @ContentChildren(IgxRowEditTabStopDirective)
    public rowEditTabsCUSTOM: QueryList<IgxRowEditTabStopDirective>;

    /**
     * @hidden
     * TODO: Nav service logic doesn't handle 0 results from this querylist
     */
    public get rowEditTabs(): QueryList<IgxRowEditTabStopDirective> {
        return this.rowEditTabsCUSTOM.length ? this.rowEditTabsCUSTOM : this.rowEditTabsDEFAULT;
    }

    /**
     * @hidden
     */
    @ViewChild(IgxToggleDirective, { static: false })
    public rowEditingOverlay: IgxToggleDirective;

    /**
     * @hidden
     */
    @HostBinding('attr.tabindex')
    public tabindex = 0;

    /**
     * @hidden
     */
    @HostBinding('attr.class')
    get hostClass(): string {
        return this.getComponentDensityClass('igx-grid');
    }

    get bannerClass(): string {
        const position = this.rowEditPositioningStrategy.isTop ? 'igx-banner__border-top' : 'igx-banner__border-bottom';
        return `${this.getComponentDensityClass('igx-banner')} ${position}`;
    }

    /**
     * @hidden
     */
    @HostBinding('attr.role')
    public hostRole = 'grid';

    /**
     * @hidden
     */
    get pipeTrigger(): number {
        return this._pipeTrigger;
    }

    /**
     * @hidden
     */
    get summaryPipeTrigger(): number {
        return this._summaryPipeTrigger;
    }

    /**
     * Returns the sorting state of the `IgxGridComponent`.
     * ```typescript
     * const sortingState = this.grid.sortingExpressions;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    get sortingExpressions(): ISortingExpression[] {
        return this._sortingExpressions;
    }

    /**
     * Sets the sorting state of the `IgxGridComponent`.
     * ```typescript
     * this.grid.sortingExpressions = [{
     *     fieldName: "ID",
     *     dir: SortingDirection.Desc,
     *     ignoreCase: true
     * }];
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set sortingExpressions(value: ISortingExpression[]) {
        this._sortingExpressions = cloneArray(value);
        this.cdr.markForCheck();
    }

    /**
     * Returns the state of the grid virtualization, including the start index and how many records are rendered.
     * ```typescript
     * const gridVirtState = this.grid1.virtualizationState;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get virtualizationState() {
        return this.verticalScrollContainer.state;
    }

    /**
     * @hidden
     */
    set virtualizationState(state) {
        this.verticalScrollContainer.state = state;
    }

    /**
     * Returns the total number of records in the data source.
     * Works only with remote grid virtualization.
     * ```typescript
     * const itemCount = this.grid1.totalItemCount;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get totalItemCount() {
        return this.verticalScrollContainer.totalItemCount;
    }

    /**
     * Sets the total number of records in the data source.
     * This property is required for virtualization to function when the grid is bound remotely.
     * ```typescript
     * this.grid1.totalItemCount = 55;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set totalItemCount(count) {
        this.verticalScrollContainer.totalItemCount = count;
        this.cdr.detectChanges();
    }

    /**
     * @hidden
     */
    get maxLevelHeaderDepth() {
        if (this._maxLevelHeaderDepth === null) {
            this._maxLevelHeaderDepth = this.hasColumnLayouts ?
                this.columnList.reduce((acc, col) => Math.max(acc, col.rowStart), 0) :
                this.columnList.reduce((acc, col) => Math.max(acc, col.level), 0);
        }
        return this._maxLevelHeaderDepth;
    }

    /**
     * Returns the number of hidden `IgxColumnComponent`.
     * ```typescript
     * const hiddenCol = this.grid.hiddenColumnsCount;
     * ``
     */
    get hiddenColumnsCount() {
        return this.columnList.filter((col) => col.columnGroup === false && col.hidden === true).length;
    }

    /**
     * Returns the text to be displayed inside the toggle button
     * for the built-in column hiding UI of the`IgxColumnComponent`.
     * ```typescript
     * const hiddenColText = this.grid.hiddenColumnsText;
     * ``
     */
    @WatchChanges()
    @Input()
    get hiddenColumnsText() {
        return this._hiddenColumnsText;
    }

    /**
     * Sets the text to be displayed inside the toggle button
     * for the built-in column hiding UI of the`IgxColumnComponent`.
     * ```typescript
     * <igx-grid [columnHiding]="true" [showToolbar]="true" [hiddenColumnsText]="'Hidden Columns'"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set hiddenColumnsText(value) {
        this._hiddenColumnsText = value;

    }

    /**
     * Returns the text to be displayed inside the toggle button
     * for the built-in column pinning UI of the`IgxColumnComponent`.
     * ```typescript
     * const pinnedText = this.grid.pinnedColumnsText;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    get pinnedColumnsText() {
        return this._pinnedColumnsText;
    }

    /**
     * Sets the text to be displayed inside the toggle button
     * for the built-in column pinning UI of the`IgxColumnComponent`.
     * ```html
     * <igx-grid [pinnedColumnsText]="'PinnedCols Text" [data]="data" [width]="'100%'" [height]="'500px'"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    set pinnedColumnsText(value) {
        this._pinnedColumnsText = value;
    }

    /**
     * Get transactions service for the grid.
     */
    get transactions(): TransactionService<Transaction, State> {
        return this._transactions;
    }

    /**
     * @hidden
    */
    public columnsWithNoSetWidths = null;

    /* Toolbar related definitions */
    private _showToolbar = false;
    private _exportExcel = false;
    private _exportCsv = false;
    private _toolbarTitle: string = null;
    private _exportText: string = null;
    private _exportExcelText: string = null;
    private _exportCsvText: string = null;
    private _rowEditable = false;
    private _currentRowState: any;
    private _filteredSortedData = null;
    /**
     * @hidden
    */
    public get currentRowState(): any {
        return this._currentRowState;
    }

    /**
     * Provides access to the `IgxToolbarComponent`.
     * ```typescript
     * const gridToolbar = this.grid.toolbar;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @ViewChild('toolbar', { read: IgxGridToolbarComponent, static: false })
    public toolbar: IgxGridToolbarComponent = null;

    @ViewChild('toolbar', { read: ElementRef, static: false })
    private toolbarHtml: ElementRef = null;

    /**
     * Returns whether the `IgxGridComponent`'s toolbar is shown or hidden.
     * ```typescript
     * const toolbarGrid = this.grid.showToolbar;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    public get showToolbar(): boolean {
        return this._showToolbar;
    }

    /**
     * Shows or hides the `IgxGridComponent`'s toolbar.
     * ```html
     * <igx-grid [data]="localData" [showToolbar]="true" [autoGenerate]="true" ></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set showToolbar(newValue: boolean) {
        if (this._showToolbar !== newValue) {
            this._showToolbar = newValue;
            this.cdr.markForCheck();
            if (this._ngAfterViewInitPassed) {
                this.calculateGridSizes();
            }
        }
    }

    /**
     * Returns the toolbar's title.
     * ```typescript
     * const toolbarTitle  = this.grid.toolbarTitle;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    public get toolbarTitle(): string {
        return this._toolbarTitle;
    }

    /**
     * Sets the toolbar's title.
     * ```html
     * <igx-grid [data]="localData" [showToolbar]="true" [autoGenerate]="true" [toolbarTitle]="'My Grid'"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set toolbarTitle(newValue: string) {
        if (this._toolbarTitle !== newValue) {
            this._toolbarTitle = newValue;
            this.cdr.markForCheck();
            if (this._ngAfterViewInitPassed) {
                this.calculateGridSizes();
            }
        }
    }

    /**
     * Returns whether the option for exporting to MS Excel is enabled or disabled.
     * ```typescript
     * cosnt excelExporter = this.grid.exportExcel;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    public get exportExcel(): boolean {
        return this.getExportExcel();
    }

    /**
     * Enable or disable the option for exporting to MS Excel.
     * ```html
     * <igx-grid [data]="localData" [showToolbar]="true" [autoGenerate]="true" [exportExcel]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set exportExcel(newValue: boolean) {
        if (this._exportExcel !== newValue) {
            this._exportExcel = newValue;
            this.cdr.markForCheck();
            if (this._ngAfterViewInitPassed) {
                this.calculateGridSizes();
            }
        }
    }

    /**
     * Returns whether the option for exporting to CSV is enabled or disabled.
     * ```typescript
     * const exportCsv = this.grid.exportCsv;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    public get exportCsv(): boolean {
        return this.getExportCsv();
    }

    /**
     * Enable or disable the option for exporting to CSV.
     * ```html
     * <igx-grid [data]="localData" [showToolbar]="true" [autoGenerate]="true" [exportCsv]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set exportCsv(newValue: boolean) {
        if (this._exportCsv !== newValue) {
            this._exportCsv = newValue;
            this.cdr.markForCheck();
            if (this._ngAfterViewInitPassed) {
                this.calculateGridSizes();
            }
        }
    }

    /**
     * Returns the textual content for the main export button.
     * ```typescript
     * const exportText = this.grid.exportText;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    public get exportText(): string {
        return this._exportText;
    }

    /**
     * Sets the textual content for the main export button.
     * ```html
     * <igx-grid [data]="localData" [showToolbar]="true" [exportText]="'My Exporter'" [exportCsv]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set exportText(newValue: string) {
        if (this._exportText !== newValue) {
            this._exportText = newValue;
            this.cdr.markForCheck();
            if (this._ngAfterViewInitPassed) {
                this.calculateGridSizes();
            }
        }
    }

    /**
     * Returns the textual content for the MS Excel export button.
     * ```typescript
     * const excelText = this.grid.exportExcelText;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    public get exportExcelText(): string {
        return this._exportExcelText;
    }

    /**
     * Sets the textual content for the MS Excel export button.
     * ```html
     * <igx-grid [exportExcelText]="'My Excel Exporter" [showToolbar]="true" [exportText]="'My Exporter'" [exportCsv]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set exportExcelText(newValue: string) {
        if (this._exportExcelText !== newValue) {
            this._exportExcelText = newValue;
            this.cdr.markForCheck();
            if (this._ngAfterViewInitPassed) {
                this.calculateGridSizes();
            }
        }
    }

    /**
     * Returns the textual content for the CSV export button.
     * ```typescript
     * const csvText = this.grid.exportCsvText;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @WatchChanges()
    @Input()
    public get exportCsvText(): string {
        return this._exportCsvText;
    }

    /**
     * Sets the textual content for the CSV export button.
     * ```html
     * <igx-grid [exportCsvText]="'My Csv Exporter" [showToolbar]="true" [exportText]="'My Exporter'" [exportExcel]="true"></igx-grid>
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public set exportCsvText(newValue: string) {
        if (this._exportCsvText !== newValue) {
            this._exportCsvText = newValue;
            this.cdr.markForCheck();
            if (this._ngAfterViewInitPassed) {
                this.calculateGridSizes();
            }
        }
    }

    /**
     * @hidden
     */
    public rowEditMessage;

    /**
     * Emitted when an export process is initiated by the user.
     * ```typescript
     * toolbarExporting(event: IGridToolbarExportEventArgs){
     *     const toolbarExporting = event;
     * }
     * ```
	 * @memberof IgxGridBaseComponent
     */
    @Output()
    public onToolbarExporting = new EventEmitter<IGridToolbarExportEventArgs>();

    /* End of toolbar related definitions */

    // TODO: Document
    @Output()
    onRangeSelection = new EventEmitter<GridSelectionRange>();

    /**
     * @hidden
     */
    public pagingState;
    /**
     * @hidden
     */
    public calcWidth: number;
    /**
     * @hidden
     */
    public calcHeight = 0;
    /**
     * @hidden
     */
    public tfootHeight: number;
    /**
     * @hidden
     */
    public chipsGoupingExpressions = [];
    /**
     * @hidden
     */
    public summariesHeight: number;

    /**
     * @hidden
     */
    public draggedColumn: IgxColumnComponent;

    /**
     * @hidden
     */
    public allRowsSelected = false;

    /**
     * @hidden
     */
    public disableTransitions = false;

    /**
     * @hidden
     */
    public lastSearchInfo: ISearchInfo = {
        searchText: '',
        caseSensitive: false,
        exactMatch: false,
        activeMatchIndex: 0,
        matchInfoCache: []
    };

    /**
     * @hidden
     */
    public columnWidthSetByUser = false;

    abstract data: any[];
    abstract filteredData: any[];
    // abstract dataLength;

    /**
     * @hidden
     */
    protected destroy$ = new Subject<any>();

    /**
     * @hidden
     */
    protected _perPage = 15;
    /**
     * @hidden
     */
    protected _page = 0;
    /**
     * @hidden
     */
    protected _paging = false;
    /**
     * @hidden
     */
    protected _rowSelection = false;
    /**
     * @hidden
     */
    protected _rowDrag = false;
    /**
     * @hidden
     */
    protected _pipeTrigger = 0;
    /**
     * @hidden
     */
    protected _summaryPipeTrigger = 0;
    /**
     * @hidden
     */
    protected _columns: IgxColumnComponent[] = [];
    /**
     * @hidden
     */
    protected _pinnedColumns: IgxColumnComponent[] = [];
    /**
     * @hidden
     */
    protected _unpinnedColumns: IgxColumnComponent[] = [];
    /**
     * @hidden
     */
    protected _filteringExpressionsTree: IFilteringExpressionsTree = new FilteringExpressionsTree(FilteringLogic.And);
    /**
     * @hidden
     */
    protected _sortingExpressions: Array<ISortingExpression> = [];
    /**
     * @hidden
     */
    protected _maxLevelHeaderDepth = null;
    /**
     * @hidden
     */
    protected _columnHiding = false;
    /**
     * @hidden
     */
    protected _columnPinning = false;
    /**
     * @hidden
     */
    protected _keydownListener = null;
    /**
     * @hidden
     */
    protected _vScrollListener = null;
    /**
     * @hidden
     */
    protected _hScrollListener = null;
    /**
     * @hidden
     */
    protected _wheelListener = null;
    protected _allowFiltering = false;
    protected _filterMode = FilterMode.quickFilter;
    private resizeHandler;
    private columnListDiffer;
    private _hiddenColumnsText = '';
    private _pinnedColumnsText = '';
    private _height = '100%';
    private _width = '100%';
    private _rowHeight;
    protected _ngAfterViewInitPassed = false;
    private _horizontalForOfs;
    private _multiRowLayoutRowSize = 1;

    // Caches
    private _totalWidth = NaN;
    private _pinnedVisible = [];
    private _unpinnedVisible = [];
    private _pinnedWidth = NaN;
    private _unpinnedWidth = NaN;
    private _visibleColumns = [];
    private _columnGroups = false;

    private _columnWidth: string;

    private _defaultTargetRecordNumber = 10;

    private _summaryPosition = GridSummaryPosition.bottom;
    private _summaryCalculationMode = GridSummaryCalculationMode.rootAndChildLevels;

    private rowEditPositioningStrategy = new ContainerPositioningStrategy({
        horizontalDirection: HorizontalAlignment.Right,
        verticalDirection: VerticalAlignment.Bottom,
        horizontalStartPoint: HorizontalAlignment.Left,
        verticalStartPoint: VerticalAlignment.Bottom,
        closeAnimation: null
    });

    private rowEditSettings = {
        scrollStrategy: new AbsoluteScrollStrategy(),
        modal: false,
        closeOnOutsideClick: false,
        outlet: this.rowOutletDirective,
        positionStrategy: this.rowEditPositioningStrategy
    };

    private verticalScrollHandler(event) {
        this.verticalScrollContainer.onScroll(event);
        if (isEdge()) { this.wheelHandler(false); }
        this.disableTransitions = true;

        this.zone.run(() => {
            this.zone.onStable.pipe(first()).subscribe(() => {
                this.verticalScrollContainer.onChunkLoad.emit(this.verticalScrollContainer.state);
            });

            if (this.rowEditable) {
                this.changeRowEditingOverlayStateOnScroll(this.rowInEditMode);
            }
            this.disableTransitions = false;
        });

        this.hideOverlays();
    }

    private horizontalScrollHandler(event) {
        const scrollLeft = event.target.scrollLeft;
        if (isEdge()) { this.wheelHandler(true); }
        this.headerContainer.onHScroll(scrollLeft);
        this._horizontalForOfs.forEach(vfor => vfor.onHScroll(scrollLeft));
        this.cdr.markForCheck();

        this.zone.run(() => {
            this.zone.onStable.pipe(first()).subscribe(() => {
                this.parentVirtDir.onChunkLoad.emit(this.headerContainer.state);
            });
        });

        this.hideOverlays();
    }

    /**
    * @hidden
    * @internal
    */
    public hideOverlays() {
        this.overlayIDs.forEach(overlayID => {
            this.overlayService.hide(overlayID);
            this.overlayService.onClosed.pipe(
                filter(o => o.id === overlayID),
                takeUntil(this.destroy$)).subscribe(() => {
                    this.nativeElement.focus();
                });
        });
    }

    private keydownHandler(event) {
        const key = event.key.toLowerCase();
        if ((isNavigationKey(key) && event.keyCode !== 32) || key === 'tab' || key === 'pagedown' || key === 'pageup') {
            event.preventDefault();
            if (key === 'pagedown') {
                this.verticalScrollContainer.scrollNextPage();
                this.nativeElement.focus();
            } else if (key === 'pageup') {
                this.verticalScrollContainer.scrollPrevPage();
                this.nativeElement.focus();
            }
        }
    }

    constructor(
        public selectionService: IgxGridSelectionService,
        public crudService: IgxGridCRUDService,
        private gridAPI: GridBaseAPIService<IgxGridBaseComponent & IGridDataBindable>,
        public selection: IgxSelectionAPIService,
        @Inject(IgxGridTransaction) protected _transactions: TransactionService<Transaction, State>,
        private elementRef: ElementRef,
        private zone: NgZone,
        @Inject(DOCUMENT) public document,
        public cdr: ChangeDetectorRef,
        protected resolver: ComponentFactoryResolver,
        protected differs: IterableDiffers,
        protected viewRef: ViewContainerRef,
        public navigation: IgxGridNavigationService,
        public filteringService: IgxFilteringService,
        @Inject(IgxOverlayService) protected overlayService: IgxOverlayService,
        public summaryService: IgxGridSummaryService,
        @Optional() @Inject(DisplayDensityToken) protected _displayDensityOptions: IDisplayDensityOptions) {
        super(_displayDensityOptions);
        this.resizeHandler = () => {
            this.zone.run(() => this.calculateGridSizes());
        };
    }

    _setupServices() {
        this.gridAPI.grid = this;
        this.crudService.grid = this;
        this.navigation.grid = this;
        this.filteringService.grid = this;
        this.summaryService.grid = this;
    }

    _setupListeners() {
        const destructor = takeUntil(this.destroy$);

        this.onRowAdded.pipe(destructor).subscribe(args => this.refreshGridState(args));
        this.onRowDeleted.pipe(destructor).subscribe(args => {
            this.summaryService.deleteOperation = true;
            this.summaryService.clearSummaryCache(args);
        });
        this.transactions.onStateUpdate.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.summaryService.clearSummaryCache();
            this._pipeTrigger++;
            this.markForCheck();
            if (this.transactions.getAggregatedChanges(false).length === 0) {
                // Needs better check, calling 'transactions.clear()' will also trigger this
                if (this.gridAPI.atInexistingPage()) {
                    this.page--;
                }
            }
        });

        this.onPagingDone.pipe(destructor).subscribe(() => {
            this.endEdit(true);
            this.selectionService.clear();
            this.selectionService.activeElement = null;
        });

        this.onColumnMoving.pipe(destructor).subscribe(() => this.endEdit(true));
        this.onColumnResized.pipe(destructor).subscribe(() => this.endEdit(true));

        this.overlayService.onOpened.pipe(takeUntil(this.destroy$)).subscribe((event) => {
            if (this.overlayService.getOverlayById(event.id).settings.outlet === this.outletDirective &&
                this.overlayIDs.indexOf(event.id) < 0) {
                this.overlayIDs.push(event.id);
            }
        });
        this.overlayService.onClosed.pipe(takeUntil(this.destroy$)).subscribe((event) => {
            const ind = this.overlayIDs.indexOf(event.id);
            if (ind !== -1) {
                this.overlayIDs.splice(ind, 1);
            }
        });
    }

    // TODO: Refactor
    /**
     * @hidden
     */
    public ngOnInit() {
        this._setupServices();
        this._setupListeners();
        this.columnListDiffer = this.differs.find([]).create(null);
        this.calcWidth = this._width && this._width.indexOf('%') === -1 ? parseInt(this._width, 10) : 0;
        this.shouldGenerate = this.autoGenerate;
        this._scrollWidth = this.getScrollWidth();
    }

    protected setupColumns() {
        if (this.autoGenerate) {
            this.autogenerateColumns();
        }

        this.initColumns(this.columnList, (col: IgxColumnComponent) => this.onColumnInit.emit(col));

        this.columnListDiffer.diff(this.columnList);
        this.markForCheck();
        this.resetCaches();
        this._derivePossibleHeight();

        this.columnList.changes
        .pipe(takeUntil(this.destroy$))
        .subscribe((change: QueryList<IgxColumnComponent>) => { this.onColumnsChanged(change); });
    }

    /**
     * @hidden
     * @internal
     */
    public resetColumnsVisibleIndexCache() {
        this.columnList.forEach(column => column.resetVisibleIndex());
    }

    /**
     * @hidden
     * @internal
     */
    public resetForOfCache() {
        const firstVirtRow = this.dataRowList.first;
        if (firstVirtRow) {
            firstVirtRow.virtDirRow.assumeMaster();
        }
    }

    /**
     * @hidden
     * @internal
     */
    public resetColumnCollections() {
        this._visibleColumns.length = 0;
        this._pinnedVisible.length = 0;
        this._unpinnedVisible.length = 0;
    }

    /**
     * @hidden
     * @internal
     */
    public resetCachedWidths() {
        this._unpinnedWidth = NaN;
        this._pinnedWidth = NaN;
        this._totalWidth = NaN;
    }

    /**
     * @hidden
     * @internal
     */
    public resetCaches() {
        this.resetForOfCache();
        this.resetColumnsVisibleIndexCache();
        this.resetColumnCollections();
        this.resetCachedWidths();
        this._columnGroups = this.columnList.some(col => col.columnGroup);
    }

    /**
     * @hidden
     */
    public ngAfterContentInit() {
        this.setupColumns();
    }

    /**
     * @hidden
     */
    public ngAfterViewInit() {
        this.zone.runOutsideAngular(() => {
            this.document.defaultView.addEventListener('resize', this.resizeHandler);
            this._keydownListener = this.keydownHandler.bind(this);
            this.nativeElement.addEventListener('keydown', this._keydownListener);
        });
        this.initPinning();

        this.onDensityChanged.pipe(takeUntil(this.destroy$)).subscribe(() => {
            requestAnimationFrame(() => {
                this.summaryService.summaryHeight = 0;
                this.reflow();
                this.verticalScrollContainer.recalcUpdateSizes();
            });
        });
        this._ngAfterViewInitPassed = true;
        this.calculateGridSizes();

        // In some rare cases we get the AfterViewInit before the grid is added to the DOM
        // and as a result we get 0 width and can't size ourselves properly.
        // In order to prevent that add a mutation observer that watches if we have been added.
        if (!this.isAttachedToDom) {
            const config = { childList: true, subtree: true };
            const callback = (mutationsList) => {
                const childListHasChanged = mutationsList.filter((mutation) => {
                    return mutation.type === 'childList';
                }).length > 0;
                if (childListHasChanged && this.isAttachedToDom) {
                    this.reflow();
                    this._observer.disconnect();
                    this._observer = null;
                }
            };

            this._observer = new MutationObserver(callback);
            this._observer.observe(this.document.body, config);
        }

        this._dataRowList.changes.pipe(takeUntil(this.destroy$)).subscribe(list =>
            this._horizontalForOfs = this.combineForOfCollections(list.toArray()
                .filter(item => item.element.nativeElement.parentElement !== null), this._summaryRowList)
        );
        this._summaryRowList.changes.pipe(takeUntil(this.destroy$)).subscribe(summaryList =>
            this._horizontalForOfs - this.combineForOfCollections(this._dataRowList, summaryList.toArray()
                .filter(item => item.element.nativeElement.parentElement !== null)));

        this.zone.runOutsideAngular(() => {
            this._vScrollListener = this.verticalScrollHandler.bind(this);
            this.verticalScrollContainer.getVerticalScroll().addEventListener('scroll', this._vScrollListener);
        });

        this.zone.runOutsideAngular(() => {
            this._hScrollListener = this.horizontalScrollHandler.bind(this);
            this.parentVirtDir.getHorizontalScroll().addEventListener('scroll', this._hScrollListener);
        });
        this._horizontalForOfs = this.combineForOfCollections(this._dataRowList, this._summaryRowList);
        const vertScrDC = this.verticalScrollContainer.dc.instance._viewContainer.element.nativeElement;
        vertScrDC.addEventListener('scroll', (evt) => { this.scrollHandler(evt); });
        vertScrDC.addEventListener('wheel', () => { this.wheelHandler(); });

        this.verticalScrollContainer.onDataChanged.pipe(takeUntil(this.destroy$)).subscribe(() => {
            requestAnimationFrame(() => {
                if (!this._destroyed) {
                    this.reflow();
                }
            });
        });
    }

    private combineForOfCollections(dataList, summaryList) {
        return dataList.map(row => row.virtDirRow).concat(summaryList.map(row => row.virtDirRow));
    }

    /**
     * @hidden
     */
    public ngOnDestroy() {
        this.tmpOutlets.forEach((tmplOutlet) => {
            tmplOutlet.cleanCache();
        });
        this.zone.runOutsideAngular(() => {
            this.document.defaultView.removeEventListener('resize', this.resizeHandler);
            this.nativeElement.removeEventListener('keydown', this._keydownListener);
            this.verticalScrollContainer.getVerticalScroll().removeEventListener('scroll', this._vScrollListener);
            this.parentVirtDir.getHorizontalScroll().removeEventListener('scroll', this._hScrollListener);
            const vertScrDC = this.verticalScrollContainer.dc.instance._viewContainer.element.nativeElement;
            vertScrDC.removeEventListener('scroll', (evt) => { this.scrollHandler(evt); });
            vertScrDC.removeEventListener('wheel', () => { this.wheelHandler(); });
        });
        if (this._observer) {
            this._observer.disconnect();
        }
        this.destroy$.next(true);
        this.destroy$.complete();
        this._destroyed = true;
    }

    /**
     * @hidden
     */
    public dataLoading(event) {
        this.onDataPreLoad.emit(event);
    }

    /**
     * Toggles the specified column's visibility.
     * ```typescript
     * this.grid1.toggleColumnVisibility({
     *       column: this.grid1.columns[0],
     *       newValue: true
     * });
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public toggleColumnVisibility(args: IColumnVisibilityChangedEventArgs) {
        const col = args.column ? this.columnList.find((c) => c === args.column) : undefined;

        if (!col) {
            return;
        }

        col.hidden = args.newValue;
        this.onColumnVisibilityChanged.emit(args);

        this.markForCheck();
    }

    /**
     * Returns the native element of the `IgxGridComponent`.
     * ```typescript
     * const nativeEl = this.grid.nativeElement.
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get nativeElement() {
        return this.elementRef.nativeElement;
    }

    /**
     * @hidden
     */
    protected get outlet() {
        return this.outletDirective;
    }

    /**
     * Returns the `IgxGridComponent`'s rows height.
     * ```typescript
     * const rowHeigh = this.grid.defaultRowHeight;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get defaultRowHeight(): number {
        switch (this.displayDensity) {
            case DisplayDensity.cosy:
                return 40;
            case DisplayDensity.compact:
                return 32;
            default:
                return 50;
        }
    }

    get defaultSummaryHeight(): number {
        switch (this.displayDensity) {
            case DisplayDensity.cosy:
                return 30;
            case DisplayDensity.compact:
                return 24;
            default:
                return 36;
        }
    }

    /**
     * Returns the `IgxGridHeaderGroupComponent`'s minimum allowed width.
     * Used internally for restricting header group component width.
     * The values below depend on the header cell default right/left padding values.
	 * @memberof IgxGridBaseComponent
     */
    get defaultHeaderGroupMinWidth(): number {
        switch (this.displayDensity) {
            case DisplayDensity.cosy:
                return 32;
            case DisplayDensity.compact:
                return 24;
            default:
                return 48;
        }
    }

    /**
     * Returns the maximum width of the container for the pinned `IgxColumnComponent`s.
     * The width is 80% of the total grid width.
     * ```typescript
     * const maxPinnedColWidth = this.grid.calcPinnedContainerMaxWidth;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get calcPinnedContainerMaxWidth(): number {
        return (this.calcWidth * 80) / 100;
    }

    /**
     * Returns the minimum width of the container for the unpinned `IgxColumnComponent`s.
     * The width is 20% of the total grid width.
     * ```typescript
     * const minUnpinnedColWidth = this.grid.unpinnedAreaMinWidth;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get unpinnedAreaMinWidth(): number {
        return (this.calcWidth * 20) / 100;
    }

    /**
     * Returns the current width of the container for the pinned `IgxColumnComponent`s.
     * ```typescript
     * const pinnedWidth = this.grid.getPinnedWidth;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get pinnedWidth() {
        if (!isNaN(this._pinnedWidth)) { return this._pinnedWidth; }
        this._pinnedWidth = this.getPinnedWidth();
        return this._pinnedWidth;
    }

    /**
     * Returns the current width of the container for the unpinned `IgxColumnComponent`s.
     * ```typescript
     * const unpinnedWidth = this.grid.getUnpinnedWidth;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get unpinnedWidth() {
        if (!isNaN(this._unpinnedWidth)) { return this._unpinnedWidth; }
        this._unpinnedWidth = this.getUnpinnedWidth();
        return this._unpinnedWidth;
    }

    /**
     * @hidden
     * Gets the combined width of the columns that are specific to the enabled grid features. They are fixed.
     * TODO: Update for Angular 8. Calling parent class getter using super is not supported for now.
     */
    public get featureColumnsWidth() {
        return this.getFeatureColumnsWidth();
    }

    /**
     * @hidden
     */
    get summariesMargin() {
        return this.rowSelectable || this.rowDraggable ? this.featureColumnsWidth : 0;
    }

    /**
     * Returns an array of `IgxColumnComponent`s.
     * ```typescript
     * const colums = this.grid.columns.
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get columns(): IgxColumnComponent[] {
        return this._columns;
    }

    /**
     * Returns an array of the pinned `IgxColumnComponent`s.
     * ```typescript
     * const pinnedColumns = this.grid.pinnedColumns.
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get pinnedColumns(): IgxColumnComponent[] {
        if (this._pinnedVisible.length) {
            return this._pinnedVisible;
        }
        this._pinnedVisible = this._pinnedColumns.filter(col => !col.hidden);
        return this._pinnedVisible;
    }

    /**
     * Returns an array of unpinned `IgxColumnComponent`s.
     * ```typescript
     * const unpinnedColumns = this.grid.unpinnedColumns.
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get unpinnedColumns(): IgxColumnComponent[] {
        if (this._unpinnedVisible.length) {
            return this._unpinnedVisible;
        }
        this._unpinnedVisible = this._unpinnedColumns.filter((col) => !col.hidden);
        return this._unpinnedVisible;
    }

    /**
     * Returns the `width` to be set on `IgxGridHeaderGroupComponent`.
	 * @memberof IgxGridBaseComponent
     */
    public getHeaderGroupWidth(column: IgxColumnComponent): string {
        if (this.hasColumnLayouts) {
            return '';
        }
        const colWidth = column.width;
        const minWidth = this.defaultHeaderGroupMinWidth;
        const isPercentageWidth = colWidth && typeof colWidth === 'string' && colWidth.indexOf('%') !== -1;

        if (!isPercentageWidth && parseInt(column.width, 10) < minWidth) {
            return minWidth.toString();
        }

        return column.width;
    }

    /**
     * Returns the `IgxColumnComponent` by field name.
     * ```typescript
     * const myCol = this.grid1.getColumnByName("ID");
     * ```
     * @param name
     * @memberof IgxGridBaseComponent
     */
    public getColumnByName(name: string): IgxColumnComponent {
        return this.columnList.find((col) => col.field === name);
    }

    /**
     * Returns the `IgxColumnComponent` by index.
     * ```typescript
     * const myRow = this.grid1.getRowByIndex(1);
     * ```
     * @param index
     * @memberof IgxGridBaseComponent
     */
    public getRowByIndex(index: number): IgxRowComponent<IgxGridBaseComponent & IGridDataBindable> {
        return this.gridAPI.get_row_by_index(index);
    }

    /**
     * Returns `IgxGridRowComponent` object by the specified primary key .
     * Requires that the `primaryKey` property is set.
     * ```typescript
     * const myRow = this.grid1.getRowByKey("cell5");
     * ```
     * @param keyValue
     * @memberof IgxGridBaseComponent
     */
    public getRowByKey(keyValue: any): IgxRowComponent<IgxGridBaseComponent & IGridDataBindable> {
        return this.gridAPI.get_row_by_key(keyValue);
    }

    /**
     * Returns an array of visible `IgxColumnComponent`s.
     * ```typescript
     * const visibleColumns = this.grid.visibleColumns.
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get visibleColumns(): IgxColumnComponent[] {
        if (this._visibleColumns.length) {
            return this._visibleColumns;
        }
        this._visibleColumns = this.columnList.filter(c => !c.hidden);
        return this._visibleColumns;
    }

    /**
     * Returns the `IgxGridCellComponent` that matches the conditions.
     * ```typescript
     * const myCell = this.grid1.getCellByColumn(2,"UnitPrice");
     * ```
     * @param rowIndex
     * @param columnField
     * @memberof IgxGridBaseComponent
     */
    public getCellByColumn(rowIndex: number, columnField: string): IgxGridCellComponent {
        const columnId = this.columnList.map((column) => column.field).indexOf(columnField);
        if (columnId !== -1) {
            return this.gridAPI.get_cell_by_index(rowIndex, columnId);
        }
    }

    /**
     * Returns an `IgxGridCellComponent` object by the specified primary key and column field.
     * Requires that the primaryKey property is set.
     * ```typescript
     * grid.getCellByKey(1, 'index');
     * ```
     * @param rowSelector match any rowID
     * @param columnField
     * @memberof IgxGridBaseComponent
     */
    public getCellByKey(rowSelector: any, columnField: string): IgxGridCellComponent {
        return this.gridAPI.get_cell_by_key(rowSelector, columnField);
    }

    /**
     * Returns the total number of pages.
     * ```typescript
     * const totalPages = this.grid.totalPages;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get totalPages(): number {
        if (this.pagingState) {
            return this.pagingState.metadata.countPages;
        }
        return -1;
    }

    /**
     * Returns the total number of records.
     * Only functions when paging is enabled.
     * ```typescript
     * const totalRecords = this.grid.totalRecords;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get totalRecords(): number {
        if (this.pagingState) {
            return this.pagingState.metadata.countRecords;
        }
    }

    /**
     * Returns if the current page is the first page.
     * ```typescript
     * const firstPage = this.grid.isFirstPage;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get isFirstPage(): boolean {
        return this.page === 0;
    }

    /**
     * Returns if the current page is the last page.
     * ```typescript
     * const lastPage = this.grid.isLastPage;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get isLastPage(): boolean {
        return this.page + 1 >= this.totalPages;
    }

    /**
     * Returns the total width of the `IgxGridComponent`.
     * ```typescript
     * const gridWidth = this.grid.totalWidth;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get totalWidth(): number {
        if (!isNaN(this._totalWidth)) { return this._totalWidth; }
        // Take only top level columns
        const cols = this.visibleColumns.filter(col => col.level === 0 && !col.pinned);
        let totalWidth = 0;
        let i = 0;
        for (i; i < cols.length; i++) {
            totalWidth += parseInt(cols[i].calcWidth, 10) || 0;
        }
        this._totalWidth = totalWidth;
        return totalWidth;
    }

    get showRowCheckboxes(): boolean {
        return this.rowSelectable && this.columns.length > this.hiddenColumnsCount;
    }

    /**
     * @hidden
     */
    protected _moveColumns(from: IgxColumnComponent, to: IgxColumnComponent, pos: DropPosition) {
        const list = this.columnList.toArray();
        const fromIndex = list.indexOf(from);
        let toIndex = list.indexOf(to);

        if (pos === DropPosition.BeforeDropTarget) {
            toIndex--;
            if (toIndex < 0) {
                toIndex = 0;
            }
        }

        if (pos === DropPosition.AfterDropTarget) {
            toIndex++;
        }

        list.splice(toIndex, 0, ...list.splice(fromIndex, 1));
        const newList = this._resetColumnList(list);
        this.columnList.reset(newList);
        this.columnList.notifyOnChanges();
        this._columns = this.columnList.toArray();
    }

    /**
     * @hidden
     */
    protected _resetColumnList(list?) {
        if (!list) {
            list = this.columnList.toArray();
        }
        let newList = [];
        list.filter(c => c.level === 0).forEach(p => {
            newList.push(p);
            if (p.columnGroup) {
                newList = newList.concat(p.allChildren);
            }
        });
        return newList;
    }

    /**
     * @hidden
     */
    protected _reorderPinnedColumns(from: IgxColumnComponent, to: IgxColumnComponent, position: DropPosition) {
        const pinned = this._pinnedColumns;
        let dropIndex = pinned.indexOf(to);

        if (to.columnGroup) {
            dropIndex += to.allChildren.length;
        }

        if (position === DropPosition.BeforeDropTarget) {
            dropIndex--;
        }

        if (position === DropPosition.AfterDropTarget) {
            dropIndex++;
        }

        pinned.splice(dropIndex, 0, ...pinned.splice(pinned.indexOf(from), 1));
    }

    /**
     * @hidden
     */
    protected _moveChildColumns(parent: IgxColumnComponent, from: IgxColumnComponent, to: IgxColumnComponent, pos: DropPosition) {
        const buffer = parent.children.toArray();
        const fromIndex = buffer.indexOf(from);
        let toIndex = buffer.indexOf(to);

        if (pos === DropPosition.BeforeDropTarget) {
            toIndex--;
        }

        if (pos === DropPosition.AfterDropTarget) {
            toIndex++;
        }

        buffer.splice(toIndex, 0, ...buffer.splice(fromIndex, 1));
        parent.children.reset(buffer);
    }
    /**
     * Moves a column to the specified drop target.
     * ```typescript
     * grid.moveColumn(compName, persDetails);
     * ```
	  * @memberof IgxGridBaseComponent
	  */
    public moveColumn(column: IgxColumnComponent, dropTarget: IgxColumnComponent, pos: DropPosition = DropPosition.None) {

        let position = pos;
        const fromIndex = column.visibleIndex;
        const toIndex = dropTarget.visibleIndex;

        if (pos === DropPosition.BeforeDropTarget && fromIndex < toIndex) {
            position = DropPosition.BeforeDropTarget;
        } else if (pos === DropPosition.AfterDropTarget && fromIndex > toIndex) {
            position = DropPosition.AfterDropTarget;
        } else {
            position = DropPosition.None;
        }


        if ((column.level !== dropTarget.level) ||
            (column.topLevelParent !== dropTarget.topLevelParent)) {
            return;
        }

        this.endEdit(true);
        if (column.level) {
            this._moveChildColumns(column.parent, column, dropTarget, position);
        }

        if (dropTarget.pinned && column.pinned) {
            this._reorderPinnedColumns(column, dropTarget, position);
        }

        if (dropTarget.pinned && !column.pinned) {
            column.pin();
            this._reorderPinnedColumns(column, dropTarget, position);
        }

        if (!dropTarget.pinned && column.pinned) {
            column.unpin();

            const list = this.columnList.toArray();
            const fi = list.indexOf(column);
            const ti = list.indexOf(dropTarget);

            if (pos === DropPosition.BeforeDropTarget && fi < ti) {
                position = DropPosition.BeforeDropTarget;
            } else if (pos === DropPosition.AfterDropTarget && fi > ti) {
                position = DropPosition.AfterDropTarget;
            } else {
                position = DropPosition.None;
            }
        }

        this._moveColumns(column, dropTarget, position);
        this.cdr.detectChanges();
        if (this.hasColumnLayouts) {
            this.columns.filter(x => x.columnLayout).forEach( x => x.populateVisibleIndexes());
        }

        const args = {
            source: column,
            target: dropTarget
        };

        this.onColumnMovingEnd.emit(args);
    }

    /**
     * Goes to the next page of the `IgxGridComponent`, if the grid is not already at the last page.
     * ```typescript
     * this.grid1.nextPage();
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public nextPage(): void {
        if (!this.isLastPage) {
            this.page += 1;
        }
    }

    /**
     * Goes to the previous page of the `IgxGridComponent`, if the grid is not already at the first page.
     * ```typescript
     * this.grid1.previousPage();
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public previousPage(): void {
        if (!this.isFirstPage) {
            this.page -= 1;
        }
    }

    /**
     * Goes to the desired page index.
     * ```typescript
     * this.grid1.paginate(1);
     * ```
     * @param val
     * @memberof IgxGridBaseComponent
     */
    public paginate(val: number): void {
        if (val < 0 || val > this.totalPages - 1) {
            return;
        }

        this.page = val;
    }

    /**
     * Manually marks the `IgxGridComponent` for change detection.
     * ```typescript
     * this.grid1.markForCheck();
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public markForCheck() {
        this.cdr.detectChanges();
    }

    /**
     * Creates a new `IgxGridRowComponent` and adds the data record to the end of the data source.
     * ```typescript
     * const record = {
     *     ID: this.grid1.data[this.grid1.data.length - 1].ID + 1,
     *     Name: this.newRecord
     * };
     * this.grid1.addRow(record);
     * ```
     * @param data
     * @memberof IgxGridBaseComponent
     */
    public addRow(data: any): void {
        this.gridAPI.addRowToData(data);

        this.onRowAdded.emit({ data });
        this._pipeTrigger++;
        this.cdr.markForCheck();
    }

    /**
     * Removes the `IgxGridRowComponent` and the corresponding data record by primary key.
     * Requires that the `primaryKey` property is set.
     * The method accept rowSelector as a parameter, which is the rowID.
     * ```typescript
     * this.grid1.deleteRow(0);
     * ```
     * @param rowSelector
     * @memberof IgxGridBaseComponent
     */
    public deleteRow(rowSelector: any): void {
        if (this.primaryKey !== undefined && this.primaryKey !== null) {
            this.deleteRowById(rowSelector);
        }
    }

    /** @hidden */
    public deleteRowById(rowId: any) {
        this.gridAPI.deleteRowById(rowId);
    }

    /**
     * @hidden
     */
    protected deleteRowFromData(rowID: any, index: number) {
        //  if there is a row (index !== 0) delete it
        //  if there is a row in ADD or UPDATE state change it's state to DELETE
        if (index !== -1) {
            if (this.transactions.enabled) {
                const transaction: Transaction = { id: rowID, type: TransactionType.DELETE, newValue: null };
                this.transactions.add(transaction, this.data[index]);
            } else {
                this.data.splice(index, 1);
            }
        } else {
            const state: State = this.transactions.getState(rowID);
            this.transactions.add({ id: rowID, type: TransactionType.DELETE, newValue: null }, state && state.recordRef);
        }
    }

    /**
     * Updates the `IgxGridRowComponent` and the corresponding data record by primary key.
     * Requires that the `primaryKey` property is set.
     * ```typescript
     * this.gridWithPK.updateCell('Updated', 1, 'ProductName');
     * ```
     * @param value the new value which is to be set.
     * @param rowSelector corresponds to rowID.
     * @param column corresponds to column field.
     * @memberof IgxGridBaseComponent
     */
    public updateCell(value: any, rowSelector: any, column: string): void {
        if (this.isDefined(this.primaryKey)) {
            const col = this.columnList.toArray().find(c => c.field === column);
            if (col) {
                // Simplify
                const rowData = this.gridAPI.getRowData(rowSelector);
                const index = this.gridAPI.get_row_index_in_data(rowSelector);
                // If row passed is invalid
                if (index < 0) {
                    return;
                }
                const id = {
                    rowID: rowSelector,
                    columnID: col.index,
                    rowIndex: index
                };

                const cell = new IgxCell(id, index, col, rowData[col.field], rowData[col.field], rowData);
                const args = this.gridAPI.update_cell(cell, value);

                if (this.crudService.cell && this.crudService.sameCell(cell)) {
                    if (args.cancel) {
                        return;
                    }
                    this.gridAPI.escape_editMode();
                }

                this.cdr.markForCheck();
            }
        }
    }

    /**
     * Updates the `IgxGridRowComponent`, which is specified by
     * rowSelector parameter and the data source record with the passed value.
     * This method will apply requested update only if primary key is specified in the grid.
     * ```typescript
     * grid.updateRow({
     *       ProductID: 1, ProductName: 'Spearmint', InStock: true, UnitsInStock: 1, OrderDate: new Date('2005-03-21')
     *   }, 1);
     * ```
     * @param value
     * @param rowSelector correspond to rowID
     * @memberof IgxGridBaseComponent
     */
    public updateRow(value: any, rowSelector: any): void {
        if (this.isDefined(this.primaryKey)) {
            const editableCell = this.crudService.cell;
            if (editableCell && editableCell.id.rowID === rowSelector) {
                this.gridAPI.escape_editMode();
            }
            const row = new IgxRow(rowSelector, -1, this.gridAPI.getRowData(rowSelector));
            this.gridAPI.update_row(row, value);
            this.cdr.markForCheck();
        }
    }

    /**
     * Sort a single `IgxColumnComponent`.
     * Sort the `IgxGridComponent`'s `IgxColumnComponent` based on the provided array of sorting expressions.
     * ```typescript
     * this.grid.sort({ fieldName: name, dir: SortingDirection.Asc, ignoreCase: false });
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public sort(expression: ISortingExpression | Array<ISortingExpression>): void {
        this.endEdit(false);
        if (expression instanceof Array) {
            this.gridAPI.sort_multiple(expression);
        } else {
            this.gridAPI.sort(expression);
        }
        this.onSortingDone.emit(expression);
    }

    /**
     * Filters a single `IgxColumnComponent`.
     * ```typescript
     * public filter(term) {
     *      this.grid.filter("ProductName", term, IgxStringFilteringOperand.instance().condition("contains"));
     * }
     * ```
     * @param name
     * @param value
     * @param conditionOrExpressionTree
     * @param ignoreCase
     * @memberof IgxGridBaseComponent
     */
    public filter(name: string, value: any, conditionOrExpressionTree?: IFilteringOperation | IFilteringExpressionsTree,
        ignoreCase?: boolean) {
        this.filteringService.filter(name, value, conditionOrExpressionTree, ignoreCase);
    }

    /**
     * Filters all the `IgxColumnComponent` in the `IgxGridComponent` with the same condition.
     * ```typescript
     * grid.filterGlobal('some', IgxStringFilteringOperand.instance().condition('contains'));
     * ```
     * @param value
     * @param condition
     * @param ignoreCase
     * @memberof IgxGridBaseComponent
     */
    public filterGlobal(value: any, condition?, ignoreCase?) {
        this.filteringService.filterGlobal(value, condition, ignoreCase);
    }

    /**
     * Enables summaries for the specified column and applies your customSummary.
     * If you do not provide the customSummary, then the default summary for the column data type will be applied.
     * ```typescript
     * grid.enableSummaries([{ fieldName: 'ProductName' }, { fieldName: 'ID' }]);
     * ```
     * Enable summaries for the listed columns.
     * ```typescript
     * grid.enableSummaries('ProductName');
     * ```
     * @param rest
     * @memberof IgxGridBaseComponent
     */
    public enableSummaries(...rest) {
        if (rest.length === 1 && Array.isArray(rest[0])) {
            this._multipleSummaries(rest[0], true);
        } else {
            this._summaries(rest[0], true, rest[1]);
        }
        this.calculateGridHeight();
        this.cdr.detectChanges();
    }

    /**
     * Disable summaries for the specified column.
     * ```typescript
     * grid.disableSummaries('ProductName');
     * ```
     *
     * Disable summaries for the listed columns.
     * ```typescript
     * grid.disableSummaries([{ fieldName: 'ProductName' }]);
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public disableSummaries(...rest) {
        if (rest.length === 1 && Array.isArray(rest[0])) {
            this._disableMultipleSummaries(rest[0]);
        } else {
            this._summaries(rest[0], false);
        }
    }

    /**
     * If name is provided, clears the filtering state of the corresponding `IgxColumnComponent`,
     * otherwise clears the filtering state of all `IgxColumnComponent`s.
     * ```typescript
     * this.grid.clearFilter();
     * ```
     * @param name
     * @memberof IgxGridBaseComponent
     */
    public clearFilter(name?: string) {
        this.filteringService.clearFilter(name);
    }

    /**
     * If name is provided, clears the sorting state of the corresponding `IgxColumnComponent`,
     * otherwise clears the sorting state of all `IgxColumnComponent`.
     * ```typescript
     * this.grid.clearSort();
     * ```
     * @param name
     * @memberof IgxGridBaseComponent
     */
    public clearSort(name?: string) {
        if (!name) {
            this.sortingExpressions = [];
            return;
        }
        if (!this.gridAPI.get_column_by_name(name)) {
            return;
        }
        this.gridAPI.clear_sort(name);
    }

    /**
     * @hidden
     */
    @DeprecateMethod('There is no need to call clearSummaryCache method.The summary cache is cleared automatically when needed.')
    public clearSummaryCache(args?) {
    }

    /**
     * @hidden
     */
    public refreshGridState(args?) {
        this.endEdit(true);
        this.summaryService.clearSummaryCache(args);
    }

    // TODO: We have return values here. Move them to event args ??

    /**
     * Pins a column by field name. Returns whether the operation is successful.
     * ```typescript
     * this.grid.pinColumn("ID");
     * ```
     * @param columnName
     * @param index
     * @memberof IgxGridBaseComponent
     */
    public pinColumn(columnName: string | IgxColumnComponent, index?): boolean {
        const col = columnName instanceof IgxColumnComponent ? columnName : this.getColumnByName(columnName);
        return col.pin(index);
    }

    /**
     * Unpins a column by field name. Returns whether the operation is successful.
     * ```typescript
     * this.grid.pinColumn("ID");
     * ```
     * @param columnName
     * @param index
     * @memberof IgxGridBaseComponent
     */
    public unpinColumn(columnName: string | IgxColumnComponent, index?): boolean {
        const col = columnName instanceof IgxColumnComponent ? columnName : this.getColumnByName(columnName);
        return col.unpin(index);
    }


    /**
     * Recalculates grid width/height dimensions. Should be run when changing DOM elements dimentions manually that affect the grid's size.
     * ```typescript
     * this.grid.reflow();
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public reflow() {
        this.calculateGridSizes();
    }

    /**
     * @hidden
     */
    @DeprecateMethod('There is no need to call recalculateSummaries method. The summaries are recalculated automatically when needed.')
    public recalculateSummaries() {
    }

    /**
     * Finds the next occurrence of a given string in the grid and scrolls to the cell if it isn't visible.
     * Returns how many times the grid contains the string.
     * ```typescript
     * this.grid.findNext("financial");
     * ```
     * @param text the string to search.
     * @param caseSensitive optionally, if the search should be case sensitive (defaults to false).
     * @param exactMatch optionally, if the text should match the entire value  (defaults to false).
     * @memberof IgxGridBaseComponent
     */
    public findNext(text: string, caseSensitive?: boolean, exactMatch?: boolean): number {
        return this.find(text, 1, caseSensitive, exactMatch);
    }

    /**
     * Finds the previous occurrence of a given string in the grid and scrolls to the cell if it isn't visible.
     * Returns how many times the grid contains the string.
     * ```typescript
     * this.grid.findPrev("financial");
     * ````
     * @param text the string to search.
     * @param caseSensitive optionally, if the search should be case sensitive (defaults to false).
     * @param exactMatch optionally, if the text should match the entire value (defaults to false).
     * @memberof IgxGridBaseComponent
     */
    public findPrev(text: string, caseSensitive?: boolean, exactMatch?: boolean): number {
        return this.find(text, -1, caseSensitive, exactMatch);
    }

    /**
     * Reapplies the existing search.
     * Returns how many times the grid contains the last search.
     * ```typescript
     * this.grid.refreshSearch();
     * ```
     * @param updateActiveInfo
     * @memberof IgxGridBaseComponent
     */
    public refreshSearch(updateActiveInfo?: boolean): number {
        if (this.lastSearchInfo.searchText) {
            this.rebuildMatchCache();

            if (updateActiveInfo) {
                const activeInfo = IgxTextHighlightDirective.highlightGroupsMap.get(this.id);
                this.lastSearchInfo.matchInfoCache.forEach((match, i) => {
                    if (match.column === activeInfo.column &&
                        match.row === activeInfo.row &&
                        match.index === activeInfo.index) {
                        this.lastSearchInfo.activeMatchIndex = i;
                    }
                });
            }

            return this.find(this.lastSearchInfo.searchText, 0, this.lastSearchInfo.caseSensitive, this.lastSearchInfo.exactMatch, false);
        } else {
            return 0;
        }
    }

    /**
     * Removes all the highlights in the cell.
     * ```typescript
     * this.grid.clearSearch();
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public clearSearch() {
        this.lastSearchInfo = {
            searchText: '',
            caseSensitive: false,
            exactMatch: false,
            activeMatchIndex: 0,
            matchInfoCache: []
        };

        this.rowList.forEach((row) => {
            if (row.cells) {
                row.cells.forEach((c) => {
                    c.clearHighlight();
                });
            }
        });
    }

    /**
     * Returns if the `IgxGridComponent` has sortable columns.
     * ```typescript
     * const sortableGrid = this.grid.hasSortableColumns;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get hasSortableColumns(): boolean {
        return this.columnList.some((col) => col.sortable);
    }

    /**
     * Returns if the `IgxGridComponent` has editable columns.
     * ```typescript
     * const editableGrid = this.grid.hasEditableColumns;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get hasEditableColumns(): boolean {
        return this.columnList.some((col) => col.editable);
    }

    /**
     * Returns if the `IgxGridComponent` has fiterable columns.
     * ```typescript
     * const filterableGrid = this.grid.hasFilterableColumns;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get hasFilterableColumns(): boolean {
        return this.columnList.some((col) => col.filterable);
    }

    /**
     * Returns if the `IgxGridComponent` has summarized columns.
     * ```typescript
     * const summarizedGrid = this.grid.hasSummarizedColumns;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get hasSummarizedColumns(): boolean {
        return this.summaryService.hasSummarizedColumns;
    }

    /**
     * @hidden
     */
    get rootSummariesEnabled(): boolean {
        return this.summaryCalculationMode !== GridSummaryCalculationMode.childLevelsOnly;
    }
    /**
     * Returns if the `IgxGridComponent` has moveable columns.
     * ```typescript
     * const movableGrid = this.grid.hasMovableColumns;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get hasMovableColumns(): boolean {
        return this.columnList && this.columnList.some((col) => col.movable);
    }

    /**
     * Returns if the `IgxGridComponent` has column groups.
     * ```typescript
     * const groupGrid = this.grid.hasColumnGroups;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get hasColumnGroups(): boolean {
        return this._columnGroups;
    }
    /**
     * Returns if the `IgxGridComponent` has column layouts for multi-row layout definition.
     * ```typescript
     * const layoutGrid = this.grid.hasColumnLayouts;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public get hasColumnLayouts() {
        return !!this.columnList.some(col => col.columnLayout);
    }

    /**
     * Returns an array of the selected `IgxGridCellComponent`s.
     * ```typescript
     * const selectedCells = this.grid.selectedCells;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get selectedCells(): IgxGridCellComponent[] | any[] {
        if (this.dataRowList) {
            return this.dataRowList.map((row) => row.cells.filter((cell) => cell.selected))
                .reduce((a, b) => a.concat(b), []);
        }
        return [];
    }

    /**
     * @hidden
     */
    get multiRowLayoutRowSize() {
        return this._multiRowLayoutRowSize;
    }

    /**
     * @hidden
     */
    protected get rowBasedHeight() {
        return this.dataLength * this.rowHeight;
    }

    /**
     * @hidden
     */
    protected get isPercentWidth() {
        return this._width && this._width.indexOf('%') !== -1;
    }

    /**
     * @hidden
     */
    protected get isPercentHeight() {
        return this._height && this._height.indexOf('%') !== -1;
    }

    /**
     * @hidden
     * Sets this._height
     */
    protected _derivePossibleHeight() {
        if (!this.isPercentHeight || !this._height || !this.isAttachedToDom || this.rowBasedHeight === 0) {
            return;
        }
        if (!this.nativeElement.parentNode || !this.nativeElement.parentNode.clientHeight) {
            const viewPortHeight = document.documentElement.clientHeight;
            this._height = this.rowBasedHeight <= viewPortHeight ? null : viewPortHeight.toString();
        } else {
            const parentHeight = this.nativeElement.parentNode.getBoundingClientRect().height;
            this._height = this.rowBasedHeight <= parentHeight ? null : this._height;
        }
    }

    /**
     * @hidden
     * Sets columns defaultWidth property
     */
    protected _derivePossibleWidth() {
        if (!this.columnWidthSetByUser) {
            this._columnWidth = this.getPossibleColumnWidth();
            this.columnList.forEach((column: IgxColumnComponent) => {
                if (this.hasColumnLayouts && parseInt(this._columnWidth, 10)) {
                    const columnWidthCombined = parseInt(this._columnWidth, 10) * (column.colEnd ? column.colEnd - column.colStart : 1);
                    column.defaultWidth = columnWidthCombined + 'px';
                } else {
                    column.defaultWidth = this._columnWidth;
                }
            });
            this.resetCachedWidths();
        }
    }

    /**
     * @hidden
     */
    protected get defaultTargetBodyHeight(): number {
        const allItems = this.totalItemCount || this.dataLength;
        return this.rowHeight * Math.min(this._defaultTargetRecordNumber,
            this.paging ? Math.min(allItems, this.perPage) : allItems);
    }

    /**
     * @hidden
     * Sets TBODY height i.e. this.calcHeight
     */
    protected calculateGridHeight() {
        this._derivePossibleHeight();
        // TODO: Calculate based on grid density
        if (this.maxLevelHeaderDepth) {
            this.theadRow.nativeElement.style.height = `${(this.maxLevelHeaderDepth + 1) * this.defaultRowHeight +
                (this.allowFiltering && this.filterMode === FilterMode.quickFilter ? FILTER_ROW_HEIGHT : 0) + 1}px`;
        }
        this.summariesHeight = 0;
        if (!this._height) {
            this.calcHeight = null;
            if (this.hasSummarizedColumns && this.rootSummariesEnabled) {
                this.summariesHeight = this.summaryService.calcMaxSummaryHeight();
            }
            return;
        }

        if (this.hasSummarizedColumns && this.rootSummariesEnabled) {
            this.summariesHeight = this.summaryService.calcMaxSummaryHeight();
        }

        this.calcHeight = this._calculateGridBodyHeight();
    }

    /**
     * @hidden
     */
    protected getGroupAreaHeight(): number {
        return 0;
    }

    /**
     * @hidden
     */
    protected getToolbarHeight(): number {
        let toolbarHeight = 0;
        if (this.showToolbar && this.toolbarHtml != null) {
            toolbarHeight = this.toolbarHtml.nativeElement.firstElementChild ?
                this.toolbarHtml.nativeElement.offsetHeight : 0;
        }
        return toolbarHeight;
    }

    /**
     * @hidden
     */
    protected getPagingHeight(): number {
        let pagingHeight = 0;
        if (this.paging && this.paginator) {
            pagingHeight = this.paginator.nativeElement.firstElementChild ?
                this.paginator.nativeElement.offsetHeight : 0;
        }
        return pagingHeight;
    }
    /**
     * @hidden
     */
    protected _calculateGridBodyHeight() {
        const footerBordersAndScrollbars = this.tfoot.nativeElement.offsetHeight -
            this.tfoot.nativeElement.clientHeight;
        const computed = this.document.defaultView.getComputedStyle(this.nativeElement);
        const toolbarHeight = this.getToolbarHeight();
        const pagingHeight = this.getPagingHeight();
        const groupAreaHeight = this.getGroupAreaHeight();
        let gridHeight;

        if (this.isPercentHeight) {
            /*height in %*/
            if (computed.getPropertyValue('height').indexOf('%') === -1 ) {
                gridHeight = parseInt(computed.getPropertyValue('height'), 10);
            } else {
                return this.defaultTargetBodyHeight;
            }
        } else {
            gridHeight = parseInt(this._height, 10);
        }
        const height = Math.abs(gridHeight - toolbarHeight -
                this.theadRow.nativeElement.offsetHeight -
                this.summariesHeight - pagingHeight -
                groupAreaHeight - footerBordersAndScrollbars -
                this.scr.nativeElement.clientHeight);

        if (height === 0 || isNaN(gridHeight)) {
            const bodyHeight = this.defaultTargetBodyHeight;
            return bodyHeight > 0 ? bodyHeight : null;
        }

        return height;
    }

    public get outerWidth() {
        return this.hasVerticalSroll() ? this.calcWidth + this.scrollWidth : this.calcWidth;
    }

    /**
     * @hidden
     * Gets the visible content height that includes header + tbody + footer.
     */
    public getVisibleContentHeight() {
        let height = this.theadRow.nativeElement.clientHeight + this.tbody.nativeElement.clientHeight;
        if (this.hasSummarizedColumns) {
            height += this.tfoot.nativeElement.clientHeight;
        }
        return height;
    }

    /**
     * @hidden
     */
    public getPossibleColumnWidth(baseWidth: number = null) {
        let computedWidth;
        if (baseWidth !== null) {
            computedWidth = baseWidth;
        } else {
            computedWidth = this.calcWidth ||
                parseInt(this.document.defaultView.getComputedStyle(this.nativeElement).getPropertyValue('width'), 10);
        }

        if (this.showRowCheckboxes) {
            computedWidth -= this.headerCheckboxContainer ? this.headerCheckboxContainer.nativeElement.offsetWidth : 0;
        }

        const visibleChildColumns = this.visibleColumns.filter(c => !c.columnGroup);


        // Column layouts related
        let visibleCols = [];
        const columnBlocks = this.visibleColumns.filter(c => c.columnGroup);
        const colsPerBlock = columnBlocks.map(block => block.getInitialChildColumnSizes(block.children));
        const combinedBlocksSize = colsPerBlock.reduce((acc, item) => acc + item.length, 0);
        colsPerBlock.forEach(blockCols => visibleCols = visibleCols.concat(blockCols));
        //

        const columnsWithSetWidths = this.hasColumnLayouts ?
            visibleCols.filter(c => c.widthSetByUser) :
            visibleChildColumns.filter(c => c.widthSetByUser);

        const columnsToSize = this.hasColumnLayouts ?
            combinedBlocksSize - columnsWithSetWidths.length :
            visibleChildColumns.length - columnsWithSetWidths.length;

        const sumExistingWidths = columnsWithSetWidths
            .reduce((prev, curr) => {
                const colWidth = curr.width;
                const widthValue = parseInt(colWidth, 10);
                const currWidth = colWidth && typeof colWidth === 'string' && colWidth.indexOf('%') !== -1 ?
                    widthValue / 100 * computedWidth :
                    widthValue;
                return prev + currWidth;
            }, 0);

        const columnWidth = Math.floor(!Number.isFinite(sumExistingWidths) ?
            Math.max(computedWidth / columnsToSize, MINIMUM_COLUMN_WIDTH) :
            Math.max((computedWidth - sumExistingWidths) / columnsToSize, MINIMUM_COLUMN_WIDTH));

        return columnWidth.toString();
    }

    /**
     * @hidden
     * Sets grid width i.e. this.calcWidth
     */
    protected calculateGridWidth() {
        let width;
        const computed = this.document.defaultView.getComputedStyle(this.nativeElement);
        const el = this.document.getElementById(this.nativeElement.id);

        if (this.isPercentWidth) {
            /* width in %*/
            width = computed.getPropertyValue('width').indexOf('%') === -1 ?
                parseInt(computed.getPropertyValue('width'), 10) : null;
        } else {
            width = parseInt(this._width, 10);
        }

        if (!width && el) {
            width = el.offsetWidth;
        }


        if (!width) {
            width = this.columnList.reduce((sum, item) =>  sum + parseInt((item.width || item.defaultWidth), 10), 0);
        }

        if (this.hasVerticalSroll()) {
            width -= this.scrollWidth;
        }
        if (Number.isFinite(width) && width !== this.calcWidth) {
            this.calcWidth = width;
            this.cdr.detectChanges();
        }
        this._derivePossibleWidth();
    }

    public hasVerticalSroll() {
        if (!this._ngAfterViewInitPassed) { return false; }
        const isScrollable = this.verticalScrollContainer.isScrollable();
        return !!(this.calcWidth && this.verticalScrollContainer.igxForOf &&
        this.verticalScrollContainer.igxForOf.length > 0 &&
        isScrollable);
    }

    /**
     * @hidden
     */
    protected onColumnsChanged(change: QueryList<IgxColumnComponent>) {
        const diff = this.columnListDiffer.diff(change);
        if (diff) {
            let added = false;
            let removed = false;

            this.initColumns(this.columnList);


            diff.forEachAddedItem((record: IterableChangeRecord<IgxColumnComponent>) => {
                this.onColumnInit.emit(record.item);
                added = true;
            });

            diff.forEachRemovedItem((record: IterableChangeRecord<IgxColumnComponent>) => {
                // Clear Filtering
                this.gridAPI.clear_filter(record.item.field);

                // Clear Sorting
                this.gridAPI.clear_sort(record.item.field);
                removed = true;
            });

            this.resetCaches();

            if (added || removed) {
                this.summaryService.clearSummaryCache();
                this.calculateGridSizes();
            }
        }
        this.markForCheck();
    }

    /**
     * @hidden
     */
    protected calculateGridSizes() {
        /*
            TODO: (R.K.) This layered lasagne should be refactored
            ASAP. The reason I have to reset the caches so many times is because
            after teach `detectChanges` call they are filled with invalid
            state. Of course all of this happens midway through the grid
            sizing process which of course, uses values from the caches, thus resulting
            in a broken layout.
        */
        this.resetCaches();
        const hasScroll = this.hasVerticalSroll();
        this.calculateGridWidth();
        this.cdr.detectChanges();
        this.resetCaches();
        this.calculateGridHeight();

        if (this.rowEditable) {
            this.repositionRowEditingOverlay(this.rowInEditMode);
        }

        this.cdr.detectChanges();
        this.resetCaches();
        // in case scrollbar has appeared recalc to size correctly.
        if (hasScroll !== this.hasVerticalSroll()) {
            this.calculateGridWidth();
            this.cdr.detectChanges();
            this.resetCaches();
        }
    }

    /**
     * @hidden
     * Gets the combined width of the columns that are specific to the enabled grid features. They are fixed.
     * Method used to override the calculations.
     * TODO: Remove for Angular 8. Calling parent class getter using super is not supported for now.
     */
    public getFeatureColumnsWidth() {
        let width = 0;

        if (this.headerCheckboxContainer) {
            width += this.headerCheckboxContainer.nativeElement.getBoundingClientRect().width;
        }
        if (this.headerDragContainer) {
            width += this.headerDragContainer.nativeElement.getBoundingClientRect().width;
        }
        return width;
    }

    /**
     * Gets calculated width of the pinned area.
     * ```typescript
     * const pinnedWidth = this.grid.getPinnedWidth();
     * ```
     * @param takeHidden If we should take into account the hidden columns in the pinned area.
     * @memberof IgxGridBaseComponent
     */
    public getPinnedWidth(takeHidden = false) {
        const fc = takeHidden ? this._pinnedColumns : this.pinnedColumns;
        let sum = 0;
        for (const col of fc) {
            if (col.level === 0) {
                sum += parseInt(col.calcWidth, 10);
            }
        }
        sum += this.featureColumnsWidth;

        return sum;
    }

    /**
     * @hidden
     * Gets calculated width of the unpinned area
     * @param takeHidden If we should take into account the hidden columns in the pinned area.
     * @memberof IgxGridBaseComponent
     */
    protected getUnpinnedWidth(takeHidden = false) {
        let width = this.isPercentWidth ?
            this.calcWidth :
            parseInt(this._width, 10);
        if (this.hasVerticalSroll() && !this.isPercentWidth) {
            width -= this.scrollWidth;
        }
        return width - this.getPinnedWidth(takeHidden);
    }

    /**
     * @hidden
     */
    protected _summaries(fieldName: string, hasSummary: boolean, summaryOperand?: any) {
        const column = this.gridAPI.get_column_by_name(fieldName);
        if (column) {
            column.hasSummary = hasSummary;
            if (summaryOperand) {
                if (this.rootSummariesEnabled) { this.summaryService.retriggerRootPipe++; }
                column.summaries = summaryOperand;
            }
        }
    }

    /**
     * @hidden
     */
    protected _multipleSummaries(expressions: ISummaryExpression[], hasSummary: boolean) {
        expressions.forEach((element) => {
            this._summaries(element.fieldName, hasSummary, element.customSummary);
        });
    }
    /**
     * @hidden
     */
    protected _disableMultipleSummaries(expressions) {
        expressions.forEach((column) => {
            const columnName = column && column.fieldName ? column.fieldName : column;
            this._summaries(columnName, false);
        });
    }

    /**
     * @hidden
     */
    protected resolveDataTypes(rec) {
        if (typeof rec === 'number') {
            return DataType.Number;
        } else if (typeof rec === 'boolean') {
            return DataType.Boolean;
        } else if (typeof rec === 'object' && rec instanceof Date) {
            return DataType.Date;
        }
        return DataType.String;
    }

    private getScrollWidth() {
        const div = document.createElement('div');
        const style = div.style;
        style.width = '100px';
        style.height = '100px';
        style.position = 'absolute';
        style.top = '-10000px';
        style.top = '-10000px';
        style.overflow = 'scroll';
        document.body.appendChild(div);
        const scrollWidth = div.offsetWidth - div.clientWidth;
        document.body.removeChild(div);
        return scrollWidth;
    }

    /**
     * @hidden
     */
    protected autogenerateColumns() {
        const data = this.gridAPI.get_data();
        const factory = this.resolver.resolveComponentFactory(IgxColumnComponent);
        const fields = this.generateDataFields(data);
        const columns = [];

        fields.forEach((field) => {
            const ref = this.viewRef.createComponent(factory, null, this.viewRef.injector);
            ref.instance.field = field;
            ref.instance.dataType = this.resolveDataTypes(data[0][field]);
            ref.changeDetectorRef.detectChanges();
            columns.push(ref.instance);
        });

        this.columnList.reset(columns);
        if (data && data.length > 0) {
            this.shouldGenerate = false;
        }
    }

    protected generateDataFields(data: any[]): string[] {
        return Object.keys(data && data.length !== 0 ? data[0] : []);
    }

    /**
     * @hidden
     */
    onlyTopLevel(arr) {
        return arr.filter(c => c.level === 0);
    }

    /**
     * @hidden
     */
    protected initColumns(collection: QueryList<IgxColumnComponent>, cb: Function = null) {
        // XXX: Deprecate index
        this._columnGroups = this.columnList.some(col => col.columnGroup);
        if (this.hasColumnLayouts) {
            // Set overall row layout size
            this.columnList.forEach((col) => {
                if (col.columnLayout) {
                    const layoutSize = col.children ?
                     col.children.reduce((acc, val) => Math.max(val.rowStart + val.gridRowSpan - 1, acc), 1) :
                     1;
                     this._multiRowLayoutRowSize = Math.max(layoutSize, this._multiRowLayoutRowSize);
                }
            });
        }
        if (this.hasColumnLayouts && this.hasColumnGroups) {
            // invalid configuration - multi-row and column groups
            // remove column groups
            const columnLayoutColumns = this.columnList.filter((col) => col.columnLayout || col.columnLayoutChild);
            this.columnList.reset(columnLayoutColumns);
        }
        this._columns = this.columnList.toArray();
        collection.forEach((column: IgxColumnComponent) => {
            column.grid = this;
            column.defaultWidth = this.columnWidth;
            this.setColumnEditState(column);

            if (cb) {
                cb(column);
            }
        });

        this.reinitPinStates();

        if (this.hasColumnLayouts) {
            collection.forEach((column: IgxColumnComponent) => {
                column.populateVisibleIndexes();
            });
        }
    }

    private setColumnEditState(column: IgxColumnComponent) {
        // When rowEditable is true, then all columns, with defined field, excluding priamaryKey, are set to editable by default.
        if (this.rowEditable && column.editable === null &&
            column.field && column.field !== this.primaryKey) {
            column.editable = this.rowEditable;
        }
    }

    /**
     * @hidden
     */
    protected reinitPinStates() {
        if (this.hasColumnGroups) {
            this._pinnedColumns = this.columnList.filter((c) => c.pinned);
        }
        this._unpinnedColumns = this.columnList.filter((c) => !c.pinned);
    }

    /**
     * @hidden
     */
    public isColumnGrouped(fieldName: string): boolean {
        return false;
    }

    /**
     * @hidden
     */
    public onHeaderCheckboxClick(event, filteredData) {
        this.allRowsSelected = event.checked;
        const newSelection =
            event.checked ?
                filteredData ?
                    this.selection.add_items(this.id, this.selection.get_all_ids(filteredData, this.primaryKey)) :
                    this.selection.get_all_ids(this.gridAPI.get_all_data(true), this.primaryKey) :
                filteredData ?
                    this.selection.delete_items(this.id, this.selection.get_all_ids(filteredData, this.primaryKey)) :
                    this.selection.get_empty();
        this.triggerRowSelectionChange(newSelection, null, event, event.checked);
        this.checkHeaderCheckboxStatus(event.checked);
    }

    /**
     * @hidden
     */
    get headerCheckboxAriaLabel() {
        return this._filteringExpressionsTree.filteringOperands.length > 0 ?
            this.headerCheckbox && this.headerCheckbox.checked ? 'Deselect all filtered' : 'Select all filtered' :
            this.headerCheckbox && this.headerCheckbox.checked ? 'Deselect all' : 'Select all';
    }

    /**
     * @hidden
     */
    public checkHeaderCheckboxStatus(headerStatus?: boolean) {
        if (headerStatus === undefined) {
            const filteredData = this.filteringService.filteredData;
            const dataLength = filteredData ? filteredData.length : this.dataLength;
            this.allRowsSelected = this.selection.are_all_selected(this.id, dataLength);
            if (this.headerCheckbox) {
                this.headerCheckbox.indeterminate = !this.allRowsSelected && !this.selection.are_none_selected(this.id);
                if (!this.headerCheckbox.indeterminate) {
                    this.headerCheckbox.checked =
                        this.allRowsSelected;
                }
            }
            this.cdr.markForCheck();
        } else if (this.headerCheckbox) {
            this.headerCheckbox.checked = headerStatus !== undefined ? headerStatus : false;
        }
    }

    /**
     * @hidden
     */
    public filteredItemsStatus(componentID: string, filteredData: any[], primaryKey?) {
        const currSelection = this.selection.get(componentID);
        let atLeastOneSelected = false;
        let notAllSelected = false;
        if (currSelection) {
            for (const key of Object.keys(filteredData)) {
                const dataItem = primaryKey ? filteredData[key][primaryKey] : filteredData[key];
                if (currSelection.has(dataItem)) {
                    atLeastOneSelected = true;
                    if (notAllSelected) {
                        return 'indeterminate';
                    }
                } else {
                    notAllSelected = true;
                    if (atLeastOneSelected) {
                        return 'indeterminate';
                    }
                }
            }
        }
        return atLeastOneSelected ? 'allSelected' : 'noneSelected';
    }

    /**
     * @hidden
     */
    public updateHeaderCheckboxStatusOnFilter(data) {
        if (!data) {
            this.checkHeaderCheckboxStatus();
            return;
        }
        switch (this.filteredItemsStatus(this.id, data, this.primaryKey)) {
            case 'allSelected': {
                if (!this.allRowsSelected) {
                    this.allRowsSelected = true;
                }
                if (this.headerCheckbox.indeterminate) {
                    this.headerCheckbox.indeterminate = false;
                }
                break;
            }
            case 'noneSelected': {
                if (this.allRowsSelected) {
                    this.allRowsSelected = false;
                }
                if (this.headerCheckbox.indeterminate) {
                    this.headerCheckbox.indeterminate = false;
                }
                break;
            }
            default: {
                if (!this.headerCheckbox.indeterminate) {
                    this.headerCheckbox.indeterminate = true;
                }
                if (this.allRowsSelected) {
                    this.allRowsSelected = false;
                }
                break;
            }
        }
    }

    /**
     * Get current selection state.
     * Returns an array with selected rows' IDs (primaryKey or rowData)
     * ```typescript
     * const selectedRows = this.grid.selectedRows();
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public selectedRows(): any[] {
        let selection: Set<any>;
        selection = this.selection.get(this.id);
        return selection ? Array.from(selection) : [];
    }

    /**
     * Select specified rows by ID.
     * ```typescript
     * this.grid.selectRows([1,2,5], true);
     * ```
     * @param rowIDs
     * @param clearCurrentSelection if true clears the current selection
     * @memberof IgxGridBaseComponent
     */
    public selectRows(rowIDs: any[], clearCurrentSelection?: boolean) {
        let newSelection: Set<any>;
        let selectableRows = [];
        if (this.transactions.enabled) {
            selectableRows = rowIDs.filter(e => !this.gridAPI.row_deleted_transaction(e));
        } else {
            selectableRows = rowIDs;
        }
        newSelection = this.selection.add_items(this.id, selectableRows, clearCurrentSelection);
        this.triggerRowSelectionChange(newSelection);
    }

    /**
     * Deselect specified rows by ID.
     * ```typescript
     * this.grid.deselectRows([1,2,5]);
     * ```
     * @param rowIDs
     * @memberof IgxGridBaseComponent
     */
    public deselectRows(rowIDs: any[]) {
        let newSelection: Set<any>;
        newSelection = this.selection.delete_items(this.id, rowIDs);
        this.triggerRowSelectionChange(newSelection);
    }

    /**
     * Selects all rows
     * Note: If filtering is in place, selectAllRows() and deselectAllRows() select/deselect all filtered rows.
     * ```typescript
     * this.grid.selectAllRows();
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public selectAllRows() {
        this.triggerRowSelectionChange(this.selection.get_all_ids(this.gridAPI.get_all_data(true), this.primaryKey));
    }

    /**
     * Deselects all rows
     * ```typescript
     * this.grid.deselectAllRows();
     * ```
     * Note: If filtering is in place, selectAllRows() and deselectAllRows() select/deselect all filtered rows.
     */
    public deselectAllRows() {
        this.triggerRowSelectionChange(this.selection.get_empty());
    }

    clearCellSelection(): void {
        this.selectionService.clear();
        this.selectionService.activeElement = null;
        this.cdr.markForCheck();
    }

    dragScroll(dir: DragScrollDirection): void {
        const scrollDelta = 48;
        const horizontal = this.parentVirtDir.getHorizontalScroll();
        const vertical = this.verticalScrollContainer.getVerticalScroll();
        switch (dir) {
            case DragScrollDirection.LEFT:
                horizontal.scrollLeft -= scrollDelta;
                break;
            case DragScrollDirection.RIGHT:
                horizontal.scrollLeft += scrollDelta;
                break;
            case DragScrollDirection.TOP:
                vertical.scrollTop -= scrollDelta;
                break;
            case DragScrollDirection.BOTTOM:
                vertical.scrollTop += scrollDelta;
                break;
            case DragScrollDirection.BOTTOMLEFT:
                horizontal.scrollLeft -= scrollDelta;
                vertical.scrollTop += scrollDelta;
                break;
            case DragScrollDirection.BOTTOMRIGHT:
                horizontal.scrollLeft += scrollDelta;
                vertical.scrollTop += scrollDelta;
                break;
            case DragScrollDirection.TOPLEFT:
                horizontal.scrollLeft -= scrollDelta;
                vertical.scrollTop -= scrollDelta;
                break;
            case DragScrollDirection.TOPRIGHT:
                horizontal.scrollLeft += scrollDelta;
                vertical.scrollTop -= scrollDelta;
                break;
            default:
                return;
        }
        this.wheelHandler();
    }

    isDefined(arg: any): boolean {
        return arg !== undefined && arg !== null;
    }

    selectRange(arg: GridSelectionRange | GridSelectionRange[] | null | undefined): void {
        if (!this.isDefined(arg)) {
            this.clearCellSelection();
            return;
        }
        if (arg instanceof Array) {
            arg.forEach(range => this.setSelection(range));
        } else {
            this.setSelection(arg);
        }
        this.cdr.markForCheck();
    }

    columnToVisibleIndex(field: string | number): number {
        const visibleColumns = this.visibleColumns;
        if (typeof field === 'number') {
            return field;
        }
        return visibleColumns.find(column => column.field === field).visibleIndex;
    }


    setSelection(range: GridSelectionRange): void {
        const startNode =  { row: range.rowStart, column: this.columnToVisibleIndex(range.columnStart) };
        const endNode =  { row: range.rowEnd, column: this.columnToVisibleIndex(range.columnEnd) };

        this.selectionService.pointerState.node = startNode;
        this.selectionService.selectRange(endNode, this.selectionService.pointerState);
        this.selectionService.addRangeMeta(endNode, this.selectionService.pointerState);
        this.selectionService.initPointerState();
    }

    getSelectedRanges(): GridSelectionRange[] {
        return this.selectionService.ranges;
    }

    extractDataFromSelection(source: any[]): any[] {
        let column: IgxColumnComponent;
        let record = {};
        const selectedData = [];

        const selectionMap = Array.from(this.selectionService.selection)
            .filter((tuple) => tuple[0] < source.length);

        const visibleColumns = this.visibleColumns
            .filter(col => !col.columnGroup)
            .sort((a, b) => a.visibleIndex - b.visibleIndex);


        for (const [row, set] of selectionMap) {
            if (!source[row]) {
                continue;
            }
            const temp = Array.from(set);
            for (const each of temp) {
                column = visibleColumns[each];
                if (column) {
                    record[column.field] = source[row][column.field];
                }
            }
            if (Object.keys(record).length) {
                selectedData.push(record);
            }
            record = {};
        }
        return selectedData;
    }

    getSelectedData() {
        const source = this.verticalScrollContainer.igxForOf;

        return this.extractDataFromSelection(source);
    }

    /**
     * @hidden
     */
    public triggerRowSelectionChange(newSelectionAsSet: Set<any>, row?: IgxRowComponent<IgxGridBaseComponent & IGridDataBindable>,
        event?: Event, headerStatus?: boolean) {
        const oldSelectionAsSet = this.selection.get(this.id);
        const oldSelection = oldSelectionAsSet ? Array.from(oldSelectionAsSet) : [];
        const newSelection = newSelectionAsSet ? Array.from(newSelectionAsSet) : [];
        const args: IRowSelectionEventArgs = { oldSelection, newSelection, row, event };
        this.onRowSelectionChange.emit(args);
        newSelectionAsSet = this.selection.get_empty();
        for (let i = 0; i < args.newSelection.length; i++) {
            newSelectionAsSet.add(args.newSelection[i]);
        }
        this.selection.set(this.id, newSelectionAsSet);
        this.checkHeaderCheckboxStatus(headerStatus);
    }

    /**
     * @hidden
     */
    // @HostListener('scroll', ['$event'])
    public scrollHandler(event) {
        this.parentVirtDir.getHorizontalScroll().scrollLeft += event.target.scrollLeft;
        this.verticalScrollContainer.getVerticalScroll().scrollTop += event.target.scrollTop;
        event.target.scrollLeft = 0;
        event.target.scrollTop = 0;
    }

    /**
     * This method allows you to navigate to a position
     * in the grid based on provided `rowindex` and `visibleColumnIndex`,
     * also to execute a custom logic over the target element,
     * through a callback function that accepts { targetType: GridKeydownTargetType, target: Object }
     * ```typescript
     *  this.grid.navigateTo(10, 3, (args) => { args.target.nativeElement.focus(); });
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public navigateTo(rowIndex: number, visibleColIndex = -1, cb: Function = null) {
        if (rowIndex < 0 || rowIndex > this.verticalScrollContainer.igxForOf.length - 1
            ||  (visibleColIndex !== -1 && this.columnList.map(col => col.visibleIndex).indexOf(visibleColIndex) === -1)) {
            return;
        }
        this.wheelHandler();
        if (this.verticalScrollContainer.igxForOf.slice(rowIndex, rowIndex + 1).find(rec => rec.expression || rec.childGridsData)) {
            visibleColIndex = -1;
        }
        if (visibleColIndex === -1 || (this.navigation.isColumnFullyVisible(visibleColIndex)
            && this.navigation.isColumnLeftFullyVisible(visibleColIndex))) {
            if (this.navigation.shouldPerformVerticalScroll(rowIndex, visibleColIndex)) {
                this.navigation.performVerticalScrollToCell(rowIndex, visibleColIndex,
                     () => { this.executeCallback(rowIndex, visibleColIndex, cb); } );
            } else {
                this.executeCallback(rowIndex, visibleColIndex, cb);
            }
        } else {
            this.navigation.performHorizontalScrollToCell(rowIndex, visibleColIndex, false,
                 () => { this.executeCallback(rowIndex, visibleColIndex, cb); });
        }
    }

     /**
     * Returns `ICellPosition` which defines the next cell,
     * according to the current position, that match specific criteria.
     * You can pass callback function as a third parameter of `getPreviousCell` method.
     * The callback function accepts IgxColumnComponent as a param
     * ```typescript
     *  const nextEditableCellPosition = this.grid.getNextCell(0, 3, (column) => column.editable);
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public getNextCell(currRowIndex: number, curVisibleColIndex: number,
            callback: (IgxColumnComponent) => boolean = null): ICellPosition {
        const columns = this.columnList.filter(col => !col.columnGroup && col.visibleIndex >= 0);

        if (!this.isValidPosition(currRowIndex, curVisibleColIndex)) {
            return {rowIndex: currRowIndex, visibleColumnIndex: curVisibleColIndex};
        }
        const colIndexes = callback ? columns.filter((col) => callback(col)).map(editCol => editCol.visibleIndex).sort((a, b) => a - b) :
                                columns.map(editCol => editCol.visibleIndex).sort((a, b) => a - b);
        const nextCellIndex = colIndexes.find(index => index > curVisibleColIndex);
        if (this.verticalScrollContainer.igxForOf.slice(currRowIndex, currRowIndex + 1)
                .find(rec => !rec.expression && !rec.summaries && !rec.childGridsData) && nextCellIndex !== undefined) {
            return {rowIndex: currRowIndex, visibleColumnIndex: nextCellIndex};
        } else {
            if (colIndexes.length === 0 || this.getNextDataRowIndex(currRowIndex) === currRowIndex) {
                return {rowIndex: currRowIndex, visibleColumnIndex: curVisibleColIndex};
            } else {
                return {rowIndex: this.getNextDataRowIndex(currRowIndex), visibleColumnIndex: colIndexes[0]};
            }
        }
    }

     /**
     * Returns `ICellPosition` which defines the previous cell,
     * according to the current position, that match specific criteria.
     * You can pass callback function as a third parameter of `getPreviousCell` method.
     * The callback function accepts IgxColumnComponent as a param
     * ```typescript
     *  const previousEditableCellPosition = this.grid.getPreviousCell(0, 3, (column) => column.editable);
     * ```
	 * @memberof IgxGridBaseComponent
     */
    public getPreviousCell(currRowIndex: number, curVisibleColIndex: number,
            callback: (IgxColumnComponent) => boolean = null): ICellPosition {
        const columns =  this.columnList.filter(col => !col.columnGroup && col.visibleIndex >= 0);

        if (!this.isValidPosition(currRowIndex, curVisibleColIndex)) {
            return {rowIndex: currRowIndex, visibleColumnIndex: curVisibleColIndex};
        }
        const colIndexes = callback ? columns.filter((col) => callback(col)).map(editCol => editCol.visibleIndex).sort((a, b) => b - a) :
                                columns.map(editCol => editCol.visibleIndex).sort((a, b) => b - a);
        const prevCellIndex = colIndexes.find(index => index < curVisibleColIndex);
        if (this.verticalScrollContainer.igxForOf.slice(currRowIndex, currRowIndex + 1)
                .find(rec => !rec.expression && !rec.summaries && !rec.childGridsData) && prevCellIndex !== undefined) {
            return {rowIndex: currRowIndex, visibleColumnIndex: prevCellIndex};
        } else {
            if (colIndexes.length === 0 || this.getPrevDataRowIndex(currRowIndex) === currRowIndex) {
                return {rowIndex: currRowIndex, visibleColumnIndex: curVisibleColIndex};
            } else {
                return {rowIndex: this.getPrevDataRowIndex(currRowIndex), visibleColumnIndex: colIndexes[0]};
            }
        }
    }

    private executeCallback(rowIndex, visibleColIndex = -1, cb: Function = null) {
        if (!cb) { return; }
        let targetType, target;
        const row =  this.summariesRowList.filter(s => s.index !== 0).concat(this.rowList.toArray()).find(r => r.index === rowIndex);
        if (!row) { return; }
        switch (row.nativeElement.tagName.toLowerCase()) {
            case 'igx-grid-groupby-row':
                targetType = GridKeydownTargetType.groupRow;
                target = row;
                break;
            case 'igx-grid-summary-row':
                targetType = GridKeydownTargetType.summaryCell;
                target = visibleColIndex !== -1 ?
                    row.summaryCells.find(c => c.visibleColumnIndex === visibleColIndex) : row.summaryCells.first;
                break;
            case 'igx-child-grid-row':
                targetType = GridKeydownTargetType.hierarchicalRow;
                target = row;
                break;
            default:
                targetType = GridKeydownTargetType.dataCell;
                target = visibleColIndex !== -1 ? row.cells.find(c => c.visibleColumnIndex === visibleColIndex) : row.cells.first;
                break;
        }
        const args = { targetType: targetType, target: target };
        cb(args);
    }

    private getPrevDataRowIndex(currentRowIndex): number {
        if (currentRowIndex <= 0) { return currentRowIndex; }

        const prevRow = this.verticalScrollContainer.igxForOf.slice(0, currentRowIndex).reverse()
            .find(rec => !rec.expression && !rec.summaries && !rec.childGridsData);
        return prevRow ? this.verticalScrollContainer.igxForOf.indexOf(prevRow) : currentRowIndex;
    }

    private getNextDataRowIndex(currentRowIndex): number {
        if (currentRowIndex === this.verticalScrollContainer.igxForOf.length) {return currentRowIndex; }

        const nextRow = this.verticalScrollContainer.igxForOf.slice(currentRowIndex + 1, this.verticalScrollContainer.igxForOf.length)
            .find(rec => !rec.expression && !rec.summaries && !rec.childGridsData);
        return nextRow ? this.verticalScrollContainer.igxForOf.indexOf(nextRow) : currentRowIndex;
    }

    private isValidPosition(rowIndex, colIndex): boolean {
        const rows = this.summariesRowList.filter(s => s.index !== 0).concat(this.rowList.toArray()).length;
        const cols = this.columnList.filter(col => !col.columnGroup && col.visibleIndex >= 0).length;
        if (rows < 1 || cols < 1) { return false; }
        if (rowIndex > -1 && rowIndex < this.verticalScrollContainer.igxForOf.length &&
            colIndex > - 1 && colIndex <= this.unpinnedColumns[this.unpinnedColumns.length - 1].visibleIndex) {
                return true;
        }
        return false;
    }

    /**
     * @hidden
     */
    public wheelHandler(isScroll = false) {
        if (document.activeElement &&
        // tslint:disable-next-line:no-bitwise
            (document.activeElement.compareDocumentPosition(this.tbody.nativeElement) & Node.DOCUMENT_POSITION_CONTAINS ||
        // tslint:disable-next-line:no-bitwise
            (document.activeElement.compareDocumentPosition(this.tfoot.nativeElement) & Node.DOCUMENT_POSITION_CONTAINS && isScroll))) {
            (document.activeElement as HTMLElement).blur();
        }
    }

    /**
     * @hidden
     */
    public trackColumnChanges(index, col) {
        return col.field + col.calcWidth;
    }

    private find(text: string, increment: number, caseSensitive?: boolean, exactMatch?: boolean, scroll?: boolean) {
        if (!this.rowList) {
            return 0;
        }

        this.endEdit(false);

        if (!text) {
            this.clearSearch();
            return 0;
        }

        const caseSensitiveResolved = caseSensitive ? true : false;
        const exactMatchResolved = exactMatch ? true : false;
        let rebuildCache = false;

        if (this.lastSearchInfo.searchText !== text ||
            this.lastSearchInfo.caseSensitive !== caseSensitiveResolved ||
            this.lastSearchInfo.exactMatch !== exactMatchResolved) {
            this.lastSearchInfo = {
                searchText: text,
                activeMatchIndex: 0,
                caseSensitive: caseSensitiveResolved,
                exactMatch: exactMatchResolved,
                matchInfoCache: []
            };

            rebuildCache = true;
        } else {
            this.lastSearchInfo.activeMatchIndex += increment;
        }

        if (rebuildCache) {
            this.rowList.forEach((row) => {
                if (row.cells) {
                    row.cells.forEach((c) => {
                        c.highlightText(text, caseSensitiveResolved, exactMatchResolved);
                    });
                }
            });

            this.rebuildMatchCache();
        }

        if (this.lastSearchInfo.activeMatchIndex >= this.lastSearchInfo.matchInfoCache.length) {
            this.lastSearchInfo.activeMatchIndex = 0;
        } else if (this.lastSearchInfo.activeMatchIndex < 0) {
            this.lastSearchInfo.activeMatchIndex = this.lastSearchInfo.matchInfoCache.length - 1;
        }

        if (this.lastSearchInfo.matchInfoCache.length) {
            const matchInfo = this.lastSearchInfo.matchInfoCache[this.lastSearchInfo.activeMatchIndex];
            this.lastSearchInfo = {...this.lastSearchInfo};

            if (scroll !== false) {
                this.scrollTo(matchInfo.row, matchInfo.column);
            }

            IgxTextHighlightDirective.setActiveHighlight(this.id, {
                column: matchInfo.column,
                row: matchInfo.row,
                index: matchInfo.index,
            });

        } else {
            IgxTextHighlightDirective.clearActiveHighlight(this.id);
        }

        return this.lastSearchInfo.matchInfoCache.length;
    }

    /**
     * Returns an array containing the filtered sorted data.
     * ```typescript
     * const filteredSortedData = this.grid1.filteredSortedData;
     * ```
	 * @memberof IgxGridBaseComponent
     */
    get filteredSortedData(): any[] {
        return this._filteredSortedData;
    }
    set filteredSortedData(value: any[]) {
        this._filteredSortedData = value;
        this.refreshSearch(true);
    }

    /**
     * @hidden
     */
    protected initPinning() {
        let currentPinnedWidth = 0;
        const pinnedColumns = [];
        const unpinnedColumns = [];
        const newUnpinnedCols = [];

        this.calculateGridWidth();
        this.resetCaches();
        // When a column is a group or is inside a group, pin all related.
        this._pinnedColumns.forEach(col => {
            if (col.parent) {
                col.parent.pinned = true;
            }
            if (col.columnGroup) {
                col.children.forEach(child => child.pinned = true);
            }
        });

        // Make sure we don't exceed unpinned area min width and get pinned and unpinned col collections.
        // We take into account top level columns (top level groups and non groups).
        // If top level is unpinned the pinning handles all children to be unpinned as well.
        for (let i = 0; i < this._columns.length; i++) {
            if (this._columns[i].pinned && !this._columns[i].parent) {
                // Pinned column. Check if with it the unpinned min width is exceeded.
                const colWidth = parseInt(this._columns[i].width, 10);
                if (currentPinnedWidth + colWidth > this.calcWidth - this.unpinnedAreaMinWidth) {
                    // unpinned min width is exceeded. Unpin the columns and add it to the unpinned collection.
                    this._columns[i].pinned = false;
                    unpinnedColumns.push(this._columns[i]);
                    newUnpinnedCols.push(this._columns[i]);
                } else {
                    // unpinned min width is not exceeded. Keep it pinned and add it to the pinned collection.
                    currentPinnedWidth += colWidth;
                    pinnedColumns.push(this._columns[i]);
                }
            } else if (this._columns[i].pinned && this._columns[i].parent) {
                if (this._columns[i].topLevelParent.pinned) {
                    pinnedColumns.push(this._columns[i]);
                } else {
                    this._columns[i].pinned = false;
                    unpinnedColumns.push(this._columns[i]);
                }
            } else {
                unpinnedColumns.push(this._columns[i]);
            }
        }

        if (newUnpinnedCols.length) {
            console.warn(
                'igxGrid - The pinned area exceeds maximum pinned width. ' +
                'The following columns were unpinned to prevent further issues:' +
                newUnpinnedCols.map(col => '"' + col.header + '"').toString() + '. For more info see our documentation.'
            );
        }

        // Assign the applicaple collections.
        this._pinnedColumns = pinnedColumns;
        this._unpinnedColumns = unpinnedColumns;
        this.cdr.markForCheck();
    }

    /**
     * @hidden
     */
    protected scrollTo(row: any | number, column: any | number): void {
        let delayScrolling = false;

        if (this.paging && typeof(row) !== 'number') {
            const rowIndex = this.filteredSortedData.indexOf(row);
            const page = Math.floor(rowIndex / this.perPage);

            if (this.page !== page) {
                delayScrolling = true;
                this.page = page;
            }
        }

        if (delayScrolling) {
            this.verticalScrollContainer.onDataChanged.pipe(first()).subscribe(() => {
                this.scrollDirective(this.verticalScrollContainer,
                    typeof(row) === 'number' ? row : this.verticalScrollContainer.igxForOf.indexOf(row));
            });
        } else {
            this.scrollDirective(this.verticalScrollContainer,
                typeof(row) === 'number' ? row : this.verticalScrollContainer.igxForOf.indexOf(row));
        }

        this.scrollToHorizontally(column);
    }

    /**
     * @hidden
     */
    protected scrollToHorizontally(column: any | number) {
        let columnIndex = typeof column === 'number' ? column : this.getColumnByName(column).visibleIndex;
        const scrollRow = this.rowList.find(r => r.virtDirRow);
        const virtDir = scrollRow ? scrollRow.virtDirRow : null;
        if (this.pinnedColumns.length) {
            if (columnIndex >= this.pinnedColumns.length) {
                columnIndex -= this.pinnedColumns.length;
                this.scrollDirective(virtDir, columnIndex);
            }
        } else {
            this.scrollDirective(virtDir, columnIndex);
        }
    }

    /**
     * @hidden
     */
    protected scrollDirective(directive: IgxGridForOfDirective<any>, goal: number): void {
        if (!directive) {
            return;
        }
        // directive.onChunkLoad.pipe(first())
        //     .subscribe(() => requestAnimationFrame(() => this.cdr.detectChanges()));
        directive.scrollTo(goal);
    }

    private rebuildMatchCache() {
        this.lastSearchInfo.matchInfoCache = [];

        const caseSensitive = this.lastSearchInfo.caseSensitive;
        const exactMatch = this.lastSearchInfo.exactMatch;
        const searchText = caseSensitive ? this.lastSearchInfo.searchText : this.lastSearchInfo.searchText.toLowerCase();
        const data = this.filteredSortedData;
        const columnItems = this.visibleColumns.filter((c) => !c.columnGroup).sort((c1, c2) => c1.visibleIndex - c2.visibleIndex);

        const numberPipe = new IgxDecimalPipeComponent(this.locale);
        const datePipe = new IgxDatePipeComponent(this.locale);
        data.forEach((dataRow) => {
            columnItems.forEach((c) => {
                const value = c.formatter ? c.formatter(dataRow[c.field]) :
                    c.dataType === 'number' ? numberPipe.transform(dataRow[c.field], this.locale) :
                        c.dataType === 'date' ? datePipe.transform(dataRow[c.field], this.locale)
                            : dataRow[c.field];
                if (value !== undefined && value !== null && c.searchable) {
                    let searchValue = caseSensitive ? String(value) : String(value).toLowerCase();

                    if (exactMatch) {
                        if (searchValue === searchText) {
                            this.lastSearchInfo.matchInfoCache.push({
                                row: dataRow,
                                column: c.field,
                                index: 0,
                            });
                        }
                    } else {
                        let occurenceIndex = 0;
                        let searchIndex = searchValue.indexOf(searchText);

                        while (searchIndex !== -1) {
                            this.lastSearchInfo.matchInfoCache.push({
                                row: dataRow,
                                column: c.field,
                                index: occurenceIndex++,
                            });

                            searchValue = searchValue.substring(searchIndex + searchText.length);
                            searchIndex = searchValue.indexOf(searchText);
                        }
                    }
                }
            });
        });
    }

    /**
     * @hidden
     */
    public isExpandedGroup(_group: IGroupByRecord): boolean {
        return undefined;
    }

    /**
    * @hidden
    */
    protected getGroupByRecords(): IGroupByRecord[] {
        return null;
    }

    protected changeRowEditingOverlayStateOnScroll(row: IgxRowComponent<IgxGridBaseComponent & IGridDataBindable>) {
        if (!this.rowEditable || this.rowEditingOverlay.collapsed) {
            return;
        }
        if (!row) {
            this.toggleRowEditingOverlay(false);
        } else {
            this.repositionRowEditingOverlay(row);
        }
    }

    openRowOverlay(id) {
        this.configureRowEditingOverlay(id, this.rowList.length <= MIN_ROW_EDITING_COUNT_THRESHOLD);

        this.rowEditingOverlay.open(this.rowEditSettings);
        this.rowEditPositioningStrategy.isTopInitialPosition = this.rowEditPositioningStrategy.isTop;
        this._wheelListener = this.rowEditingWheelHandler.bind(this);
        this.rowEditingOverlay.element.addEventListener('wheel', this._wheelListener);
    }

    /**
     * @hidden
     */
    public closeRowEditingOverlay() {
        this.rowEditingOverlay.element.removeEventListener('wheel', this._wheelListener);
        this.rowEditPositioningStrategy.isTopInitialPosition = null;
        this.rowEditingOverlay.close();
        this.rowEditingOverlay.element.parentElement.style.display = '';
    }

    /**
     * @hidden
     */
    public toggleRowEditingOverlay(show) {
        const rowStyle = this.rowEditingOverlay.element.style;
        if (show) {
            rowStyle.display = 'block';
        } else {
            rowStyle.display = 'none';
        }
    }

    /**
     * @hidden
     */
    public repositionRowEditingOverlay(row: IgxRowComponent<IgxGridBaseComponent & IGridDataBindable>) {
        if (!this.rowEditingOverlay.collapsed) {
            const rowStyle = this.rowEditingOverlay.element.parentElement.style;
            if (row) {
                rowStyle.display = '';
                this.configureRowEditingOverlay(row.rowID);
                this.rowEditingOverlay.reposition();
            } else {
                rowStyle.display = 'none';
            }
        }
    }

    private configureRowEditingOverlay(rowID: any, useOuter = false) {
        this.rowEditSettings.outlet = useOuter ? this.parentRowOutletDirective : this.rowOutletDirective;
        this.rowEditPositioningStrategy.settings.container = this.tbody.nativeElement;
        const targetRow = this.gridAPI.get_row_by_key(rowID);
        if (!targetRow) {
            return;
        }
        this.rowEditPositioningStrategy.settings.target = targetRow.element.nativeElement;
        this.toggleRowEditingOverlay(true);
    }

    /**
     * @hidden
     */
    public get rowChangesCount() {
        if (!this.crudService.row) {
            return 0;
        }
        const rowChanges = this.transactions.getAggregatedValue(this.crudService.row.id, false);
        return rowChanges ? Object.keys(rowChanges).length : 0;
    }

    protected writeToData(rowIndex: number, value: any) {
        mergeObjects(this.gridAPI.get_all_data()[rowIndex], value);
    }

    endRowTransaction(commit: boolean, row: IgxRow) {
        row.newData = this.transactions.getAggregatedValue(row.id, true);

        let args = row.createEditEventArgs();

        if (!commit) {
            this.onRowEditCancel.emit(args);
            this.transactions.endPending(false);
        } else {
            args = this.gridAPI.update_row(row, row.newData);
        }
        if (args.cancel) {
            this.transactions.startPending();
            return;
        }
        this.crudService.endRowEdit();
        this.closeRowEditingOverlay();
    }

    // TODO: Refactor
    /**
     * Finishes the row transactions on the current row.
     * If `commit === true`, passes them from the pending state to the data (or transaction service)
     *
     * Binding to the event
     * ```html
     * <button igxButton (click)="grid.endEdit(true)">Commit Row</button>
     * ```
     * @param commit
     */
    public endEdit(commit = true, event?: Event) {
        const row = this.crudService.row;
        const cell = this.crudService.cell;
        const columnindex = cell ? cell.column.index : -1;
        const ri = row ? row.index : -1;

        // TODO: Merge the crudService with wht BaseAPI service
        if (!row && !cell) { return; }

        commit ? this.gridAPI.submit_value() : this.gridAPI.escape_editMode();

        if (!this.rowEditable || this.rowEditingOverlay && this.rowEditingOverlay.collapsed || !row) {
            return;
        }

        this.endRowTransaction(commit, row);

        const currentCell = this.gridAPI.get_cell_by_index(ri, columnindex);
        if (currentCell && event) {
            currentCell.nativeElement.focus();
        }
    }
    /**
     * @hidden
     */
    private rowEditingWheelHandler(event: WheelEvent) {
        if (event.deltaY > 0) {
            this.verticalScrollContainer.scrollNext();
        } else {
            this.verticalScrollContainer.scrollPrev();
        }
    }

    /**
     * @hidden
     */
    public get dataWithAddedInTransactionRows() {
        const result = <any>cloneArray(this.gridAPI.get_all_data());
        if (this.transactions.enabled) {
            result.push(...this.transactions.getAggregatedChanges(true)
                .filter(t => t.type === TransactionType.ADD)
                .map(t => t.newValue));
        }

        return result;
    }

    public get dataLength() {
        return this.transactions.enabled ? this.dataWithAddedInTransactionRows.length : this.gridAPI.get_all_data().length;
    }

    public hasHorizontalScroll() {
        return this.totalWidth - this.unpinnedWidth > 0;
    }

    protected _restoreVirtState(row) {
         // check virtualization state of data record added from cache
         // in case state is no longer valid - update it.
         const rowForOf = row.virtDirRow;
         const gridScrLeft = rowForOf.getHorizontalScroll().scrollLeft;
         const left = -parseInt(rowForOf.dc.instance._viewContainer.element.nativeElement.style.left, 10);
         const actualScrollLeft = left + rowForOf.getColumnScrollLeft(rowForOf.state.startIndex);
        if (gridScrLeft !== actualScrollLeft) {
            rowForOf.onHScroll(gridScrLeft);
        }
    }

    /**
     * @hidden
     */
    protected getExportExcel(): boolean {
        return this._exportExcel;
    }

    /**
     * @hidden
     */
    protected getExportCsv(): boolean {
        return this._exportCsv;
    }

    /**
    * @hidden
    */
    public isSummaryRow(rowData): boolean {
        return rowData.summaries && (rowData.summaries instanceof Map);
    }

    /**
     * @hidden
     */
    protected get isAttachedToDom(): boolean {
        return this.document.body.contains(this.nativeElement);
    }



    /**
     * @hidden
     */
    public cachedViewLoaded(args: ICachedViewLoadedEventArgs) {
        if (args.context['templateID'] === 'dataRow' && args.context['$implicit'] === args.oldContext['$implicit']) {
            args.view.detectChanges();
            const row = this.getRowByIndex(args.context.index);
            if (row && row.cells) {
                row.cells.forEach((c) => {
                    c.highlightText(
                        this.lastSearchInfo.searchText,
                        this.lastSearchInfo.caseSensitive,
                        this.lastSearchInfo.exactMatch);
                });
            }
        }
        if (this.hasHorizontalScroll()) {
            const tmplId = args.context.templateID;
            const index = args.context.index;
            args.view.detectChanges();
            const row = tmplId === 'dataRow' ? this.getRowByIndex(index) : null;
            const summaryRow = tmplId === 'summaryRow' ? this.summariesRowList.toArray().find((sr) => sr.dataRowIndex === index) : null;
            if (row && row instanceof IgxRowComponent) {
                this._restoreVirtState(row);
            } else if (summaryRow) {
                this._restoreVirtState(summaryRow);
            }
        }
    }
}


