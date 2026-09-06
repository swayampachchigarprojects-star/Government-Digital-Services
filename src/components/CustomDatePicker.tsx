import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

export interface CustomDatePickerProps {
  label?: string;
  value: string;
  placeholder?: string;
  onSelect: (date: string) => void;
  visible?: boolean;
  setVisible?: (visible: boolean) => void;
  error?: string;
  disabled?: boolean;
  modalTitle?: string;
  maxDate?: Date;
}

export function CustomDatePicker({
  label,
  value,
  placeholder = 'YYYY-MM-DD',
  onSelect,
  visible: controlledVisible,
  setVisible: controlledSetVisible,
  error,
  disabled = false,
  modalTitle,
  maxDate,
}: CustomDatePickerProps) {
  const { t } = useLanguage();
  const [internalVisible, setInternalVisible] = useState(false);

  const isControlled = controlledVisible !== undefined && controlledSetVisible !== undefined;
  const isVisible = isControlled ? controlledVisible : internalVisible;
  const setOpen = (open: boolean) => {
    if (isControlled) {
      controlledSetVisible(open);
    } else {
      setInternalVisible(open);
    }
  };

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isVisible) {
      if (value) {
        const parts = value.split('-');
        if (parts.length === 3) {
          setCurrentYear(parseInt(parts[0], 10));
          setCurrentMonth(parseInt(parts[1], 10) - 1);
        }
      } else {
        const today = new Date();
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
      }
    }
  }, [isVisible, value]);

  const monthNames = [
    t('Jan'), t('Feb'), t('Mar'), t('Apr'),
    t('May'), t('Jun'), t('Jul'), t('Aug'),
    t('Sep'), t('Oct'), t('Nov'), t('Dec')
  ];

  const daysOfWeek = [
    t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat')
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (maxDate) {
      if (
        currentYear > maxDate.getFullYear() ||
        (currentYear === maxDate.getFullYear() && currentMonth >= maxDate.getMonth())
      ) {
        return;
      }
    }
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Grid calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ key: `blank-${i}`, dayNum: null });
  }

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(currentYear, currentMonth, d);
    cellDate.setHours(0, 0, 0, 0);
    const isFuture = maxDate ? cellDate > todayDate : false;

    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const isSelected = value === dateStr;

    calendarCells.push({
      key: `day-${d}`,
      dayNum: d,
      dateStr,
      isSelected,
      isFuture,
    });
  }

  const getDisplayValue = () => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${monthNames[mIdx] || ''} ${y}`;
    }
    return value;
  };

  return (
    <View style={styles.dropdownContainer}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          isVisible && styles.dropdownTriggerActive,
          !!error && styles.dropdownTriggerError,
          disabled && styles.dropdownTriggerDisabled,
        ]}
        onPress={() => {
          if (!disabled) setOpen(true);
        }}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}>
          {getDisplayValue() || placeholder}
        </Text>
        <MaterialIcons name="date-range" size={22} color={disabled ? '#BAC4D0' : '#697788'} />
      </TouchableOpacity>
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.datePickerModalContent}>
            {/* Modal Header */}
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>
                {modalTitle || label || t('Select Date')}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color="#173B63" />
              </TouchableOpacity>
            </View>

            {/* Calendar Header Navigation */}
            <View style={styles.calendarNavHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn}>
                <MaterialIcons name="chevron-left" size={24} color="#0B5CAD" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn}>
                <MaterialIcons name="chevron-right" size={24} color="#0B5CAD" />
              </TouchableOpacity>
            </View>

            {/* Days of Week Header */}
            <View style={styles.weekHeadersRow}>
              {daysOfWeek.map((day, idx) => (
                <Text key={idx} style={styles.weekHeaderCell}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid cells */}
            <View style={styles.calendarGrid}>
              {calendarCells.map((cell) => {
                if (cell.dayNum === null) {
                  return <View key={cell.key} style={styles.calendarCellBlank} />;
                }
                return (
                  <TouchableOpacity
                    key={cell.key}
                    style={[
                      styles.calendarCell,
                      cell.isSelected && styles.calendarCellSelected,
                      cell.isFuture && styles.calendarCellDisabled,
                    ]}
                    disabled={cell.isFuture}
                    onPress={() => {
                      onSelect(cell.dateStr);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        cell.isSelected && styles.calendarCellTextSelected,
                        cell.isFuture && styles.calendarCellTextDisabled,
                      ]}
                    >
                      {cell.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#173B63',
    marginBottom: 6,
  },
  dropdownTrigger: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dropdownTriggerActive: {
    borderColor: '#0B5CAD',
  },
  dropdownTriggerError: {
    borderColor: '#E53E3E',
  },
  dropdownTriggerDisabled: {
    backgroundColor: '#F4F7FA',
    borderColor: '#E4EBF2',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#173B63',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#8B96A5',
    fontWeight: '400',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 30, 66, 0.4)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    width: '100%',
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBF2',
  },
  dropdownModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173B63',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  calendarNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF6FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173B63',
  },
  weekHeadersRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  weekHeaderCell: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#697788',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 4,
  },
  calendarCellBlank: {
    width: '14.28%',
    height: 40,
  },
  calendarCellSelected: {
    backgroundColor: '#0B5CAD',
  },
  calendarCellDisabled: {
    backgroundColor: 'transparent',
  },
  calendarCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#173B63',
  },
  calendarCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarCellTextDisabled: {
    color: '#BAC4D0',
    textDecorationLine: 'line-through',
  },
});
