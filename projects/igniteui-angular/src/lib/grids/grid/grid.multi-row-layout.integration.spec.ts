﻿import { configureTestSuite } from '../../test-utils/configure-suite';
import { async, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IgxGridComponent } from './grid.component';
import { IgxGridModule } from './grid.module';
import { SampleTestData } from '../../test-utils/sample-test-data.spec';
import { ViewChild, Component } from '@angular/core';
import { verifyLayoutHeadersAreAligned, verifyDOMMatchesLayoutSettings, HelperUtils } from '../../test-utils/helper-utils.spec';
import { IgxColumnLayoutComponent } from './../column.component';
import { wait, UIInteractions } from '../../test-utils/ui-interactions.spec';
import { SortingDirection } from '../../data-operations/sorting-expression.interface';
import { DefaultSortingStrategy } from '../../data-operations/sorting-strategy';

describe('IgxGrid - multi-row-layout Integration - ', () => {
    configureTestSuite();
    let fixture;
    let grid: IgxGridComponent;
    let colGroups: Array<any>;
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ColumnLayoutPinningTestComponent,
                ColumnLayoutFilteringTestComponent,
                ColumnLayouHidingTestComponent,
                ColumnLayoutGroupingTestComponent,
                ColumnLayoutResizingTestComponent
            ],
            imports: [
                NoopAnimationsModule, IgxGridModule]
        }).compileComponents();
    }));

    describe('Hiding ', () => {
        beforeEach(async(() => {
            fixture = TestBed.createComponent(ColumnLayouHidingTestComponent);
            fixture.detectChanges();
            grid = fixture.componentInstance.grid;
            colGroups = fixture.componentInstance.colGroups;
        }));

        it('should allow setting a whole group as hidden/shown.', () => {

            // group 1 should be hidden - all child columns should be hidden
            expect(grid.getColumnByName('group1').hidden).toBeTruthy();
            expect(grid.getColumnByName('PostalCode').hidden).toBeTruthy();
            expect(grid.getColumnByName('City').hidden).toBeTruthy();
            expect(grid.getColumnByName('Country').hidden).toBeTruthy();
            expect(grid.getColumnByName('Address').hidden).toBeTruthy();

            expect(grid.getColumnByName('group2').hidden).toBeFalsy();
            expect(grid.getColumnByName('ID').hidden).toBeFalsy();
            expect(grid.getColumnByName('CompanyName').hidden).toBeFalsy();
            expect(grid.getColumnByName('ContactName').hidden).toBeFalsy();
            expect(grid.getColumnByName('ContactTitle').hidden).toBeFalsy();

            const gridFirstRow = grid.rowList.first;
            const firstRowCells = gridFirstRow.cells.toArray();
            const headerCells = grid.headerGroups.first.children.toArray();

            // headers are aligned to cells
            verifyLayoutHeadersAreAligned(headerCells, firstRowCells);

            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups.slice(1, 2));

            // show group
            fixture.componentInstance.colGroups[0].hidden = false;
            fixture.detectChanges();

            expect(grid.getColumnByName('group1').hidden).toBeFalsy();
            expect(grid.getColumnByName('PostalCode').hidden).toBeFalsy();
            expect(grid.getColumnByName('City').hidden).toBeFalsy();
            expect(grid.getColumnByName('Country').hidden).toBeFalsy();
            expect(grid.getColumnByName('Address').hidden).toBeFalsy();

            expect(grid.getColumnByName('group2').hidden).toBeFalsy();
            expect(grid.getColumnByName('ID').hidden).toBeFalsy();
            expect(grid.getColumnByName('CompanyName').hidden).toBeFalsy();
            expect(grid.getColumnByName('ContactName').hidden).toBeFalsy();
            expect(grid.getColumnByName('ContactTitle').hidden).toBeFalsy();

            // headers are aligned to cells
            verifyLayoutHeadersAreAligned(headerCells, firstRowCells);

            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups);

            // hide the other group
            fixture.componentInstance.colGroups[1].hidden = true;
            fixture.detectChanges();

            expect(grid.getColumnByName('PostalCode').hidden).toBeFalsy();
            expect(grid.getColumnByName('City').hidden).toBeFalsy();
            expect(grid.getColumnByName('Country').hidden).toBeFalsy();
            expect(grid.getColumnByName('Address').hidden).toBeFalsy();

            expect(grid.getColumnByName('ID').hidden).toBeTruthy();
            expect(grid.getColumnByName('CompanyName').hidden).toBeTruthy();
            expect(grid.getColumnByName('ContactName').hidden).toBeTruthy();
            expect(grid.getColumnByName('ContactTitle').hidden).toBeTruthy();

            // headers are aligned to cells
            verifyLayoutHeadersAreAligned(headerCells, firstRowCells);

            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups.slice(0, 1));
        });

        it('should hide/show whole group if a single child column is hidden/shown.', () => {
            // show PostalCode
            grid.getColumnByName('PostalCode').hidden = false;
            fixture.detectChanges();

            // everything should be shown
            expect(grid.getColumnByName('group1').hidden).toBeFalsy();
            expect(grid.getColumnByName('PostalCode').hidden).toBeFalsy();
            expect(grid.getColumnByName('City').hidden).toBeFalsy();
            expect(grid.getColumnByName('Country').hidden).toBeFalsy();
            expect(grid.getColumnByName('Address').hidden).toBeFalsy();

            expect(grid.getColumnByName('group2').hidden).toBeFalsy();
            expect(grid.getColumnByName('ID').hidden).toBeFalsy();
            expect(grid.getColumnByName('CompanyName').hidden).toBeFalsy();
            expect(grid.getColumnByName('ContactName').hidden).toBeFalsy();
            expect(grid.getColumnByName('ContactTitle').hidden).toBeFalsy();

            // hide ContactTitle
            grid.getColumnByName('ContactTitle').hidden = true;
            fixture.detectChanges();

            // group2 should be hidden
            expect(grid.getColumnByName('group1').hidden).toBeFalsy();
            expect(grid.getColumnByName('PostalCode').hidden).toBeFalsy();
            expect(grid.getColumnByName('City').hidden).toBeFalsy();
            expect(grid.getColumnByName('Country').hidden).toBeFalsy();
            expect(grid.getColumnByName('Address').hidden).toBeFalsy();

            expect(grid.getColumnByName('group2').hidden).toBeTruthy();
            expect(grid.getColumnByName('ID').hidden).toBeTruthy();
            expect(grid.getColumnByName('CompanyName').hidden).toBeTruthy();
            expect(grid.getColumnByName('ContactName').hidden).toBeTruthy();
            expect(grid.getColumnByName('ContactTitle').hidden).toBeTruthy();
        });

        it('should work with horizontal virtualization when some groups are hidden/shown.', async() => {
            const uniqueGroups = [
                {
                group: 'group1',
                hidden: true,
                // total colspan 3
                columns: [
                    { field: 'Address', rowStart: 1, colStart: 1, colEnd : 4, rowEnd: 3},
                    { field: 'County', rowStart: 3, colStart: 1},
                    { field: 'Region', rowStart: 3, colStart: 2},
                    { field: 'City', rowStart: 3, colStart: 3}
                ]
            },
            {
                group: 'group2',
                  // total colspan 2
                columns: [
                    { field: 'CompanyName', rowStart: 1, colStart: 1},
                    { field: 'Address', rowStart: 1, colStart: 2},
                    { field: 'ContactName', rowStart: 2, colStart: 1, colEnd : 3, rowEnd: 4}
                ]
            },
            {
                group: 'group3',
                // total colspan 1
                columns: [
                    { field: 'Phone', rowStart: 1, colStart: 1},
                    { field: 'Fax', rowStart: 2, colStart: 1, rowEnd: 4}
                ]
            },
            {
                group: 'group4',
                // total colspan 4
                columns: [
                    { field: 'CompanyName', rowStart: 1, colStart: 1, colEnd: 3},
                    { field: 'Phone', rowStart: 1, colStart: 3, rowEnd: 3},
                    { field: 'Address', rowStart: 1, colStart: 4, rowEnd: 4},
                    { field: 'Region', rowStart: 2, colStart: 1},
                    { field: 'City', rowStart: 2, colStart: 2},
                    { field: 'ContactName', rowStart: 3, colStart: 1, colEnd: 4},
                ]
            }
            ];
            fixture.componentInstance.colGroups = uniqueGroups;
            grid.columnWidth = '200px';
            fixture.componentInstance.grid.width = '600px';
            fixture.detectChanges();

            // group1 should be hidden on init, check DOM
            const gridFirstRow = grid.rowList.first;
            const firstRowCells = gridFirstRow.cells.toArray();
            const headerCells = grid.headerGroups.first.children.toArray();
            verifyLayoutHeadersAreAligned(headerCells, firstRowCells);
            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups.slice(1));

            // check virtualization state
            // 4 groups in total - 1 is hidden
            const horizontalVirtualization = grid.rowList.first.virtDirRow;
            expect(grid.hasHorizontalScroll()).toBeTruthy();
            expect(horizontalVirtualization.igxForOf.length).toBe(3);
            // check order is correct
            expect(horizontalVirtualization.igxForOf[0]).toBe(grid.getColumnByName('group2'));
            expect(horizontalVirtualization.igxForOf[1]).toBe(grid.getColumnByName('group3'));
            expect(horizontalVirtualization.igxForOf[2]).toBe(grid.getColumnByName('group4'));
            // check their sizes are correct
            expect(horizontalVirtualization.getSizeAt(0)).toBe(2 * 200);
            expect(horizontalVirtualization.getSizeAt(1)).toBe(1 * 200);
            expect(horizontalVirtualization.getSizeAt(2)).toBe(4 * 200);

             // check total widths sum
            let horizonatalScrElem = horizontalVirtualization.getHorizontalScroll();
            // 7 column span in total
            let totalExpected = 7 * 200;
            expect(parseInt(horizonatalScrElem.children[0].style.width, 10)).toBe(totalExpected);

            // hide group 3
            grid.getColumnByName('group3').hidden = true;
            fixture.detectChanges();

            // check virtualization state
            // 4 groups in total - 2 is hidden
            expect(grid.hasHorizontalScroll()).toBeTruthy();
            expect(horizontalVirtualization.igxForOf.length).toBe(2);
            // check order is correct
            expect(horizontalVirtualization.igxForOf[0]).toBe(grid.getColumnByName('group2'));
            expect(horizontalVirtualization.igxForOf[1]).toBe(grid.getColumnByName('group4'));
            // check their sizes are correct
            expect(horizontalVirtualization.getSizeAt(0)).toBe(2 * 200);
            expect(horizontalVirtualization.getSizeAt(1)).toBe(4 * 200);

             // check total widths sum
            horizonatalScrElem = horizontalVirtualization.getHorizontalScroll();
            // 7 column span in total
            totalExpected = 6 * 200;
            expect(parseInt(horizonatalScrElem.children[0].style.width, 10)).toBe(totalExpected);

            // show group1
            grid.getColumnByName('group1').hidden = false;
            fixture.detectChanges();

            // check virtualization state
            // 4 groups in total - 1 is hidden
            expect(grid.hasHorizontalScroll()).toBeTruthy();
            expect(horizontalVirtualization.igxForOf.length).toBe(3);
            // check order is correct
            expect(horizontalVirtualization.igxForOf[0]).toBe(grid.getColumnByName('group1'));
            expect(horizontalVirtualization.igxForOf[1]).toBe(grid.getColumnByName('group2'));
            expect(horizontalVirtualization.igxForOf[2]).toBe(grid.getColumnByName('group4'));
            // check their sizes are correct
            expect(horizontalVirtualization.getSizeAt(0)).toBe(3 * 200);
            expect(horizontalVirtualization.getSizeAt(1)).toBe(2 * 200);
            expect(horizontalVirtualization.getSizeAt(2)).toBe(4 * 200);

             // check total widths sum
            horizonatalScrElem = horizontalVirtualization.getHorizontalScroll();
            // 7 column span in total
            totalExpected = 9 * 200;
            expect(parseInt(horizonatalScrElem.children[0].style.width, 10)).toBe(totalExpected);

            // check last column group can be scrolled in view
            horizontalVirtualization.scrollTo(2);
            await wait(100);
            fixture.detectChanges();

            const lastCell = grid.rowList.first.cells.toArray()[9];
            expect(lastCell.column.field).toBe('Address');
            expect(lastCell.column.parent.field).toBe('group4');
            expect(lastCell.nativeElement.getBoundingClientRect().right + 1)
             .toEqual(grid.tbody.nativeElement.getBoundingClientRect().right);

        });

        it('UI - hidden columns count and drop-down items text in hiding toolbar should be correct when group is hidden/shown. ', () => {
            // enable toolbar for hiding
            grid.showToolbar = true;
            grid.columnHiding = true;
            fixture.detectChanges();
            const toolbar = fixture.debugElement.query(By.css('igx-grid-toolbar'));
            const hidingButton = toolbar.queryAll(By.css('button')).find((b) => b.nativeElement.name === 'btnColumnHiding');
            const hidingButtonLabel = hidingButton.query(By.css('span'));
            hidingButtonLabel.nativeElement.click();
            fixture.detectChanges();
            // should show count for actual hidden igxColumns
            expect(parseInt(hidingButtonLabel.nativeElement.textContent.trim(), 10)).toBe(4);
            const columnChooserElement = fixture.debugElement.query(By.css('igx-column-hiding'));
            const checkboxes = columnChooserElement.queryAll(By.css('igx-checkbox'));
            // should show 2 checkboxes - one for each group
            expect(checkboxes.length).toBe(2);
            expect(checkboxes[0].query(By.css('.igx-checkbox__label')).nativeElement.textContent.trim()).toBe('group1');
            expect(checkboxes[1].query(By.css('.igx-checkbox__label')).nativeElement.textContent.trim()).toBe('group2');

            // verify checked state
            expect(checkboxes[0].componentInstance.checked).toBeTruthy();
            expect(checkboxes[1].componentInstance.checked).toBeFalsy();
        });

        it('UI - toggling column checkbox checked state successfully changes the column\'s hidden state. ', () => {
            // enable toolbar for hiding
            grid.showToolbar = true;
            grid.columnHiding = true;
            fixture.detectChanges();
            const toolbar = fixture.debugElement.query(By.css('igx-grid-toolbar'));
            const hidingButton = toolbar.queryAll(By.css('button')).find((b) => b.nativeElement.name === 'btnColumnHiding');
            hidingButton.nativeElement.click();
            fixture.detectChanges();
            const verifyCheckbox = HelperUtils.verifyCheckbox;
            const columnChooserElement = fixture.debugElement.query(By.css('igx-column-hiding'));
            const checkbox = HelperUtils.getCheckboxInput('group1', columnChooserElement, fixture);
            verifyCheckbox('group1', true, false, columnChooserElement, fixture);

            const column = grid.getColumnByName('group1');
            expect(column.hidden).toBeTruthy();

            const gridFirstRow = grid.rowList.first;
            const firstRowCells = gridFirstRow.cells.toArray();
            const headerCells = grid.headerGroups.first.children.toArray();
            verifyLayoutHeadersAreAligned(headerCells, firstRowCells);
            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups.slice(1));

            checkbox.click();

            expect(checkbox.checked).toBe(false);
            expect(column.hidden).toBeFalsy();

            verifyLayoutHeadersAreAligned(headerCells, firstRowCells);
            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups);

            checkbox.click();

            expect(checkbox.checked).toBe(true);
            expect(column.hidden).toBeTruthy();
        });

        it('UI - should emit onColumnVisibilityChanged event on toggling checkboxes.', () => {
            // enable toolbar for hiding
            grid.showToolbar = true;
            grid.columnHiding = true;
            fixture.detectChanges();
            const toolbar = fixture.debugElement.query(By.css('igx-grid-toolbar'));
            const hidingButton = toolbar.queryAll(By.css('button')).find((b) => b.nativeElement.name === 'btnColumnHiding');
            hidingButton.nativeElement.click();
            fixture.detectChanges();

            const args = [];
            grid.onColumnVisibilityChanged.subscribe((ar) => {
                args.push(ar);
            });

            const columnChooserElement = fixture.debugElement.query(By.css('igx-column-hiding'));
            const checkbox = HelperUtils.getCheckboxInput('group1', columnChooserElement, fixture);
            checkbox.click();
            fixture.detectChanges();

            expect(args.length).toBe(1);
            expect(args[0].column).toBe(grid.getColumnByName('group1'));
            expect(args[0].newValue).toBe(false);
        });

    });

    describe('Pinning ', () => {
        beforeEach(async(() => {
            fixture = TestBed.createComponent(ColumnLayoutPinningTestComponent);
            fixture.detectChanges();
            grid = fixture.componentInstance.grid;
            colGroups = fixture.componentInstance.colGroups;
        }));

        it('should allow pinning/unpinning a whole group.', () => {
            // group 1 should be pinned - all child columns should be pinned
            expect(grid.getColumnByName('PostalCode').pinned).toBeTruthy();
            expect(grid.getColumnByName('City').pinned).toBeTruthy();
            expect(grid.getColumnByName('Country').pinned).toBeTruthy();
            expect(grid.getColumnByName('Address').pinned).toBeTruthy();

            expect(grid.getColumnByName('ID').pinned).toBeFalsy();
            expect(grid.getColumnByName('CompanyName').pinned).toBeFalsy();
            expect(grid.getColumnByName('ContactName').pinned).toBeFalsy();
            expect(grid.getColumnByName('ContactTitle').pinned).toBeFalsy();

            const gridFirstRow = grid.rowList.first;
            const firstRowCells = gridFirstRow.cells.toArray();
            const headerCells = grid.headerGroups.first.children.toArray();

            // headers are aligned to cells
            verifyLayoutHeadersAreAligned(headerCells, firstRowCells);

            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups);

            // unpin group
            fixture.componentInstance.colGroups[0].pinned = false;
            fixture.detectChanges();

            expect(grid.getColumnByName('PostalCode').pinned).toBeFalsy();
            expect(grid.getColumnByName('City').pinned).toBeFalsy();
            expect(grid.getColumnByName('Country').pinned).toBeFalsy();
            expect(grid.getColumnByName('Address').pinned).toBeFalsy();

            expect(grid.getColumnByName('ID').pinned).toBeFalsy();
            expect(grid.getColumnByName('CompanyName').pinned).toBeFalsy();
            expect(grid.getColumnByName('ContactName').pinned).toBeFalsy();
            expect(grid.getColumnByName('ContactTitle').pinned).toBeFalsy();

            // headers are aligned to cells
            verifyLayoutHeadersAreAligned(headerCells, firstRowCells);

            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups);

            // pin the other group
            fixture.componentInstance.colGroups[1].pinned = true;
            fixture.detectChanges();

            expect(grid.getColumnByName('PostalCode').pinned).toBeFalsy();
            expect(grid.getColumnByName('City').pinned).toBeFalsy();
            expect(grid.getColumnByName('Country').pinned).toBeFalsy();
            expect(grid.getColumnByName('Address').pinned).toBeFalsy();

            expect(grid.getColumnByName('ID').pinned).toBeTruthy();
            expect(grid.getColumnByName('CompanyName').pinned).toBeTruthy();
            expect(grid.getColumnByName('ContactName').pinned).toBeTruthy();
            expect(grid.getColumnByName('ContactTitle').pinned).toBeTruthy();

        });

        it('should pin/unpin whole group if a single child column is pinned/unpinned.', () => {
            // group 1 should be pinned - all child columns should be pinned
            expect(grid.getColumnByName('PostalCode').pinned).toBeTruthy();
            expect(grid.getColumnByName('City').pinned).toBeTruthy();
            expect(grid.getColumnByName('Country').pinned).toBeTruthy();
            expect(grid.getColumnByName('Address').pinned).toBeTruthy();

            expect(grid.getColumnByName('ID').pinned).toBeFalsy();
            expect(grid.getColumnByName('CompanyName').pinned).toBeFalsy();
            expect(grid.getColumnByName('ContactName').pinned).toBeFalsy();
            expect(grid.getColumnByName('ContactTitle').pinned).toBeFalsy();


            grid.unpinColumn('City');
            fixture.detectChanges();

            expect(grid.getColumnByName('PostalCode').pinned).toBeFalsy();
            expect(grid.getColumnByName('City').pinned).toBeFalsy();
            expect(grid.getColumnByName('Country').pinned).toBeFalsy();
            expect(grid.getColumnByName('Address').pinned).toBeFalsy();

            expect(grid.getColumnByName('ID').pinned).toBeFalsy();
            expect(grid.getColumnByName('CompanyName').pinned).toBeFalsy();
            expect(grid.getColumnByName('ContactName').pinned).toBeFalsy();
            expect(grid.getColumnByName('ContactTitle').pinned).toBeFalsy();

            grid.pinColumn('ContactName');
            fixture.detectChanges();

            expect(grid.getColumnByName('PostalCode').pinned).toBeFalsy();
            expect(grid.getColumnByName('City').pinned).toBeFalsy();
            expect(grid.getColumnByName('Country').pinned).toBeFalsy();
            expect(grid.getColumnByName('Address').pinned).toBeFalsy();

            expect(grid.getColumnByName('ID').pinned).toBeTruthy();
            expect(grid.getColumnByName('CompanyName').pinned).toBeTruthy();
            expect(grid.getColumnByName('ContactName').pinned).toBeTruthy();
            expect(grid.getColumnByName('ContactTitle').pinned).toBeTruthy();
        });

        it('should not allow pinning if group width exceeds max allowed.', () => {
            // pin the other group
            fixture.componentInstance.colGroups[1].pinned = true;
            fixture.detectChanges();

            // group 1 should still be pinned - all child columns should be pinned
            expect(grid.getColumnByName('PostalCode').pinned).toBeTruthy();
            expect(grid.getColumnByName('City').pinned).toBeTruthy();
            expect(grid.getColumnByName('Country').pinned).toBeTruthy();
            expect(grid.getColumnByName('Address').pinned).toBeTruthy();
            // group 2 should not be pinned as it will exceed unpinnedAreaMinWidth
            expect(grid.getColumnByName('ID').pinned).toBeFalsy();
            expect(grid.getColumnByName('CompanyName').pinned).toBeFalsy();
            expect(grid.getColumnByName('ContactName').pinned).toBeFalsy();
            expect(grid.getColumnByName('ContactTitle').pinned).toBeFalsy();
        });

        it('should emit onColumnPinning event with correct parameters', () => {
            let allArgs = [];
            grid.onColumnPinning.subscribe((args) => {
                allArgs.push(args);
            });

            grid.unpinColumn('City');
            fixture.detectChanges();
            // should unpin parent and all child cols - 4 child + 1 parent
            expect(allArgs.length).toBe(5);

            expect(allArgs[0].column.field).toBe('PostalCode');
            expect(allArgs[0].isPinned).toBeFalsy();

            expect(allArgs[1].column.field).toBe('City');
            expect(allArgs[1].isPinned).toBeFalsy();

            expect(allArgs[2].column.field).toBe('Country');
            expect(allArgs[2].isPinned).toBeFalsy();

            expect(allArgs[3].column.field).toBe('Address');
            expect(allArgs[3].isPinned).toBeFalsy();

            expect(allArgs[4].column instanceof IgxColumnLayoutComponent).toBeTruthy();
            expect(allArgs[4].isPinned).toBeFalsy();

            allArgs = [];
            grid.pinColumn('ID');
            fixture.detectChanges();
            // should pin parent and all child cols - 4 child + 1 parent
            expect(allArgs.length).toBe(5);

            expect(allArgs[0].column instanceof IgxColumnLayoutComponent).toBeTruthy();
            expect(allArgs[0].isPinned).toBeTruthy();

            expect(allArgs[1].column.field).toBe('ID');
            expect(allArgs[1].isPinned).toBeTruthy();

            expect(allArgs[2].column.field).toBe('CompanyName');
            expect(allArgs[2].isPinned).toBeTruthy();

            expect(allArgs[3].column.field).toBe('ContactName');
            expect(allArgs[3].isPinned).toBeTruthy();

            expect(allArgs[4].column.field).toBe('ContactTitle');
            expect(allArgs[4].isPinned).toBeTruthy();

        });

        it('should work with horizontal virtualization on the unpinned groups.', async() => {
            const uniqueGroups = [
                {
                group: 'group1',
                // total colspan 3
                columns: [
                    { field: 'Address', rowStart: 1, colStart: 1, colEnd : 4, rowEnd: 3},
                    { field: 'County', rowStart: 3, colStart: 1},
                    { field: 'Region', rowStart: 3, colStart: 2},
                    { field: 'City', rowStart: 3, colStart: 3}
                ]
            },
            {
                group: 'group2',
                  // total colspan 2
                columns: [
                    { field: 'CompanyName', rowStart: 1, colStart: 1},
                    { field: 'Address', rowStart: 1, colStart: 2},
                    { field: 'ContactName', rowStart: 2, colStart: 1, colEnd : 3, rowEnd: 4}
                ]
            },
            {
                group: 'group3',
                // total colspan 1
                columns: [
                    { field: 'Phone', rowStart: 1, colStart: 1},
                    { field: 'Fax', rowStart: 2, colStart: 1, rowEnd: 4}
                ]
            },
            {
                group: 'group4',
                // total colspan 4
                columns: [
                    { field: 'CompanyName', rowStart: 1, colStart: 1, colEnd: 3},
                    { field: 'Phone', rowStart: 1, colStart: 3, rowEnd: 3},
                    { field: 'Address', rowStart: 1, colStart: 4, rowEnd: 4},
                    { field: 'Region', rowStart: 2, colStart: 1},
                    { field: 'City', rowStart: 2, colStart: 2},
                    { field: 'ContactName', rowStart: 3, colStart: 1, colEnd: 4},
                ]
            }
            ];
            fixture.componentInstance.colGroups = uniqueGroups;
            grid.columnWidth = '200px';
            fixture.componentInstance.grid.width = '600px';
            fixture.detectChanges();
            // pin group3
            grid.pinColumn('group3');
            fixture.detectChanges();
            // check group 3 is pinned
            expect(grid.getColumnByName('group3').pinned).toBeTruthy();
            expect(grid.getColumnByName('Fax').pinned).toBeTruthy();
            expect(grid.getColumnByName('Phone').pinned).toBeTruthy();
            const gridFirstRow = grid.rowList.first;
            const firstRowCells = gridFirstRow.cells.toArray();
            const headerCells = grid.headerGroups.first.children.toArray();

            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups.slice(2, 3));
             // headers are aligned to cells
             verifyLayoutHeadersAreAligned(headerCells, firstRowCells);

            // check virtualization state
            // 4 groups in total - 1 is pinned
            const horizontalVirtualization = grid.rowList.first.virtDirRow;
            expect(grid.hasHorizontalScroll()).toBeTruthy();
            expect(horizontalVirtualization.igxForOf.length).toBe(3);
            // check order is correct
            expect(horizontalVirtualization.igxForOf[0]).toBe(grid.getColumnByName('group1'));
            expect(horizontalVirtualization.igxForOf[1]).toBe(grid.getColumnByName('group2'));
            expect(horizontalVirtualization.igxForOf[2]).toBe(grid.getColumnByName('group4'));
            // check their sizes are correct
            expect(horizontalVirtualization.getSizeAt(0)).toBe(3 * 200);
            expect(horizontalVirtualization.getSizeAt(1)).toBe(2 * 200);
            expect(horizontalVirtualization.getSizeAt(2)).toBe(4 * 200);

            // check total widths sum
            const horizonatalScrElem = horizontalVirtualization.getHorizontalScroll();
            // 9 column span in total
            const totalExpected = 9 * 200;
            expect(parseInt(horizonatalScrElem.children[0].style.width, 10)).toBe(totalExpected);

            // check last column group can be scrolled in view
            horizontalVirtualization.scrollTo(2);
            await wait(100);
            fixture.detectChanges();

            const lastCell = grid.rowList.first.cells.toArray()[4];
            expect(lastCell.column.field).toBe('Address');
            expect(lastCell.column.parent.field).toBe('group4');
            expect(Math.round(lastCell.nativeElement.getBoundingClientRect().right) + 1)
            .toEqual(grid.tbody.nativeElement.getBoundingClientRect().right);
        });

        it('UI - pinned columns count and drop-down items text in pinnig toolbar should be correct when group is pinned. ', () => {
            // enable toolbar for pinning
            grid.showToolbar = true;
            grid.columnPinning = true;
            fixture.detectChanges();
            const toolbar = fixture.debugElement.query(By.css('igx-grid-toolbar'));
            const pinningButton = toolbar.queryAll(By.css('button')).find((b) => b.nativeElement.name === 'btnColumnPinning');
            const pinningButtonLabel = pinningButton.query(By.css('span'));
            pinningButtonLabel.nativeElement.click();
            fixture.detectChanges();
            // should show count for actual igxColumns displayed in the pinned area
            expect(parseInt(pinningButtonLabel.nativeElement.textContent.trim(), 10)).toBe(4);
            const columnChooserElement = fixture.debugElement.query(By.css('igx-column-pinning'));
            const checkboxes = columnChooserElement.queryAll(By.css('igx-checkbox'));
            // should show 2 checkboxes - one for each group
            expect(checkboxes.length).toBe(2);
            expect(checkboxes[0].query(By.css('.igx-checkbox__label')).nativeElement.textContent.trim()).toBe('group1');
            expect(checkboxes[1].query(By.css('.igx-checkbox__label')).nativeElement.textContent.trim()).toBe('group2');

            // verify checked state
            expect(checkboxes[0].componentInstance.checked).toBeTruthy();
            expect(checkboxes[1].componentInstance.checked).toBeFalsy();
        });

        it('UI - toggling column checkbox checked state successfully changes the column\'s pinned state. ', async(() => {
            grid.showToolbar = true;
            grid.columnPinning = true;
            const uniqueGroups = [
                {
                group: 'group1',
                // total colspan 3
                columns: [
                    { field: 'Address', rowStart: 1, colStart: 1, colEnd : 4, rowEnd: 3},
                    { field: 'County', rowStart: 3, colStart: 1},
                    { field: 'Region', rowStart: 3, colStart: 2},
                    { field: 'City', rowStart: 3, colStart: 3}
                ]
            },
            {
                group: 'group2',
                  // total colspan 2
                columns: [
                    { field: 'CompanyName', rowStart: 1, colStart: 1},
                    { field: 'Address', rowStart: 1, colStart: 2},
                    { field: 'ContactName', rowStart: 2, colStart: 1, colEnd : 3, rowEnd: 4}
                ]
            },
            {
                group: 'group3',
                // total colspan 1
                columns: [
                    { field: 'Phone', rowStart: 1, colStart: 1},
                    { field: 'Fax', rowStart: 2, colStart: 1, rowEnd: 4}
                ]
            },
            {
                group: 'group4',
                // total colspan 4
                columns: [
                    { field: 'CompanyName', rowStart: 1, colStart: 1, colEnd: 3},
                    { field: 'Phone', rowStart: 1, colStart: 3, rowEnd: 3},
                    { field: 'Address', rowStart: 1, colStart: 4, rowEnd: 4},
                    { field: 'Region', rowStart: 2, colStart: 1},
                    { field: 'City', rowStart: 2, colStart: 2},
                    { field: 'ContactName', rowStart: 3, colStart: 1, colEnd: 4},
                ]
            }
            ];
            fixture.componentInstance.colGroups = uniqueGroups;
            grid.columnWidth = '200px';
            fixture.componentInstance.grid.width = '1000px';
            fixture.detectChanges();
            const toolbar = fixture.debugElement.query(By.css('igx-grid-toolbar'));
            const pinningButton = toolbar.queryAll(By.css('button')).find((b) => b.nativeElement.name === 'btnColumnPinning');
            pinningButton.nativeElement.click();
            const columnChooserElement = fixture.debugElement.query(By.css('igx-column-pinning'));

            const verifyCheckbox = HelperUtils.verifyCheckbox;
            const checkbox = HelperUtils.getCheckboxInput('group1', columnChooserElement, fixture);
            verifyCheckbox('group1', false, false, columnChooserElement, fixture);

            const column = grid.getColumnByName('group1');
            expect(column.pinned).toBeFalsy();

            checkbox.click();

            expect(checkbox.checked).toBe(true);
            expect(column.pinned).toBeTruthy();

            checkbox.click();

            expect(checkbox.checked).toBe(false);
            expect(column.pinned).toBeFalsy();
        }));

        it('should work when pinning group with columns that do not have and the unpinned group has width in percentages.', async() => {
            const uniqueGroups = [
                {
                    group: 'group1',
                    // total colspan 3
                    columns: [
                        { field: 'Address', rowStart: 1, colStart: 1, colEnd : 4, rowEnd: 3},
                        { field: 'County', rowStart: 3, colStart: 1},
                        { field: 'Region', rowStart: 3, colStart: 2},
                        { field: 'City', rowStart: 3, colStart: 3}
                    ]
                },
                {
                    group: 'group2',
                    // total colspan 2
                    columns: [
                        { field: 'CompanyName', rowStart: 1, colStart: 1, width: '50%'},
                        { field: 'Address', rowStart: 1, colStart: 2, width: '15%'},
                        { field: 'ContactName', rowStart: 2, colStart: 1, colEnd : 3, rowEnd: 4}
                    ]
                }
            ];
            fixture.componentInstance.colGroups = uniqueGroups;
            fixture.componentInstance.grid.width = (800 + grid.scrollWidth) + 'px';
            fixture.detectChanges();

            // pin group3
            grid.pinColumn('group1');
            fixture.detectChanges();

            // check group 3 is pinned
            expect(grid.getColumnByName('group1').pinned).toBeTruthy();
            expect(grid.getColumnByName('Address').pinned).toBeTruthy();
            expect(grid.getColumnByName('County').pinned).toBeTruthy();
            const gridFirstRow = grid.rowList.first;
            const firstRowCells = gridFirstRow.cells.toArray();
            const headerCells = grid.headerGroups.first.children.toArray();

            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups.slice(2, 3));
             // headers are aligned to cells
             verifyLayoutHeadersAreAligned(headerCells, firstRowCells);

            // check virtualization state
            const horizontalVirtualization = grid.rowList.first.virtDirRow;
            expect(grid.hasHorizontalScroll()).toBeTruthy();
            expect(horizontalVirtualization.igxForOf.length).toBe(1);
            expect(horizontalVirtualization.igxForOf[0]).toBe(grid.getColumnByName('group2'));
            // check their sizes are correct
            const totalExpected = 0.65 * 800;
            expect(horizontalVirtualization.getSizeAt(0)).toBe(totalExpected);

            // check width scrollbar
            const horizonatalScrElem = horizontalVirtualization.getHorizontalScroll();
            expect(parseInt(horizonatalScrElem.children[0].style.width, 10)).toBe(totalExpected);
        });
    });

    describe('Filtering ', () => {
        beforeEach(async(() => {
            fixture = TestBed.createComponent(ColumnLayoutFilteringTestComponent);
            fixture.detectChanges();
            grid = fixture.componentInstance.grid;
            colGroups = fixture.componentInstance.colGroups;
        }));

        it('should enforce excel style filtering.', () => {
            const filteringCells = fixture.debugElement.queryAll(By.css('igx-grid-filtering-cell'));
            expect(filteringCells.length).toBe(0);

            const filterIcons = fixture.debugElement.queryAll(By.css('.igx-excel-filter__icon'));
            expect(filterIcons.length).not.toBe(0);

            const gridFirstRow = grid.rowList.first;
            const firstRowCells = gridFirstRow.cells.toArray();
            const headerCells = grid.headerGroups.first.children.toArray();

            expect(filterIcons.length).toBe(gridFirstRow.cells.length);

            // headers are aligned to cells
            verifyLayoutHeadersAreAligned(headerCells, firstRowCells);

            verifyDOMMatchesLayoutSettings(gridFirstRow, fixture.componentInstance.colGroups);
        });
    });

    describe('GroupBy ', () => {
        beforeEach(async(() => {
            fixture = TestBed.createComponent(ColumnLayoutGroupingTestComponent);
            fixture.detectChanges();
            grid = fixture.componentInstance.grid;
            colGroups = fixture.componentInstance.colGroups;
        }));

        it('should render rows correctly when grouped by a column and scrolling to bottom should not leave empty space.', async() => {
            grid.height = '600px';
            grid.groupBy({
                dir: SortingDirection.Desc,
                fieldName: 'Country',
                ignoreCase: false,
                strategy: DefaultSortingStrategy.instance()
            });
            fixture.detectChanges();

            expect(grid.rowList.length).toEqual(8);
            expect(grid.verticalScrollContainer.getVerticalScroll().children[0].offsetHeight -
                grid.verticalScrollContainer.getVerticalScroll().offsetHeight).toBeGreaterThan(0);

            const lastIndex = grid.data.length + grid.groupsRecords.length - 1;
            grid.verticalScrollContainer.scrollTo(lastIndex);
            await wait(100);
            fixture.detectChanges();

            const scrollTop = grid.verticalScrollContainer.getVerticalScroll().scrollTop;
            const scrollHeight = grid.verticalScrollContainer.getVerticalScroll().scrollHeight;
            const tbody = fixture.debugElement.query(By.css('.igx-grid__tbody')).nativeElement;
            const scrolledToBottom = Math.round(scrollTop + tbody.scrollHeight) === scrollHeight;
            expect(grid.rowList.length).toEqual(8);
            expect(scrolledToBottom).toBeTruthy();

            const lastRowOffset = grid.rowList.last.element.nativeElement.offsetTop +
                grid.rowList.last.element.nativeElement.offsetHeight + parseInt(tbody.children[0].children[0].style.top, 10);
            expect(lastRowOffset).toEqual(tbody.scrollHeight);
        });

        it('should render rows correctly and collapsing all should render all groups and there should be no scrollbar.', async() => {
            grid.height = '600px';
            grid.groupBy({
                dir: SortingDirection.Desc,
                fieldName: 'Country',
                ignoreCase: false,
                strategy: DefaultSortingStrategy.instance()
            });
            fixture.detectChanges();

            expect(grid.rowList.length).toEqual(8);
            expect(grid.verticalScrollContainer.getVerticalScroll().children[0].offsetHeight -
                grid.verticalScrollContainer.getVerticalScroll().offsetHeight).toBeGreaterThan(0);

            grid.toggleAllGroupRows();
            await wait(100);
            fixture.detectChanges();

            expect(grid.rowList.length).toEqual(12);
            expect(grid.verticalScrollContainer.getVerticalScroll().children[0].offsetHeight -
                grid.verticalScrollContainer.getVerticalScroll().offsetHeight).toBeLessThanOrEqual(0);
        });
    });

    describe('Resizing', () => {
        const DEBOUNCE_TIME = 200;
        const GRID_COL_GROUP_THEAD = 'igx-grid-header-group';
        const RESIZE_LINE_CLASS = '.igx-grid__th-resize-line';

        beforeEach(async(() => {
            fixture = TestBed.createComponent(ColumnLayoutResizingTestComponent);
            fixture.detectChanges();
            grid = fixture.componentInstance.grid;
            colGroups = fixture.componentInstance.colGroups;
        }));

        it('should correctly resize column on upper level with 3 spans and the two cols below it with span 1 that have width', async() => {
            grid.width = '1500px';
            fixture.componentInstance.colGroups = [{
                group: 'group1',
                columns: [
                    { field: 'ContactName', rowStart: 1, colStart: 1, colEnd : 4, width: '300px', resizable: true},
                    { field: 'ContactTitle', rowStart: 1, colStart: 4, colEnd: 6, width: '200px', resizable: true},
                    { field: 'Country', rowStart: 1, colStart: 6, colEnd: 7, width: '200px', resizable: true},
                    { field: 'Phone', rowStart: 2, colStart: 1, colEnd: 3, width: '200px', resizable: true},
                    { field: 'City', rowStart: 2, colStart: 3, colEnd: 5, resizable: true},
                    { field: 'Address', rowStart: 2, colStart: 5, colEnd: 7, width: '200px', resizable: true},
                    { field: 'CompanyName', rowStart: 3, colStart: 1, colEnd: 2, width: '200px', resizable: true},
                    { field: 'PostalCode', rowStart: 3, colStart: 2, colEnd: 3, width: '200px', resizable: true},
                    { field: 'Fax', rowStart: 3, colStart: 3, colEnd: 7},
                ]
            }];
            fixture.detectChanges();

            // ContactName
            expect(grid.columns[1].width).toEqual('300px');
            expect(grid.columns[1].cells[0].value).toEqual('Maria Anders');

            const headerCells = fixture.debugElement.queryAll(By.css(GRID_COL_GROUP_THEAD));
            const headerResArea = headerCells[1].children[1].nativeElement;
            UIInteractions.simulateMouseEvent('mousedown', headerResArea, 450, 0);
            await wait(DEBOUNCE_TIME);
            fixture.detectChanges();

            const resizer = fixture.debugElement.queryAll(By.css(RESIZE_LINE_CLASS))[0].nativeElement;
            expect(resizer).toBeDefined();
            UIInteractions.simulateMouseEvent('mousemove', resizer, 600, 5);
            UIInteractions.simulateMouseEvent('mouseup', resizer, 600, 5);
            fixture.detectChanges();

            const groupRowBlocks = fixture.debugElement.query(By.css('.igx-grid__tbody')).queryAll(By.css('.igx-grid__mrl-block'));
            expect(groupRowBlocks[0].nativeElement.style.gridTemplateColumns).toEqual('250px 250px 150px 100px 100px 200px');
        });

        it('should correctly resize column with span 2 and the ones below it that have span 1 with width set', async() => {
            grid.width = '1500px';
            fixture.componentInstance.colGroups = [{
                group: 'group1',
                columns: [
                    { field: 'ContactName', rowStart: 1, colStart: 1, colEnd : 4, width: '300px', resizable: true},
                    { field: 'ContactTitle', rowStart: 1, colStart: 4, colEnd: 6, width: '200px', resizable: true},
                    { field: 'Country', rowStart: 1, colStart: 6, colEnd: 7, width: '200px', resizable: true},
                    { field: 'Phone', rowStart: 2, colStart: 1, colEnd: 3, width: '200px', resizable: true},
                    { field: 'City', rowStart: 2, colStart: 3, colEnd: 5, resizable: true},
                    { field: 'Address', rowStart: 2, colStart: 5, colEnd: 7, width: '200px', resizable: true},
                    { field: 'CompanyName', rowStart: 3, colStart: 1, colEnd: 2, width: '200px', resizable: true},
                    { field: 'PostalCode', rowStart: 3, colStart: 2, colEnd: 3, width: '200px', resizable: true},
                    { field: 'Fax', rowStart: 3, colStart: 3, colEnd: 7},
                ]
            }];
            fixture.detectChanges();

            // Phone
            expect(grid.columns[4].width).toEqual('200px');
            expect(grid.columns[4].cells[0].value).toEqual('030-0074321');

            const headerCells = fixture.debugElement.queryAll(By.css(GRID_COL_GROUP_THEAD));
            const headerResArea = headerCells[4].children[1].nativeElement;
            UIInteractions.simulateMouseEvent('mousedown', headerResArea, 450, 0);
            await wait(DEBOUNCE_TIME);
            fixture.detectChanges();

            const resizer = fixture.debugElement.queryAll(By.css(RESIZE_LINE_CLASS))[0].nativeElement;
            expect(resizer).toBeDefined();
            UIInteractions.simulateMouseEvent('mousemove', resizer, 550, 5);
            UIInteractions.simulateMouseEvent('mouseup', resizer, 550, 5);
            fixture.detectChanges();

            const groupRowBlocks = fixture.debugElement.query(By.css('.igx-grid__tbody')).queryAll(By.css('.igx-grid__mrl-block'));
            expect(groupRowBlocks[0].nativeElement.style.gridTemplateColumns).toEqual('250px 250px 100px 100px 100px 200px');
        });

        it('should correctly resize column that spans 1 column that is used to size the column templates', async() => {
            grid.width = '1500px';
            fixture.componentInstance.colGroups = [{
                group: 'group1',
                columns: [
                    { field: 'ContactName', rowStart: 1, colStart: 1, colEnd : 4, width: '300px', resizable: true},
                    { field: 'ContactTitle', rowStart: 1, colStart: 4, colEnd: 6, width: '200px', resizable: true},
                    { field: 'Country', rowStart: 1, colStart: 6, colEnd: 7, width: '200px', resizable: true},
                    { field: 'Phone', rowStart: 2, colStart: 1, colEnd: 3, width: '200px', resizable: true},
                    { field: 'City', rowStart: 2, colStart: 3, colEnd: 5, resizable: true},
                    { field: 'Address', rowStart: 2, colStart: 5, colEnd: 7, width: '200px', resizable: true},
                    { field: 'CompanyName', rowStart: 3, colStart: 1, colEnd: 2, width: '200px', resizable: true},
                    { field: 'PostalCode', rowStart: 3, colStart: 2, colEnd: 3, width: '200px', resizable: true},
                    { field: 'Fax', rowStart: 3, colStart: 3, colEnd: 7},
                ]
            }];
            fixture.detectChanges();

            // PostalCode
            expect(grid.columns[8].width).toEqual('200px');
            expect(grid.columns[8].cells[0].value).toEqual('12209');

            const headerCells = fixture.debugElement.queryAll(By.css(GRID_COL_GROUP_THEAD));
            const headerResArea = headerCells[8].children[1].nativeElement;
            UIInteractions.simulateMouseEvent('mousedown', headerResArea, 450, 0);
            await wait(DEBOUNCE_TIME);
            fixture.detectChanges();

            const resizer = fixture.debugElement.queryAll(By.css(RESIZE_LINE_CLASS))[0].nativeElement;
            expect(resizer).toBeDefined();
            UIInteractions.simulateMouseEvent('mousemove', resizer, 550, 5);
            UIInteractions.simulateMouseEvent('mouseup', resizer, 550, 5);
            fixture.detectChanges();

            const groupRowBlocks = fixture.debugElement.query(By.css('.igx-grid__tbody')).queryAll(By.css('.igx-grid__mrl-block'));
            expect(groupRowBlocks[0].nativeElement.style.gridTemplateColumns).toEqual('200px 300px 100px 100px 100px 200px');
        });

        it('should correctly resize column with span 1 and bigger columns that start with same colStart with bigger span', async() => {
            grid.width = '1500px';
            fixture.componentInstance.colGroups = [{
                group: 'group1',
                columns: [
                    { field: 'ContactName', rowStart: 1, colStart: 1, colEnd : 4, width: '300px', resizable: true},
                    { field: 'ContactTitle', rowStart: 1, colStart: 4, colEnd: 6, width: '200px', resizable: true},
                    { field: 'Country', rowStart: 1, colStart: 6, colEnd: 7, width: '200px', resizable: true},
                    { field: 'Phone', rowStart: 2, colStart: 1, colEnd: 3, width: '200px', resizable: true},
                    { field: 'City', rowStart: 2, colStart: 3, colEnd: 5, resizable: true},
                    { field: 'Address', rowStart: 2, colStart: 5, colEnd: 7, width: '200px', resizable: true},
                    { field: 'CompanyName', rowStart: 3, colStart: 1, colEnd: 2, width: '200px', resizable: true},
                    { field: 'PostalCode', rowStart: 3, colStart: 2, colEnd: 3, width: '200px', resizable: true},
                    { field: 'Fax', rowStart: 3, colStart: 3, colEnd: 7},
                ]
            }];
            fixture.detectChanges();

            // CompanyName
            expect(grid.columns[7].width).toEqual('200px');
            expect(grid.columns[7].cells[0].value).toEqual('Alfreds Futterkiste');

            const headerCells = fixture.debugElement.queryAll(By.css(GRID_COL_GROUP_THEAD));
            const headerResArea = headerCells[7].children[1].nativeElement;
            UIInteractions.simulateMouseEvent('mousedown', headerResArea, 450, 0);
            await wait(DEBOUNCE_TIME);
            fixture.detectChanges();

            const resizer = fixture.debugElement.queryAll(By.css(RESIZE_LINE_CLASS))[0].nativeElement;
            expect(resizer).toBeDefined();
            UIInteractions.simulateMouseEvent('mousemove', resizer, 550, 5);
            UIInteractions.simulateMouseEvent('mouseup', resizer, 550, 5);
            fixture.detectChanges();

            const groupRowBlocks = fixture.debugElement.query(By.css('.igx-grid__tbody')).queryAll(By.css('.igx-grid__mrl-block'));
            expect(groupRowBlocks[0].nativeElement.style.gridTemplateColumns).toEqual('300px 200px 100px 100px 100px 200px');
        });

        it('should correctly resize column while there is another column that does not have width set', async() => {
            grid.width = 1500 + grid.scrollWidth + 'px';
            fixture.componentInstance.colGroups = [{
                group: 'group1',
                columns: [
                    { field: 'ContactName', rowStart: 1, colStart: 1, colEnd : 4, resizable: true},
                    { field: 'ContactTitle', rowStart: 1, colStart: 4, colEnd: 6, width: '200px', resizable: true},
                    { field: 'Country', rowStart: 1, colStart: 6, colEnd: 7, width: '200px', resizable: true},
                    { field: 'Phone', rowStart: 2, colStart: 1, colEnd: 3, width: '200px', resizable: true},
                    { field: 'City', rowStart: 2, colStart: 3, colEnd: 5, resizable: true},
                    { field: 'Address', rowStart: 2, colStart: 5, colEnd: 7, width: '200px', resizable: true},
                    { field: 'CompanyName', rowStart: 3, colStart: 1, colEnd: 2, width: '200px', resizable: true},
                    { field: 'PostalCode', rowStart: 3, colStart: 2, colEnd: 3, width: '200px', resizable: true},
                    { field: 'Fax', rowStart: 3, colStart: 3, colEnd: 7},
                ]
            }];
            fixture.detectChanges();

            // CompanyName
            expect(grid.columns[7].width).toEqual('200px');
            expect(grid.columns[7].cells[0].value).toEqual('Alfreds Futterkiste');

            const groupRowBlocks = fixture.debugElement.query(By.css('.igx-grid__tbody')).queryAll(By.css('.igx-grid__mrl-block'));
            expect(groupRowBlocks[0].nativeElement.style.gridTemplateColumns).toEqual('200px 200px 700px 100px 100px 200px');

            const headerCells = fixture.debugElement.queryAll(By.css(GRID_COL_GROUP_THEAD));
            const headerResArea = headerCells[7].children[1].nativeElement;
            UIInteractions.simulateMouseEvent('mousedown', headerResArea, 450, 0);
            await wait(DEBOUNCE_TIME);
            fixture.detectChanges();

            const resizer = fixture.debugElement.queryAll(By.css(RESIZE_LINE_CLASS))[0].nativeElement;
            expect(resizer).toBeDefined();
            UIInteractions.simulateMouseEvent('mousemove', resizer, 550, 5);
            UIInteractions.simulateMouseEvent('mouseup', resizer, 550, 5);
            fixture.detectChanges();

            expect(groupRowBlocks[0].nativeElement.style.gridTemplateColumns).toEqual('300px 200px 600px 100px 100px 200px');
        });

        it('should correctly resize column that does not have width set, but is intersected by a column with width set', async() => {
            grid.width = 1500 + grid.scrollWidth + 'px';
            fixture.componentInstance.colGroups = [{
                group: 'group1',
                columns: [
                    { field: 'ContactName', rowStart: 1, colStart: 1, colEnd : 4, resizable: true},
                    { field: 'ContactTitle', rowStart: 1, colStart: 4, colEnd: 6, width: '200px', resizable: true},
                    { field: 'Country', rowStart: 1, colStart: 6, colEnd: 7, width: '200px', resizable: true},
                    { field: 'Phone', rowStart: 2, colStart: 1, colEnd: 3, width: '200px', resizable: true},
                    { field: 'City', rowStart: 2, colStart: 3, colEnd: 5, resizable: true},
                    { field: 'Address', rowStart: 2, colStart: 5, colEnd: 7, width: '200px', resizable: true},
                    { field: 'CompanyName', rowStart: 3, colStart: 1, colEnd: 2, width: '200px', resizable: true},
                    { field: 'PostalCode', rowStart: 3, colStart: 2, colEnd: 3, width: '200px', resizable: true},
                    { field: 'Fax', rowStart: 3, colStart: 3, colEnd: 7},
                ]
            }];
            fixture.detectChanges();

            // City
            expect(grid.columns[5].cells[0].value).toEqual('Berlin');

            const groupRowBlocks = fixture.debugElement.query(By.css('.igx-grid__tbody')).queryAll(By.css('.igx-grid__mrl-block'));
            expect(groupRowBlocks[0].nativeElement.style.gridTemplateColumns).toEqual('200px 200px 700px 100px 100px 200px');

            const headerCells = fixture.debugElement.queryAll(By.css(GRID_COL_GROUP_THEAD));
            const headerResArea = headerCells[5].children[1].nativeElement;
            UIInteractions.simulateMouseEvent('mousedown', headerResArea, 950, 0);
            await wait(DEBOUNCE_TIME);
            fixture.detectChanges();

            const resizer = fixture.debugElement.queryAll(By.css(RESIZE_LINE_CLASS))[0].nativeElement;
            expect(resizer).toBeDefined();
            UIInteractions.simulateMouseEvent('mousemove', resizer, 850, 5);
            UIInteractions.simulateMouseEvent('mouseup', resizer, 850, 5);
            fixture.detectChanges();

            // Small misalignment in the third column occurs when cols are being intersected.
            expect(groupRowBlocks[0].nativeElement.style.gridTemplateColumns).toEqual('200px 200px 640px 80px 100px 200px');
        });
    });
});

