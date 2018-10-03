import { IgxExporterOptionsBase } from '../exporter-common/exporter-options-base';

/**
 * Objects of this class are used to configure the Excel exporting process.
 */
export class IgxExcelExporterOptions extends IgxExporterOptionsBase {
    private _columnWidth: number;
    private _rowHeight: number;

    /**
     * Specifies if column pinning should be ignored. If ignoreColumnsOrder is set to true,
     * this option will always be considered as set to true.
     */
    public ignorePinning = false;

    /**
     * Specifies whether the exported data should be formatted as Excel table. (True by default)
     */
    public exportAsTable = true;

    constructor(fileName: string) {
        super(fileName, '.xlsx');
    }

    /**
     * Gets the width of the columns in the exported excel file.
     */
    public get columnWidth(): number {
        return this._columnWidth;
    }

    /**
     * Sets the width of the columns in the exported excel file. If left unspecified or 0,
     * the width of the largest string in the column will be used.
     */
    public set columnWidth(value: number) {
        if (value < 0) {
            throw Error('Invalid value for column width!');
        }

        this._columnWidth = value;
    }

    /**
     * Gets the height of the rows in the exported excel file.
     */
    public get rowHeight(): number {
        return this._rowHeight;
    }

    /**
     * Sets the height of the rows in the exported excel file. If left unspecified or 0,
     * the default height of the excel rows will be used.
     */
    public set rowHeight(value: number) {
        if (value < 0) {
            throw Error('Invalid value for row height!');
        }

        this._rowHeight = value;
    }
}
