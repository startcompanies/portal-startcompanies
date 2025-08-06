import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  day: number;
  available: boolean;
  selected: boolean;
  past: boolean;
  hasDot: boolean;
}

interface Timezone {
  name: string;
  time: string;
  offset: string;
}

@Component({
  selector: 'app-calendly-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendly-section.component.html',
  styleUrl: './calendly-section.component.css'
})
export class CalendlySectionComponent implements OnInit {
  currentDate: Date = new Date(2025, 5, 1); // Junio 2025
  currentMonthYear: string = '';
  weekDays: string[] = ['DOM.', 'LUN.', 'MAR.', 'MIE.', 'JUE.', 'VIE.', 'SÁB.'];
  calendarDays: CalendarDay[] = [];
  selectedDate: CalendarDay | null = null;
  
  selectedTimezone: string = 'Ciudad de México (11:38am)';
  showTimezoneDropdown: boolean = false;
  
  timezones: Timezone[] = [
    { name: 'Ciudad de México', time: '11:38am', offset: '-6' },
    { name: 'Nueva York', time: '1:38pm', offset: '-4' },
    { name: 'Los Ángeles', time: '10:38am', offset: '-7' },
    { name: 'Londres', time: '6:38pm', offset: '+1' },
    { name: 'Madrid', time: '7:38pm', offset: '+2' }
  ];

  ngOnInit(): void {
    this.updateCalendar();
  }

  updateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Actualizar el texto del mes y año
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    this.currentMonthYear = `${monthNames[month]} ${year}`;
    
    // Generar días del calendario
    this.generateCalendarDays(year, month);
  }

  generateCalendarDays(year: number, month: number): void {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Días disponibles para junio 2025 (como en la imagen)
    const availableDays = [19, 20, 23, 24, 25, 26, 27, 30];
    const daysWithDot = [18];
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayNumber = currentDate.getDate();
      const isCurrentMonth = currentDate.getMonth() === month;
      const isPast = currentDate < today && currentDate.getMonth() === month;
      const isAvailable = availableDays.includes(dayNumber) && isCurrentMonth && !isPast;
      const hasDot = daysWithDot.includes(dayNumber) && isCurrentMonth;
      
      if (isCurrentMonth) {
        this.calendarDays.push({
          day: dayNumber,
          available: isAvailable,
          selected: false,
          past: isPast,
          hasDot: hasDot
        });
      } else {
        this.calendarDays.push({
          day: dayNumber,
          available: false,
          selected: false,
          past: true,
          hasDot: false
        });
      }
    }
  }

  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.updateCalendar();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.updateCalendar();
  }

  selectDate(day: CalendarDay): void {
    if (!day.available || day.past) return;
    
    // Deseleccionar fecha anterior
    this.calendarDays.forEach(d => d.selected = false);
    
    // Seleccionar nueva fecha
    day.selected = true;
    this.selectedDate = day;
  }

  toggleTimezoneDropdown(): void {
    this.showTimezoneDropdown = !this.showTimezoneDropdown;
  }

  selectTimezone(timezone: Timezone): void {
    this.selectedTimezone = `${timezone.name} (${timezone.time})`;
    this.showTimezoneDropdown = false;
  }
}
