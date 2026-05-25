/**
 * components/CalendarPicker.tsx  —  Popup calendar date picker
 *
 * A full-screen transparent Modal that renders a floating calendar card.
 * Tapping outside the card or pressing Clear/Today/a date dismisses it.
 *
 * Layout (top → bottom inside the card):
 *   1. Month + year header  — "May 2026 ▾" with prev / next chevron arrows
 *   2. Weekday header row   — Mo Tu We Th Fr Sa Su
 *   3. Day grid             — up to 6 rows × 7 cols; prev/next month days muted
 *   4. Footer row           — "Clear" on the left, "Today" on the right
 *
 * Props:
 *   @param visible   Whether the calendar overlay is shown
 *   @param value     Currently selected date in dd/mm/yyyy format (empty = none)
 *   @param onSelect  Called with the chosen date in dd/mm/yyyy format
 *   @param onClose   Called when the overlay or Clear/Today is tapped
 */

import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Weekday column headers — Monday-first order. */
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * parseValue
 * Converts a dd/mm/yyyy string to a dayjs object.
 * Returns null if the string is empty or malformed.
 */
const parseValue = (value: string): dayjs.Dayjs | null => {
  if (!value || value.length < 10) return null;
  const [d, m, y] = value.split("/");
  const parsed = dayjs(`${y}-${m}-${d}`);
  return parsed.isValid() ? parsed : null;
};

/**
 * CalendarCell
 * Represents one cell in the day grid.
 */
type CalendarCell = {
  day: number;
  /** "current" = belongs to the displayed month; "overflow" = spill from adjacent month */
  type: "current" | "overflow";
  /** Full dayjs date — used for selection comparison. */
  date: dayjs.Dayjs;
};

/**
 * buildGrid
 * Generates the 42-cell (6 rows × 7 cols) grid for a given year+month.
 * Cells are ordered Monday-first.
 */
const buildGrid = (year: number, month: number): CalendarCell[] => {
  const firstOfMonth = dayjs().year(year).month(month).date(1);
  const daysInMonth  = firstOfMonth.daysInMonth();

  // dayjs: 0 = Sunday → convert to Monday-first (Mon=0 … Sun=6)
  const startCol = (firstOfMonth.day() + 6) % 7;

  const cells: CalendarCell[] = [];

  // Leading overflow from the previous month
  const prevMonth = firstOfMonth.subtract(1, "month");
  const daysInPrev = prevMonth.daysInMonth();
  for (let i = startCol - 1; i >= 0; i--) {
    cells.push({
      day:  daysInPrev - i,
      type: "overflow",
      date: prevMonth.date(daysInPrev - i),
    });
  }

  // Days of the current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day:  d,
      type: "current",
      date: firstOfMonth.date(d),
    });
  }

  // Trailing overflow to fill out 42 cells
  const nextMonth = firstOfMonth.add(1, "month");
  let overflow = 1;
  while (cells.length < 42) {
    cells.push({
      day:  overflow,
      type: "overflow",
      date: nextMonth.date(overflow),
    });
    overflow++;
  }

  return cells;
};

// ─── CalendarPicker ───────────────────────────────────────────────────────────

/**
 * CalendarPickerProps
 * Props accepted by the CalendarPicker modal.
 */
interface CalendarPickerProps {
  visible:  boolean;
  value:    string;                   // dd/mm/yyyy or ""
  onSelect: (date: string) => void;   // called with dd/mm/yyyy
  onClose:  () => void;
}

/**
 * CalendarPicker
 * Floating calendar card rendered inside a transparent full-screen Modal.
 * Tapping the backdrop closes the picker without selecting a date.
 */
