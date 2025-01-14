import { Directive, ElementRef, forwardRef, HostListener, Inject, QueryList } from '@angular/core';
import { IgxGridBaseComponent } from './grid-base.component';
import { first, tap } from 'rxjs/operators';
import { IgxGridNavigationService } from './grid-navigation.service';

/** @hidden */
@Directive({
    selector: '[igxRowEdit]'
})
export class IgxRowEditTemplateDirective { }

/** @hidden */
@Directive({
    selector: '[igxRowEditText]'
})
export class IgxRowEditTextDirective { }

/** @hidden */
@Directive({
    selector: '[igxRowEditActions]'
})
export class IgxRowEditActionsDirective { }


// TODO: Refactor circular ref, deps and logic
/** @hidden */
@Directive({
    selector: `[igxRowEditTabStop]`
})
export class IgxRowEditTabStopDirective {
    private get allTabs(): QueryList<IgxRowEditTabStopDirective> {
        return this.grid.rowEditTabs;
    }

    private grid: IgxGridBaseComponent;
    private navigationService: IgxGridNavigationService;

    constructor(
        @Inject(forwardRef(() => IgxGridBaseComponent)) grid,
        public element: ElementRef,
        @Inject(forwardRef(() => IgxGridNavigationService)) navigationService) {
            this.grid = grid;
            this.navigationService = navigationService;
            this.navigationService.grid = grid;
        }
    @HostListener('keydown.Tab', [`$event`])
    @HostListener('keydown.Shift.Tab', [`$event`])
    public handleTab(event: KeyboardEvent): void {
        event.stopPropagation();
        if (this.allTabs.length > 1) {
            if ((this.allTabs.last ===  this && !event.shiftKey) ||
                (this.allTabs.first ===  this && event.shiftKey)
            ) {
                this.move(event);
            }
        } else {
            this.move(event);
        }
    }
    private focusNextCell(rowIndex, cellIndex) {
        const grid = this.grid as any;
        grid.parentVirtDir.onChunkLoad.pipe(first(), tap(() => grid.markForCheck())).subscribe(() => {
            grid.rowInEditMode.cells.find(c => c.visibleColumnIndex === cellIndex).element.nativeElement.focus();
        });
    }
    private move(event: KeyboardEvent) {
        event.preventDefault();
        const horizontalScroll = this.grid.parentVirtDir.getHorizontalScroll();
        const targetIndex = event.shiftKey ? this.grid.lastEditableColumnIndex : this.grid.firstEditableColumnIndex;
        const targetCell = this.grid.rowInEditMode.cells.find(e => e.visibleColumnIndex === targetIndex);
        const scrollIndex = this.grid.hasColumnLayouts ? targetCell.column.parent.visibleIndex : targetIndex;
        if (!targetCell ||
            !this.navigationService.isColumnFullyVisible(scrollIndex)
            || !this.navigationService.isColumnLeftFullyVisible(scrollIndex)) {
            this.focusNextCell(this.grid.rowInEditMode.index, targetIndex);
            horizontalScroll.scrollLeft =
            this.grid.rowInEditMode.virtDirRow.getColumnScrollLeft(this.navigationService.getColumnUnpinnedIndex(scrollIndex));
        } else {
            targetCell.nativeElement.focus();
        }
    }
}
