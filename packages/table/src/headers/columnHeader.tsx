/*
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import classNames from "classnames";
import * as React from "react";

import * as Classes from "../common/classes";
import type { ColumnIndices } from "../common/grid";
import { Utils } from "../common/index";
import type { ClientCoordinates } from "../interactions/dragTypes";
import type { IndexedResizeCallback } from "../interactions/resizable";
import { Orientation } from "../interactions/resizeHandle";
import { RegionCardinality, Regions } from "../regions";

import { ColumnHeaderCell, type ColumnHeaderCellProps } from "./columnHeaderCell";
import { Header, type HeaderProps } from "./header";

export type ColumnHeaderRenderer = (columnIndex: number) => React.ReactElement<ColumnHeaderCellProps> | null;

export interface ColumnWidths {
    minColumnWidth: number;
    maxColumnWidth: number;
    defaultColumnWidth: number;
}

export interface ColumnHeaderProps extends HeaderProps, ColumnWidths, ColumnIndices {
    /**
     * A ColumnHeaderRenderer that, for each `<Column>`, will delegate to:
     * 1. The `columnHeaderCellRenderer` method from the `<Column>`
     * 2. A `<ColumnHeaderCell>` using the `name` prop from the `<Column>`
     * 3. A `<ColumnHeaderCell>` with a `name` generated from `Utils.toBase26Alpha`
     */
    cellRenderer: ColumnHeaderRenderer;

    /**
     * Ref handler that receives the HTML element that should be measured to
     * indicate the fluid height of the column header.
     */
    measurableElementRef?: React.Ref<HTMLDivElement>;

    /**
     * A callback invoked when user is done resizing the column
     */
    onColumnWidthChanged: IndexedResizeCallback;

    /**
     * Called on component mount.
     */
    onMount?: (whichHeader: "column" | "row") => void;
}

export class ColumnHeader extends React.Component<ColumnHeaderProps> {
    public static defaultProps = {
        isReorderable: false,
        isResizable: true,
        loading: false,
    };

    public componentDidMount() {
        this.props.onMount?.("column");
    }

    public render() {
        const {
            // from ColumnHeaderProps
            cellRenderer: renderHeaderCell,
            onColumnWidthChanged,

            // from ColumnWidths
            minColumnWidth: minSize,
            maxColumnWidth: maxSize,
            defaultColumnWidth,

            // from ColumnIndices
            columnIndexStart: indexStart,
            columnIndexEnd: indexEnd,

            // from HeaderProps
            ...spreadableProps
        } = this.props;

        return (
            <Header
                convertPointToIndex={this.convertPointToColumn}
                fullRegionCardinality={RegionCardinality.FULL_COLUMNS}
                getCellExtremaClasses={this.getCellExtremaClasses}
                getCellIndexClass={Classes.columnCellIndexClass}
                getCellSize={this.getColumnWidth}
                getDragCoordinate={this.getDragCoordinate}
                getIndexClass={Classes.columnIndexClass}
                getMouseCoordinate={this.getMouseCoordinate}
                ghostCellRenderer={this.renderGhostCell}
                handleResizeDoubleClick={this.handleResizeDoubleClick}
                handleResizeEnd={this.handleResizeEnd}
                handleSizeChanged={this.handleSizeChanged}
                headerCellIsReorderablePropName="enableColumnReordering"
                headerCellIsSelectedPropName="isColumnSelected"
                headerCellRenderer={renderHeaderCell}
                indexEnd={indexEnd}
                indexStart={indexStart}
                isCellSelected={this.isCellSelected}
                isGhostIndex={this.isGhostIndex}
                maxSize={maxSize}
                minSize={minSize}
                resizeOrientation={Orientation.VERTICAL}
                selectedRegions={[]}
                toRegion={this.toRegion}
                wrapCells={this.wrapCells}
                {...spreadableProps}
            />
        );
    }

    private wrapCells = (cells: Array<React.ReactElement<any>>) => {
        const { columnIndexStart, grid } = this.props;

        const tableWidth = grid.getRect().width;
        const scrollLeftCorrection = this.props.grid.getCumulativeWidthBefore(columnIndexStart);
        const style: React.CSSProperties = {
            // only header cells in view will render, but we need to reposition them to stay in view
            // as we scroll horizontally.
            transform: `translateX(${scrollLeftCorrection || 0}px)`,
            // reduce the width to clamp the sliding window as we approach the final headers; otherwise,
            // we'll have tons of useless whitespace at the end.
            width: tableWidth - scrollLeftCorrection,
        };

        const classes = classNames(Classes.TABLE_THEAD, Classes.TABLE_COLUMN_HEADER_TR);

        // add a wrapper set to the full-table width to ensure container styles stretch from the first
        // cell all the way to the last
        return (
            <div style={{ width: tableWidth }}>
                <div style={style} className={classes} ref={this.props.measurableElementRef}>
                    {cells}
                </div>
            </div>
        );
    };

    private convertPointToColumn = (clientXOrY: number, useMidpoint?: boolean) => {
        return this.props.locator.convertPointToColumn(clientXOrY, useMidpoint);
    };

    private getCellExtremaClasses = (index: number, indexEnd: number) => {
        return this.props.grid.getExtremaClasses(0, index, 1, indexEnd);
    };

    private getColumnWidth = (index: number) => {
        return this.props.grid.getColumnRect(index).width;
    };

    private getDragCoordinate = (clientCoords: ClientCoordinates) => {
        return clientCoords[0]; // x-coordinate
    };

    private getMouseCoordinate = (event: MouseEvent) => {
        return event.clientX;
    };

    private handleResizeEnd = (index: number, size: number) => {
        this.props.onResizeGuide(null);
        this.props.onColumnWidthChanged(index, size);
    };

    private handleResizeDoubleClick = (index: number) => {
        const { minColumnWidth, maxColumnWidth } = this.props;

        const width = this.props.locator.getWidestVisibleCellInColumn(index);
        const clampedWidth = Utils.clamp(width, minColumnWidth, maxColumnWidth);

        this.props.onResizeGuide(null);
        this.props.onColumnWidthChanged(index, clampedWidth);
    };

    private handleSizeChanged = (index: number, size: number) => {
        const rect = this.props.grid.getColumnRect(index);
        this.props.onResizeGuide([rect.left + size]);
    };

    private isCellSelected = (index: number) => {
        return Regions.hasFullColumn(this.props.selectedRegions!, index);
    };

    private isGhostIndex = (index: number) => {
        return this.props.grid.isGhostIndex(-1, index);
    };

    private renderGhostCell = (index: number, extremaClasses: string[]) => {
        const { grid, loading } = this.props;
        const rect = grid.getGhostCellRect(0, index);
        const style = {
            flexBasis: `${rect.width}px`,
            width: `${rect.width}px`,
        };
        return (
            <ColumnHeaderCell
                className={classNames(extremaClasses)}
                index={index}
                key={Classes.columnIndexClass(index)}
                loading={loading}
                style={style}
            />
        );
    };

    private toRegion = (index1: number, index2?: number) => {
        return Regions.column(index1, index2);
    };
}