const CalendarPicker = ({
  visible,
  value,
  onSelect,
  onClose,
}: CalendarPickerProps) => {

  // ── View state ──────────────────────────────────────────────────────────────

  /** The month currently displayed in the calendar grid (0–11). */
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const parsed = parseValue(value);
    return parsed ? parsed.month() : dayjs().month();
  });

  /** The year currently displayed in the calendar grid. */
  const [viewYear, setViewYear] = useState<number>(() => {
    const parsed = parseValue(value);
    return parsed ? parsed.year() : dayjs().year();
  });

  // ── Derived values ──────────────────────────────────────────────────────────

  /** The currently selected date, or null. */
  const selectedDate = useMemo(() => parseValue(value), [value]);

  /** Today's date — used for the "today" ring. */
  const today = useMemo(() => dayjs().startOf("day"), []);

  /** 42-cell grid for the displayed month. */
  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  /** Month + year label shown in the header. */
  const headerLabel = useMemo(
    () => dayjs().year(viewYear).month(viewMonth).format("MMMM YYYY"),
    [viewYear, viewMonth]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  /** Navigate to the previous month. */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  /** Navigate to the next month. */
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  /**
   * handleDayPress
   * Formats the tapped cell's date as dd/mm/yyyy and calls onSelect.
   */
  const handleDayPress = (cell: CalendarCell) => {
    const formatted = cell.date.format("DD/MM/YYYY");
    onSelect(formatted);
    onClose();
  };

  /**
   * handleToday
   * Jumps the view to the current month and selects today's date.
   */
  const handleToday = () => {
    const now = dayjs();
    setViewYear(now.year());
    setViewMonth(now.month());
    onSelect(now.format("DD/MM/YYYY"));
    onClose();
  };

  /**
   * handleClear
   * Clears the selected date and closes the picker.
   */
  const handleClear = () => {
    onSelect("");
    onClose();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* ── Full-screen backdrop — tap to dismiss ─────────────────────────── */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}
        onPress={onClose}
      >
        {/* ── Calendar card — stopPropagation prevents backdrop dismiss ──── */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 16,
            width: 320,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
          }}
        >

          {/* ── Month / year header ──────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            {/* Month + year label */}
            <Text
              style={{
                fontSize: 15,
                color: colors.primary,
                fontFamily: "sans-semibold",
              }}
            >
              {headerLabel}
            </Text>

            {/* Prev / next chevrons */}
            <View style={{ flexDirection: "row", gap: 4 }}>
              <TouchableOpacity
                onPress={prevMonth}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="chevron-up" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={nextMonth}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Weekday header row ───────────────────────────────────────── */}
          <View style={{ flexDirection: "row", marginBottom: 6 }}>
            {WEEKDAYS.map((wd) => (
              <View key={wd} style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.mutedForeground,
                    fontFamily: "sans-semibold",
                  }}
                >
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Day grid — 6 rows × 7 cols ───────────────────────────────── */}
          {/*
           * Cells are rendered in groups of 7 (one row).
           * Each cell shows the day number inside an optional circle:
           *   - Gold filled  = selected date
           *   - Gold outline = today (when not selected)
           *   - Nothing      = normal
           * Overflow cells (prev/next month) use muted text.
           */}
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <View
              key={rowIndex}
              style={{ flexDirection: "row", marginBottom: 2 }}
            >
              {grid.slice(rowIndex * 7, rowIndex * 7 + 7).map((cell, colIndex) => {
                const isSelected = selectedDate?.isSame(cell.date, "day") ?? false;
                const isToday    = today.isSame(cell.date, "day");
                const isOverflow = cell.type === "overflow";

                return (
                  <TouchableOpacity
                    key={colIndex}
                    onPress={() => handleDayPress(cell)}
                    activeOpacity={0.7}
                    style={{ flex: 1, alignItems: "center", paddingVertical: 3 }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        // Gold filled for selected; gold outline for today
                        backgroundColor: isSelected ? colors.accent : "transparent",
                        borderWidth: isToday && !isSelected ? 1.5 : 0,
                        borderColor: colors.accent,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: isSelected ? "sans-bold" : "sans-regular",
                          color: isSelected
                            ? colors.background        // Dark text on gold
                            : isOverflow
                            ? colors.mutedForeground   // Muted for spill-over days
                            : colors.primary,          // Normal days
                        }}
                      >
                        {cell.day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* ── Footer: Clear + Today ────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 10,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={handleClear} hitSlop={8}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  fontFamily: "sans-medium",
                }}
              >
                Clear
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToday} hitSlop={8}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.accent,
                  fontFamily: "sans-semibold",
                }}
              >
                Today
              </Text>
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CalendarPicker;