@Component({
    template: `
    <igx-grid #grid [data]="data" height="500px">
        <igx-column-layout *ngFor='let group of colGroups' [field]='group.group' [hidden]='group.hidden'>
            <igx-column *ngFor='let col of group.columns'
            [rowStart]="col.rowStart" [colStart]="col.colStart" [width]='col.width'
            [colEnd]="col.colEnd" [rowEnd]="col.rowEnd" [field]='col.field'></igx-column>
        </igx-column-layout>
    </igx-grid>
    `
})
export class ColumnLayouHidingTestComponent {
    @ViewChild(IgxGridComponent, { read: IgxGridComponent, static: true })
    grid: IgxGridComponent;
    cols1: Array<any> = [
        { field: 'ID', rowStart: 1, colStart: 1},
        { field: 'CompanyName', rowStart: 1, colStart: 2},
        { field: 'ContactName', rowStart: 1, colStart: 3},
        { field: 'ContactTitle', rowStart: 2, colStart: 1, rowEnd: 4, colEnd : 4},
    ];
    cols2: Array<any> = [
        { field: 'PostalCode', rowStart: 1, colStart: 1, colEnd: 3 },
        { field: 'City', rowStart: 2, colStart: 1},
        { field: 'Country', rowStart: 2, colStart: 2},
        { field: 'Address', rowStart: 3, colStart: 1, colEnd: 3}
    ];
    colGroups = [
        {
            group: 'group1',
            hidden: true,
            columns: this.cols2
        },
        {
            group: 'group2',
            hidden: false,
            columns: this.cols1
        }
    ];
    data = SampleTestData.contactInfoDataFull();
}

