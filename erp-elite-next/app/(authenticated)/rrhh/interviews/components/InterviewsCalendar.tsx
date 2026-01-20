
"use client"

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useRouter } from "next/navigation"

interface InterviewsCalendarProps {
    events: any[]
    onEventClick: (id: string) => void
}

export function InterviewsCalendar({ events, onEventClick }: InterviewsCalendarProps) {

    return (
        <div className="h-[700px] bg-white p-4 rounded-lg shadow-sm border">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                eventClick={(info) => {
                    onEventClick(info.event.id)
                }}
                locale="es"
                height="100%"
                eventContent={(arg) => {
                    return (
                        <div className="overflow-hidden text-xs px-1">
                            <div className="font-semibold truncate">{arg.event.title}</div>
                            {arg.view.type !== 'dayGridMonth' && (
                                <div className="text-[10px] opacity-90 truncate">
                                    {arg.event.extendedProps.interviewer}
                                </div>
                            )}
                        </div>
                    )
                }}
            />
            <style jsx global>{`
                .fc-button-primary {
                    background-color: #ca8a04 !important;
                    border-color: #ca8a04 !important;
                }
                .fc-button-primary:hover {
                    background-color: #a16207 !important;
                    border-color: #a16207 !important;
                }
                .fc-button-active {
                    background-color: #854d0e !important;
                    border-color: #854d0e !important;
                }
                .fc-event {
                    cursor: pointer;
                }
            `}</style>
        </div>
    )
}
