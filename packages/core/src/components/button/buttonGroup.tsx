/*
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
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

import { type Alignment, Classes } from "../../common";
import { DISPLAYNAME_PREFIX, type HTMLDivProps, type Props } from "../../common/props";

export interface ButtonGroupProps extends Props, HTMLDivProps, React.RefAttributes<HTMLDivElement> {
    /**
     * Text alignment within button. By default, icons and text will be centered
     * within the button. Passing `"left"` or `"right"` will align the button
     * text to that side and push `icon` and `rightIcon` to either edge. Passing
     * `"center"` will center the text and icons together.
     */
    alignText?: Alignment;

    /** Buttons in this group. */
    children: React.ReactNode;

    /**
     * Whether the button group should take up the full width of its container.
     *
     * @default false
     */
    fill?: boolean;

    /**
     * Whether the child buttons should appear with minimal styling.
     *
     * @default false
     */
    minimal?: boolean;

    /**
     * Whether the child buttons should use outlined styles.
     *
     * @default false
     */
    outlined?: boolean;

    /**
     * Whether the child buttons should appear with large styling.
     *
     * @default false
     */
    large?: boolean;

    /**
     * Whether the button group should appear with vertical styling.
     *
     * @default false
     */
    vertical?: boolean;
}

// this component is simple enough that tests would be purely tautological.
/* istanbul ignore next */
/**
 * Button group component.
 *
 * @see https://blueprintjs.com/docs/#core/components/button-group
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
    (props, ref) => {
        const { alignText, className, fill, minimal, outlined, large, vertical, ...htmlProps } = props;
        const buttonGroupClasses = classNames(
            Classes.BUTTON_GROUP,
            {
                [Classes.FILL]: fill,
                [Classes.LARGE]: large,
                [Classes.MINIMAL]: minimal,
                [Classes.OUTLINED]: outlined,
                [Classes.VERTICAL]: vertical,
            },
            Classes.alignmentClass(alignText),
            className,
        );
        return (
            <div {...htmlProps} ref={ref} className={buttonGroupClasses}>
                {props.children}
            </div>
        );
    },
);
ButtonGroup.displayName = `${DISPLAYNAME_PREFIX}.ButtonGroup`;
