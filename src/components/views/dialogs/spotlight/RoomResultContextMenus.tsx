/*
Copyright 2021-2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import classNames from "classnames";
import { Room } from "matrix-js-sdk/src/matrix";
import React, { Fragment, useState } from "react";

import { ContextMenuTooltipButton } from "../../../../accessibility/context_menu/ContextMenuTooltipButton";
import { useNotificationState } from "../../../../hooks/useRoomNotificationState";
import { _t } from "../../../../languageHandler";
import { RoomNotifState } from "../../../../RoomNotifs";
import { RoomGeneralContextMenu } from "../../context_menus/RoomGeneralContextMenu";
import { RoomNotificationContextMenu } from "../../context_menus/RoomNotificationContextMenu";
import SpaceContextMenu from "../../context_menus/SpaceContextMenu";
import { ButtonEvent } from "../../elements/AccessibleButton";
import { contextMenuBelow } from "../../rooms/RoomTile";

interface Props {
    room: Room;
}

export function RoomResultContextMenus({ room }: Props) {
    const [notificationState] = useNotificationState(room);

    const [generalMenuPosition, setGeneralMenuPosition] = useState<DOMRect | null>(null);
    const [notificationMenuPosition, setNotificationMenuPosition] = useState<DOMRect | null>(null);

    let generalMenu: JSX.Element;
    if (generalMenuPosition !== null) {
        if (room.isSpaceRoom()) {
            generalMenu = (
                <SpaceContextMenu
                    {...contextMenuBelow(generalMenuPosition)}
                    space={room}
                    onFinished={() => setGeneralMenuPosition(null)}
                />
            );
        } else {
            generalMenu = (
                <RoomGeneralContextMenu
                    {...contextMenuBelow(generalMenuPosition)}
                    room={room}
                    onFinished={() => setGeneralMenuPosition(null)}
                />
            );
        }
    }

    let notificationMenu: JSX.Element;
    if (notificationMenuPosition !== null) {
        notificationMenu = (
            <RoomNotificationContextMenu
                {...contextMenuBelow(notificationMenuPosition)}
                room={room}
                onFinished={() => setNotificationMenuPosition(null)}
            />
        );
    }

    const notificationMenuClasses = classNames("mx_SpotlightDialog_option--notifications", {
        // Show bell icon for the default case too.
        mx_RoomNotificationContextMenu_iconBell: notificationState === RoomNotifState.AllMessages,
        mx_RoomNotificationContextMenu_iconBellDot: notificationState === RoomNotifState.AllMessagesLoud,
        mx_RoomNotificationContextMenu_iconBellMentions: notificationState === RoomNotifState.MentionsOnly,
        mx_RoomNotificationContextMenu_iconBellCrossed: notificationState === RoomNotifState.Mute,
    });

    return (
        <Fragment>
            <ContextMenuTooltipButton
                className="mx_SpotlightDialog_option--menu"
                onClick={(ev: ButtonEvent) => {
                    ev.preventDefault();
                    ev.stopPropagation();

                    const target = ev.target as HTMLElement;
                    setGeneralMenuPosition(target.getBoundingClientRect());
                }}
                title={room.isSpaceRoom() ? _t("Space options") : _t("Room options")}
                isExpanded={generalMenuPosition !== null}
            />
            {!room.isSpaceRoom() && (
                <ContextMenuTooltipButton
                    className={notificationMenuClasses}
                    onClick={(ev: ButtonEvent) => {
                        ev.preventDefault();
                        ev.stopPropagation();

                        const target = ev.target as HTMLElement;
                        setNotificationMenuPosition(target.getBoundingClientRect());
                    }}
                    title={_t("Notification options")}
                    isExpanded={notificationMenuPosition !== null}
                />
            )}
            {generalMenu}
            {notificationMenu}
        </Fragment>
    );
}
