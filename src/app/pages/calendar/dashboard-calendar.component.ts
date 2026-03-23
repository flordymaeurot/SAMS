import { Component, Input, OnInit, signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

@Component({
  selector: 'dashboard-calendar',
  standalone: true,
  imports: [CommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <div class="dashboard-calendar-container">
      <full-calendar [options]="calendarOptions()"></full-calendar>
    </div>
  `,
  styleUrls: ['./dashboard-calendar.component.css']
})
export class DashboardCalendarComponent implements OnInit {
  @Input() events: EventInput[] = [];

  calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: ''
    },
    contentHeight: 'auto',
    height: 'auto',
    editable: false,
    selectable: false,
    dayMaxEvents: 2,
    events: []
  });

  ngOnInit() {
    this.calendarOptions.update(options => ({
      ...options,
      events: this.events
    }));
  }
}