@Component({
    template: `
    <igx-grid #grid [data]="data" height="500px">
        <igx-column-layout *ngFor='let group of colGroups' [field]='group.group' [pinned]='group.pinned'>
            <igx-column *ngFor='let col of group.columns'
            [rowStart]="col.rowStart" [colStart]="col.colStart" [width]='col.width'
            [colEnd]="col.colEnd" [rowEnd]="col.rowEnd" [field]='col.field'></igx-column>
        </igx-column-layout>
    </igx-grid>
    `
})
export class ColumnLayoutPinningTestComponent {
    @ViewChild(IgxGridComponent, { read: IgxGridComponent, static: true })
    grid: IgxGridComponent;
    cols1: Array<any> = [
        { field: 'ID', rowStart: 1, colStart: 1},
        { field: 'CompanyName', rowStart: 1, colStart: 2},
        { field: 'ContactName', rowStart: 1, colStart: 3},
        { field: 'ContactTitle', rowStart: 2, colStart: 1, rowEnd: 4, colEnd : 4},
    ];
    cols2: Array<any> = [
        { field: 'PostalCode', rowStart: 1, colStart: 1, colEnd: 3 },
        { field: 'City', rowStart: 2, colStart: 1},
        { field: 'Country', rowStart: 2, colStart: 2},
        { field: 'Address', rowStart: 3, colStart: 1, colEnd: 3}
    ];
    colGroups = [
        {
            group: 'group1',
            pinned: true,
            columns: this.cols2
        },
        {
            group: 'group2',
            pinned: false,
            columns: this.cols1
        }
    ];
    data = SampleTestData.contactInfoDataFull();
}

