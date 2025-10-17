import React, { useMemo, useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import "./styles.css";

const classNames = (...classes) => classes.filter(Boolean).join(" ");

const weekdayLabels = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export function Calendar({
  value,
  onSelect,
  dateCellRender,
  disabledDate,
  className = "",
}) {
  const selectedDate = value && dayjs(value).isValid() ? dayjs(value) : null;
  const [currentMonth, setCurrentMonth] = useState(
    (selectedDate || dayjs()).startOf("month")
  );

  useEffect(() => {
    if (selectedDate && !selectedDate.isSame(currentMonth, "month")) {
      setCurrentMonth(selectedDate.startOf("month"));
    }
  }, [selectedDate, currentMonth]);

  const startOfGrid = useMemo(
    () => currentMonth.startOf("week"),
    [currentMonth]
  );

  const calendarDays = useMemo(() => {
    return Array.from({ length: 42 }, (_, index) => startOfGrid.add(index, "day"));
  }, [startOfGrid]);

  const handleSelect = useCallback(
    (date) => {
      if (!date || !date.isValid()) return;
      if (disabledDate?.(date)) return;
      if (!date.isSame(currentMonth, "month")) {
        setCurrentMonth(date.startOf("month"));
      }
      onSelect?.(date);
    },
    [currentMonth, disabledDate, onSelect]
  );

  const monthLabel = currentMonth.format("MMMM YYYY");

  return (
    <div className={classNames("rck-calendar", className)}>
      <div className="rck-calendar__header">
        <button
          type="button"
          className="rck-calendar__nav"
          aria-label="Previous month"
          onClick={() => setCurrentMonth((prev) => prev.subtract(1, "month"))}
        >
          ‹
        </button>
        <div className="rck-calendar__month">{monthLabel}</div>
        <button
          type="button"
          className="rck-calendar__nav"
          aria-label="Next month"
          onClick={() => setCurrentMonth((prev) => prev.add(1, "month"))}
        >
          ›
        </button>
      </div>

      <div className="rck-calendar__grid rck-calendar__grid--labels">
        {weekdayLabels.map((label) => (
          <div key={label} className="rck-calendar__weekday">
            {label}
          </div>
        ))}
      </div>

      <div className="rck-calendar__grid">
        {calendarDays.map((date) => {
          const isOutside = !date.isSame(currentMonth, "month");
          const isToday = date.isSame(dayjs(), "day");
          const isSelected = selectedDate?.isSame(date, "day");
          const isDisabled = disabledDate?.(date) ?? false;

          return (
            <button
              key={date.format("YYYY-MM-DD")}
              type="button"
              className={classNames(
                "rck-calendar__cell",
                isOutside && "rck-calendar__cell--outside",
                isToday && "rck-calendar__cell--today",
                isSelected && "rck-calendar__cell--selected",
                isDisabled && "rck-calendar__cell--disabled"
              )}
              onClick={() => handleSelect(date)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSelect(date);
                }
              }}
              disabled={isDisabled}
            >
              <div className="rck-calendar__cell-inner">
                <div className="rck-calendar__date">{date.date()}</div>
                <div className="rck-calendar__content">
                  {dateCellRender?.(date)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;

