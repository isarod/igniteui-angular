import { RouterModule, Routes } from '@angular/router';
import { AvatartSampleComponent } from './avatar/avatar.sample';
import { BadgeSampleComponent } from './badge/badge.sample';
import { ButtonSampleComponent } from './button/button.sample';
import { CalendarSampleComponent } from './calendar/calendar.sample';
import { CardSampleComponent } from './card/card.sample';
import { CarouselSampleComponent } from './carousel/carousel.sample';
import { ChipsSampleComponent} from './chips/chips.sample';
import { ExpansionPanelSampleComponent } from './expansion-panel/expansion-panel-sample';
import { DatePickerSampleComponent } from './date-picker/date-picker.sample';
import { DialogSampleComponent } from './dialog/dialog.sample';
import { DragDropSampleComponent } from './drag-drop/drag-drop.sample';
import { MaskSampleComponent } from './mask/mask.sample';
import { IconSampleComponent } from './icon/icon.sample';
import { InputSampleComponent } from './input/input.sample';
import { InputGroupSampleComponent } from './input-group/input-group.sample';
import { LayoutSampleComponent } from './layout/layout.sample';
import { ListSampleComponent } from './list/list.sample';
import { ListPanningSampleComponent } from './list-panning/list-panning.sample';
import { ListPerformanceSampleComponent } from './list-performance/list-performance.sample';
import { NavbarSampleComponent } from './navbar/navbar.sample';
import { NavdrawerSampleComponent } from './navdrawer/navdrawer.sample';
import { ProgressbarSampleComponent } from './progressbar/progressbar.sample';
import { RippleSampleComponent } from './ripple/ripple.sample';
import { SliderSampleComponent } from './slider/slider.sample';
import { SnackbarSampleComponent } from './snackbar/snackbar.sample';
import { ColorsSampleComponent } from './styleguide/colors/color.sample';
import { ShadowsSampleComponent } from './styleguide/shadows/shadows.sample';
import { TypographySampleComponent } from './styleguide/typography/typography.sample';
import { BottomNavSampleComponent, CustomContentComponent } from './bottomnav/bottomnav.sample';
import { TabsSampleComponent } from './tabs/tabs.sample';
import { TimePickerSampleComponent } from './time-picker/time-picker.sample';
import { ToastSampleComponent } from './toast/toast.sample';
import { VirtualForSampleComponent } from './virtual-for-directive/virtual-for.sample';
import { GridCellEditingComponent } from './grid-cellEditing/grid-cellEditing.component';
import { GridSampleComponent } from './grid/grid.sample';
import { GridColumnMovingSampleComponent } from './grid-column-moving/grid-column-moving.sample';
import { GridColumnPinningSampleComponent } from './grid-column-pinning/grid-column-pinning.sample';
import { GridColumnResizingSampleComponent } from './grid-column-resizing/grid-column-resizing.sample';
import { GridGroupBySampleComponent } from './grid-groupby/grid-groupby.sample';
import { GridSummaryComponent } from './grid-summaries/grid-summaries.sample';
import { GridPerformanceSampleComponent } from './grid-performance/grid-performance.sample';
import { GridSelectionComponent } from './grid-selection/grid-selection.sample';
import { GridRowDraggableComponent } from './grid-row-draggable/grid-row-draggable.sample';
import { GridToolbarSampleComponent } from './grid-toolbar/grid-toolbar.sample';
import { GridToolbarCustomSampleComponent } from './grid-toolbar/grid-toolbar-custom.sample';
import { GridVirtualizationSampleComponent } from './grid-remote-virtualization/grid-remote-virtualization.sample';
import { ButtonGroupSampleComponent } from './buttonGroup/buttonGroup.sample';
import { GridColumnGroupsSampleComponent } from './grid-column-groups/grid-column-groups.sample';
import { DropDownSampleComponent } from './drop-down/drop-down.sample';
import { DropDownVirtualComponent } from './drop-down/drop-down-virtual/drop-down-virtual.component';
import { ComboSampleComponent } from './combo/combo.sample';
import { OverlaySampleComponent } from './overlay/overlay.sample';
import { OverlayAnimationSampleComponent } from './overlay/overlay-animation.sample';
import { RadioSampleComponent } from './radio/radio.sample';
import { TooltipSampleComponent } from './tooltip/tooltip.sample';
import { GridCellStylingSampleComponent } from './gird-cell-styling/grid-cell-styling.sample';
import { GridRowEditSampleComponent } from './grid-row-edit/grid-row-edit-sample.component';
import { TreeGridSampleComponent } from './tree-grid/tree-grid.sample';
import { TreeGridFlatDataSampleComponent } from './tree-grid-flat-data/tree-grid-flat-data.sample';
import { HierarchicalGridSampleComponent } from './hierarchical-grid/hierarchical-grid.sample';
import { HierarchicalGridRemoteSampleComponent } from './hierarchical-grid-remote/hierarchical-grid-remote.sample';
import { HierarchicalGridUpdatingSampleComponent } from './hierarchical-grid-updating/hierarchical-grid-updating.sample';
import { GridColumnPercentageWidthsSampleComponent } from './grid-percentage-columns/grid-percantge-widths.sample';
import { BannerSampleComponent } from './banner/banner.sample';
import { CalendarViewsSampleComponent } from './calendar-views/calendar-views.sample';
import { SelectSampleComponent } from './select/select.sample';
import { GridSearchComponent } from './grid-search/grid-search.sample';
import { AutocompleteSampleComponent } from './autocomplete/autocomplete.sample';
import { GridMRLSampleComponent } from './grid-multi-row-layout/grid-mrl.sample';
import { TreeGridLoadOnDemandSampleComponent } from './tree-grid-load-on-demand/tree-grid-load-on-demand.sample';
import { GridFilterTemplateSampleComponent } from './grid-filter-template/grid-filter-template.sample';
import { GridMRLConfigSampleComponent } from './grid-multi-row-layout-config/grid-mrl-config.sample';
import { GridMRLCustomNavigationSampleComponent } from './grid-mrl-custom-navigation/grid-mrl-custom-navigation';