@Component({
    template: `
    <igx-grid #grid [data]="data" height="500px" [allowFiltering]="true">
        <igx-column-layout *ngFor='let group of colGroups' [field]='group.group' [pinned]='group.pinned'>
            <igx-column *ngFor='let col of group.columns'
            [rowStart]="col.rowStart" [colStart]="col.colStart" [width]='col.width'
            [colEnd]="col.colEnd" [rowEnd]="col.rowEnd" [field]='col.field'></igx-column>
        </igx-column-layout>
    </igx-grid>
    `
})
export class ColumnLayoutFilteringTestComponent extends ColumnLayoutPinningTestComponent {
}

@Component({
    template: `
    <igx-grid #grid [data]="data" height="500px" displayDensity="compact">
        <igx-column-layout *ngFor='let group of colGroups' [field]='group.group' [pinned]='group.pinned'>
            <igx-column *ngFor='let col of group.columns'
            [rowStart]="col.rowStart" [colStart]="col.colStart" [width]='col.width'
            [colEnd]="col.colEnd" [rowEnd]="col.rowEnd" [field]='col.field' [groupable]="col.groupable"></igx-column>
        </igx-column-layout>
    </igx-grid>
    `
})
export class ColumnLayoutGroupingTestComponent extends ColumnLayoutPinningTestComponent {
    cols1: Array<any> = [
        { field: 'ID', rowStart: 1, colStart: 1},
        { field: 'CompanyName', rowStart: 1, colStart: 2, groupable: true},
        { field: 'ContactName', rowStart: 1, colStart: 3, groupable: true},
        { field: 'ContactTitle', rowStart: 2, colStart: 1, rowEnd: 4, colEnd : 4, groupable: true},
    ];
    cols2: Array<any> = [
        { field: 'PostalCode', rowStart: 1, colStart: 1, colEnd: 3 },
        { field: 'City', rowStart: 2, colStart: 1, groupable: true},
        { field: 'Country', rowStart: 2, colStart: 2, groupable: true},
        { field: 'Address', rowStart: 3, colStart: 1, colEnd: 3}
    ];
}
@Component({
    template: `
    <igx-grid #grid [data]="data" height="500px">
        <igx-column-layout *ngFor='let group of colGroups'>
            <igx-column *ngFor='let col of group.columns' [field]='col.field' [width]='col.width' [resizable]='col.resizable'
            [rowStart]="col.rowStart" [colStart]="col.colStart" [colEnd]="col.colEnd" [rowEnd]="col.rowEnd">
            </igx-column>
        </igx-column-layout>
    </igx-grid>
    `
})
export class ColumnLayoutResizingTestComponent {

    @ViewChild(IgxGridComponent, { read: IgxGridComponent, static: true })
    grid: IgxGridComponent;

    cols: Array<any> = [
        { field: 'ID', rowStart: 1, colStart: 1, resizable: true },
        { field: 'CompanyName', rowStart: 1, colStart: 2, resizable: true },
        { field: 'ContactName', rowStart: 1, colStart: 3, resizable: true },
        { field: 'ContactTitle', rowStart: 2, colStart: 1, rowEnd: 4, colEnd: 4, resizable: true },
    ];
    colGroups = [
        {
            group: 'group1',
            columns: this.cols
        }
    ];
    data = SampleTestData.contactInfoDataFull();
}
