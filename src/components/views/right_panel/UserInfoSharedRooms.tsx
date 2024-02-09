/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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

import React from "react";
import { MatrixClientPeg } from "../../../MatrixClientPeg";
import Spinner from "../elements/Spinner";
import { _t } from "../../../languageHandler";
import { Pill, PillType } from "../../views/elements/Pill";
import AccessibleButton from "../../views/elements/AccessibleButton";
import MatrixToPermalinkConstructor from "../../../utils/permalinks/MatrixToPermalinkConstructor";
import UserInfoRoomTile from "../elements/UserInfoRoomTile";
import { RecentAlgorithm } from "../../../stores/room-list/algorithms/tag-sorting/RecentAlgorithm";
import { Room } from "matrix-js-sdk/src/models/room";
import { DefaultTagID } from "../../../stores/room-list/models";

interface IProps {
    userId: string;
    compact: boolean;
}

interface IState {
    rooms: Room[];
    error: boolean;
    showAll: boolean;
}

const LIMITED_VIEW_SHOW_COUNT = 3;

export default class UserInfoSharedRooms extends React.PureComponent<IProps, IState> {
    algorithm: RecentAlgorithm = new RecentAlgorithm();

    constructor(props: IProps) {
        super(props);
        this.algorithm = new RecentAlgorithm();
        this.state = {
            error: false,
            showAll: false,
            rooms: [],
        };
    }

    componentDidMount() {
        return this.componentDidUpdate();
    }

    async componentDidUpdate(prevProps?: IProps) {
        if (prevProps && prevProps.userId === this.props.userId) {
            // Nothing to update.
            return;
        }

        // Reset because this is a new user
        this.setState({
            error: false,
            showAll: false,
            rooms: [],
        });

        try {
            const peg = MatrixClientPeg.get()!;

            const roomIds = await peg._unstable_getSharedRooms(this.props.userId);
            const rooms = roomIds.map((roomId) => peg.getRoom(roomId)).filter((room) => room !== null).map(room => room!);
            this.setState({
                rooms: this.algorithm.sortRooms(rooms, DefaultTagID.Untagged),
            });
        } catch (ex) {
            console.log(`Failed to get shared rooms for ${this.props.userId}`, ex);
            this.setState({ error: true });
        }
    }

    private onShowMoreClick() {
        console.log("Showing more");
        this.setState({
            showAll: true,
        });
    }

    private renderRoomTile(room: Room) {
        // If the room has been upgraded, hide it.
        const tombstone = room.currentState.getStateEvents("m.room.tombstone", "");
        if (tombstone) {
            return null;
        }

        if (this.props.compact) {
            // XXX: This is inefficent as we only render LIMITED_VIEW_SHOW_COUNT rooms at a time, the other pills are wasted.
            const alias = room.getCanonicalAlias();
            if (!alias) {
                // Without an alias we get ugly room_ids, hide it.
                return null;
            }
            return (
                <a href={`#/room/${alias}`}>
                    <Pill
                        key={room.roomId}
                        type={PillType.RoomMention}
                        room={room}
                        url={new MatrixToPermalinkConstructor().forRoom(alias, [])}
                        inMessage={false}
                        shouldShowPillAvatar={true}
                    />
                </a>
            );
        }

        return (
            <li key={room.roomId}>
                <UserInfoRoomTile room={room} />
            </li>
        );
    }

    private renderRoomTiles() {
        // We must remove the null values in order for the slice to work in render()
        return this.state.rooms.map((room) => this.renderRoomTile(room)).filter((tile) => tile !== null) as JSX.Element[];
    }

    render(): React.ReactNode {
        let content: JSX.Element[] | undefined;
        let realCount = 0;

        if (this.state.rooms && this.state.rooms.length > 0) {
            content = this.renderRoomTiles();
            realCount = content.length;
            if (!this.state.showAll) {
                content = content.slice(0, LIMITED_VIEW_SHOW_COUNT);
            }
        } else if (this.state.rooms) {
            content = [<p> {_t("You share no rooms in common with this user.")} </p>];
        } else if (this.state.error) {
            content = [<p> {_t("There was an error fetching shared rooms with this user.")} </p>];
        } else {
            // We're still loading
            content = [<Spinner />];
        }

        // Compact view: Show as a single line.
        if (this.props.compact && content.length) {
            if (realCount <= content.length) {
                return <p> {_t("You are both participating in <rooms></rooms>", {}, { rooms: content })} </p>;
            } else {
                return (
                    <p>
                        {" "}
                        {_t(
                            "You are both participating in <rooms></rooms> and %(hidden)s more",
                            {
                                hidden: realCount - content.length,
                            },
                            {
                                rooms: content,
                            },
                        )}
                    </p>
                );
            }
        } else if (this.props.compact) {
            return content;
        }

        const canShowMore = !this.state.showAll && realCount > LIMITED_VIEW_SHOW_COUNT;
        // Normal view: Show as a list with a header
        return (
            <div className="mx_UserInfoSharedRooms mx_UserInfo_container">
                <h3>{_t("Shared Rooms")}</h3>
                <ul>{content}</ul>
                {canShowMore && (
                    <AccessibleButton className="mx_UserInfo_field" onClick={() => this.onShowMoreClick()}>
                        {_t("room_list|show_n_more", { count: realCount - content.length })}
                    </AccessibleButton>
                )}
            </div>
        );
    }
}
