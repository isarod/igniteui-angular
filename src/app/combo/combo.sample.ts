import { Component, ViewChild, OnInit, TemplateRef } from '@angular/core';
import { IgxComboComponent, IComboSelectionChangeEventArgs, DisplayDensity } from 'igniteui-angular';
import { take } from 'rxjs/operators';

const primitive = ['1', '2', '3', '4', '5', '6'];
const complex = [{
    field: 1,
    value: 1
}, {
    field: 2,
    value: 2
}, {
    field: 3,
    value: 3
}, {
    field: 4,
    value: 4
}, {
    field: 5,
    value: 5
}, {
    field: 6,
    value: 6
}];
@Component({
    // tslint:disable-next-line:component-selector
    selector: 'combo-sample',
    templateUrl: './combo.sample.html',
    styleUrls: ['combo.sample.css']
})
export class ComboSampleComponent implements OnInit {
    private width = '160px';
    @ViewChild(IgxComboComponent, { static: true }) public igxCombo: IgxComboComponent;
    @ViewChild('comboTemplate', { read: IgxComboComponent, static: false }) public comboTemplate: IgxComboComponent;
    public toggleItemState = false;
    private initData: any[] = [];
    public filterableFlag = true;
    public customValuesFlag = true;
    public items: any[] = [];
    public valueKeyVar = 'field';
    public currentDataType = '';
    @ViewChild('customItemTemplate', { read: TemplateRef, static: true })
    private customItemTemplate;
    private initialItemTemplate: TemplateRef<any> = null;

    comfortable = DisplayDensity.comfortable;
    cosy = DisplayDensity.cosy;
    compact = DisplayDensity.compact;


    constructor() {
        const division = {
            'New England 01': ['Connecticut', 'Maine', 'Massachusetts'],
            'New England 02': ['New Hampshire', 'Rhode Island', 'Vermont'],
            'Mid-Atlantic': ['New Jersey', 'New York', 'Pennsylvania'],
            'East North Central 02': ['Michigan', 'Ohio', 'Wisconsin'],
            'East North Central 01': ['Illinois', 'Indiana'],
            'West North Central 01': ['Missouri', 'Nebraska', 'North Dakota', 'South Dakota'],
            'West North Central 02': ['Iowa', 'Kansas', 'Minnesota'],
            'South Atlantic 01': ['Delaware', 'Florida', 'Georgia', 'Maryland'],
            'South Atlantic 02': ['North Carolina', 'South Carolina', 'Virginia'],
            'South Atlantic 03': ['District of Columbia', 'West Virginia'],
            'East South Central 01': ['Alabama', 'Kentucky'],
            'East South Central 02': ['Mississippi', 'Tennessee'],
            'West South Central': ['Arkansas', 'Louisiana', 'Oklahome', 'Texas'],
            'Mountain': ['Arizona', 'Colorado', 'Idaho', 'Montana', 'Nevada', 'New Mexico', 'Utah', 'Wyoming'],
            'Pacific 01': ['Alaska', 'California'],
            'Pacific 02': ['Hawaii', 'Oregon', 'Washington']
        };
        const keys = Object.keys(division);
        for (const key of keys) {
            division[key].map((e) => {
                this.items.push({
                    field: e,
                    region: key.substring(0, key.length - 3)
                });
                this.initData = this.items;
            });
        }
    }

    onSelection(ev) {
    }

    handleAddition(evt) {
        console.log(evt);
        evt.addedItem[this.igxCombo.groupKey] = 'MyCustomGroup';
    }

    toggleItem(itemID) {
        this.toggleItemState = !this.toggleItemState;
        this.igxCombo.setSelectedItem(itemID, this.toggleItemState);
    }

    ngOnInit() {
        this.igxCombo.onOpening.subscribe(() => {
            console.log('Opening log!');
        });

        this.igxCombo.onOpened.subscribe(() => {
            console.log('Opened log!');
        });

        this.igxCombo.onOpened.pipe(take(1)).subscribe(() => {
            console.log('Attaching');
            if (this.igxCombo.searchInput) {
                this.igxCombo.searchInput.nativeElement.onchange = (e) => {
                    console.log(e);
                };
            }
        });

        this.igxCombo.onClosing.subscribe(() => {
            console.log('Closing log!');
        });

        this.igxCombo.onClosed.subscribe(() => {
            console.log('Closed log!');
        });

        this.igxCombo.onSearchInput.subscribe((e) => {
            console.log(e);
        });
    }

    changeItemTemplate() {
        const comboTemplate = this.initialItemTemplate ? null : this.igxCombo.itemTemplate;
        this.igxCombo.itemTemplate = this.initialItemTemplate ? this.initialItemTemplate : this.customItemTemplate ;
        this.initialItemTemplate = comboTemplate;
    }

    setDensity(density: DisplayDensity) {
        this.igxCombo.displayDensity = density;
    }

    handleSelectionChange(event: IComboSelectionChangeEventArgs) {
        console.log(event);
    }
}
