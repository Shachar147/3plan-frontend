import {SidebarEvent} from "../../../utils/interfaces";
import React, {useContext} from "react";
import ReactModalService from "../../../services/react-modal-service";
import {getDurationString} from "../../../utils/time-utils";
import {getClasses} from "../../../utils/utils";
import TranslateService from "../../../services/translate-service";
import {observer} from "mobx-react";
import {modalsStoreContext} from "../../../stores/modals-store";
import {eventStoreContext} from "../../../stores/events-store";
import {runInAction} from "mobx";

interface TriplanSidebarDraggableEventProps {
    event: SidebarEvent;
    categoryId: number;
    removeEventFromSidebarById: (eventId: string) => Promise<Record<number, SidebarEvent[]>>;
    addToEventsToCategories: (event: SidebarEvent) => void;
    fullActions?: boolean;
    eventTitleSuffix?: React.ReactNode | string | undefined;
    _onClick?: () => void;
    addEventToSidebar: (event: SidebarEvent) => void;
}

function TriplanSidebarDraggableEvent(props: TriplanSidebarDraggableEventProps) {
    const {
        event,
        categoryId,
        removeEventFromSidebarById,
        addToEventsToCategories,
        fullActions = true,
        eventTitleSuffix = undefined,
        _onClick
    } = props;

    const eventStore = useContext(eventStoreContext);
    const modalsStore = useContext(modalsStoreContext);

    const onClick = () => {
        if (_onClick) {
            _onClick();
        } else {

            const eventId = event.id;
            const isCalendarEvent = !!eventStore.calendarEvents.find((c) => c.id.toString() == eventId.toString());
            if (isCalendarEvent) {
                const info = {
                    event: {
                        _def: {
                            publicId: event.id
                        },
                        extendedProps: {},
                        ...event,
                        start: new Date(event.start),
                        end: new Date(event.end)
                    }
                };
                runInAction(() => {
                    eventStore.isModalMinimized = false;
                    modalsStore.switchToEditMode();
                });
                ReactModalService.openEditCalendarEventModal(
                    eventStore,
                    undefined,
                    info,
                    modalsStore
                );
                return;
            }

            modalsStore.switchToViewMode();
            ReactModalService.openEditSidebarEventModal(
                eventStore,
                event,
                removeEventFromSidebarById,
                addToEventsToCategories,
                modalsStore
            );
        }
    };

    return (
        <div
            className={`fc-event flex-col align-items-start priority-${event.priority}`}
            title={event.title}
            data-id={event.id}
            data-duration={event.duration}
            data-category={categoryId}
            data-icon={event.icon}
            data-description={event.description}
            data-priority={event.priority}
            data-preferred-time={event.preferredTime}
            data-location={Object.keys(event).includes('location') ? JSON.stringify(event.location) : undefined}
            data-opening-hours={
                // used to be simply event.openingHours
                Object.keys(event).includes('openingHours') ? JSON.stringify(event.openingHours) : undefined
            }
            data-images={event.images} // add column 3
            data-price={event.price}
            data-currency={event.currency}
            data-more-info={event.moreInfo}
            key={event.id}
        >
            <div className="flex-row gap-5 align-items-start width-100-percents">
                <span className="sidebar-event-icon flex-grow-0">
                    {event.icon || eventStore.categoriesIcons[categoryId]}
                </span>
                <span className="sidebar-event-title-container" title={TranslateService.translate(eventStore, 'MODALS.EDIT')} onClick={onClick}>
                    <span className="sidebar-event-title-text">
                        {TranslateService.translate(eventStore, 'EVENT_NAME_WITH_DURATION', {
                            name: event.title,
                            duration: getDurationString(eventStore, event.duration)
                        })}
                    </span>
                </span>
                {fullActions && (
                    <div
                        className={getClasses('fc-duplicate-event', eventStore.isTripLocked && 'display-none')}
                        onClick={() => {
                            ReactModalService.openDuplicateSidebarEventModal(eventStore, event);
                        }}
                    >
                        <img
                            title={TranslateService.translate(eventStore, 'DUPLICATE')}
                            alt={TranslateService.translate(eventStore, 'DUPLICATE')}
                            src="/images/duplicate.png"
                        />
                    </div>
                )}
                {fullActions && (
                    <a
                        title={TranslateService.translate(eventStore, 'DELETE')}
                        className={getClasses('fc-remove-event', eventStore.isTripLocked && 'display-none')}
                        onClick={() => {
                            ReactModalService.openDeleteSidebarEventModal(
                                eventStore,
                                removeEventFromSidebarById,
                                event
                            );
                        }}
                    >
                        X
                    </a>
                )}
            </div>
            {eventTitleSuffix != undefined ? (
                <div className="flex-row align-items-start width-100-percents" onClick={onClick}>
                    {eventTitleSuffix}
                </div>
            ) : undefined}
        </div>
    );
}

export default observer(TriplanSidebarDraggableEvent);