const appRoutes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/avatar'
    },
    {
        path: 'autocomplete',
        component: AutocompleteSampleComponent
    },
    {
        path: 'avatar',
        component: AvatartSampleComponent
    },
    {
        path: 'badge',
        component: BadgeSampleComponent
    },
    {
        path: 'banner',
        component: BannerSampleComponent
    },
    {
        path: 'select',
        component: SelectSampleComponent
    },
    {
        path: 'buttons',
        component: ButtonSampleComponent
    },
    {
        path: 'calendar',
        component: CalendarSampleComponent
    },
    {
        path: 'calendar-views',
        component: CalendarViewsSampleComponent
    },
    {
        path: 'card',
        component: CardSampleComponent
    },
    {
        path: 'carousel',
        component: CarouselSampleComponent
    },
    {
        path: 'combo',
        component: ComboSampleComponent
    },
    {
        path: 'expansionPanel',
        component: ExpansionPanelSampleComponent
    },
    {
        path: 'chip',
        component: ChipsSampleComponent
    },
    {
        path: 'datePicker',
        component: DatePickerSampleComponent
    },
    {
        path: 'dialog',
        component: DialogSampleComponent
    },
    {
        path: 'dropDown',
        component: DropDownSampleComponent
    },
    {
        path: 'virtual-dropdown',
        component: DropDownVirtualComponent
    },
    {
        path: 'drag-drop',
        component: DragDropSampleComponent
    },
    {
        path: 'icon',
        component: IconSampleComponent
    },
    {
        path: 'lazyIconModule',
        loadChildren: () => import('./icon/LazyModule/lazyIcon.module').then(m => m.LazyIconModule)
    },
    {
        path: 'inputs',
        component: InputSampleComponent
    },
    {
        path: 'input-group',
        component: InputGroupSampleComponent
    },
    {
        path: 'layout',
        component: LayoutSampleComponent
    },
    {
        path: 'list',
        component: ListSampleComponent
    },
    {
        path: 'listPanning',
        component: ListPanningSampleComponent
    },
    {
        path: 'listPerformance',
        component: ListPerformanceSampleComponent
    },
    {
        path: 'mask',
        component: MaskSampleComponent
    },
    {
        path: 'navbar',
        component: NavbarSampleComponent
    },
    {
        path: 'navdrawer',
        component: NavdrawerSampleComponent
    },
    {
        path: 'overlay',
        component: OverlaySampleComponent
    },
    {
        path: 'overlay-animation',
        component: OverlayAnimationSampleComponent
    },
    {
        path: 'progressbar',
        component: ProgressbarSampleComponent
    },
    {
        path: 'radio',
        component: RadioSampleComponent
    },
    {
        path: 'ripple',
        component: RippleSampleComponent
    },
    {
        path: 'slider',
        component: SliderSampleComponent
    },
    {
        path: 'snackbar',
        component: SnackbarSampleComponent
    },

    {
        path: 'colors',
        component: ColorsSampleComponent
    },
    {
        path: 'shadows',
        component: ShadowsSampleComponent
    },
    {
        path: 'typography',
        component: TypographySampleComponent
    },
    {
        path: 'bottom-navigation',
        component: BottomNavSampleComponent
    },
    {
        path: 'tabs',
        component: TabsSampleComponent
    },
    {
        path: 'timePicker',
        component: TimePickerSampleComponent
    },
    {
        path: 'toast',
        component: ToastSampleComponent
    },
    {
        path: 'virtualForDirective',
        component: VirtualForSampleComponent
    },
    {
        path: 'gridCellEditing',
        component: GridCellEditingComponent
    },
    {
        path: 'gridConditionalCellStyling',
        component: GridCellStylingSampleComponent
    },
    {
        path: 'grid',
        component: GridSampleComponent
    },
    {
        path: 'gridFilterTemplate',
        component: GridFilterTemplateSampleComponent
    },
    {
        path: 'gridColumnMoving',
        component: GridColumnMovingSampleComponent
    },
    {
        path: 'gridColumnPinning',
        component: GridColumnPinningSampleComponent
    },
    {
        path: 'gridColumnResizing',
        component: GridColumnResizingSampleComponent
    },
    {
        path: 'gridSummary',
        component: GridSummaryComponent
    },
    {
        path: 'gridPerformance',
        component: GridPerformanceSampleComponent
    },
    {
        path: 'gridSelection',
        component: GridSelectionComponent
    },
    {
        path: 'gridRowDrag',
        component: GridRowDraggableComponent
    },
    {
        path: 'gridToolbar',
        component: GridToolbarSampleComponent
    },
    {
        path: 'gridToolbarCustom',
        component: GridToolbarCustomSampleComponent
    },
    {
        path: 'gridRemoteVirtualization',
        component: GridVirtualizationSampleComponent
    },
    {
        path: 'buttonGroup',
        component: ButtonGroupSampleComponent
    },
    {
        path: 'gridColumnGroups',
        component: GridColumnGroupsSampleComponent
    },
    {
        path: 'gridMRL',
        component: GridMRLSampleComponent
    },
    {
        path: 'gridMRLConfig',
        component: GridMRLConfigSampleComponent
    },
    {
        path: 'gridMRLCustomNav',
        component: GridMRLCustomNavigationSampleComponent
    },
    {
        path: 'gridGroupBy',
        component: GridGroupBySampleComponent
    },
    {
        path: 'gridRowEdit',
        component: GridRowEditSampleComponent
    },
    {
        path: 'treeGrid',
        component: TreeGridSampleComponent
    },
    {
        path: 'treeGridFlatData',
        component: TreeGridFlatDataSampleComponent
    },
    {
        path: 'treeGridLoadOnDemand',
        component: TreeGridLoadOnDemandSampleComponent
    },
    {
        path: 'tooltip',
        component: TooltipSampleComponent
    }, {
        path: 'hierarchicalGrid',
        component: HierarchicalGridSampleComponent
    }, {
        path: 'hierarchicalGridRemote',
        component: HierarchicalGridRemoteSampleComponent
    }, {
        path: 'hierarchicalGridUpdating',
        component: HierarchicalGridUpdatingSampleComponent
    },
    {
        path: 'gridPercentage',
        component: GridColumnPercentageWidthsSampleComponent
    },
    {
        path: 'gridSearch',
        component: GridSearchComponent
    }
];

export const routing = RouterModule.forRoot(appRoutes);
