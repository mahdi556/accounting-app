// src/components/ui/PersianDatePicker.jsx
'use client'
import { useState, useEffect } from 'react'
import DatePicker from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import { PersianDate } from '@lib/persianDate'

const PersianDatePicker = ({
  selected,
  onChange,
  placeholder = 'تاریخ را انتخاب کنید',
  minDate,
  maxDate,
  isClearable = true,
  className = '',
  disabled = false,
  ...props
}) => {
  const [internalDate, setInternalDate] = useState(null)

  useEffect(() => {
    // اگر selected وجود دارد و معتبر است
    if (selected && !isNaN(new Date(selected).getTime())) {
      setInternalDate(new Date(selected))
    } else {
      // تاریخ پیش‌فرض امروز
      setInternalDate(PersianDate.todayGregorian())
    }
  }, [selected])

  const handleChange = (date) => {
    if (date) {
      const gregorianDate = date.toDate()
      console.log('📅 تاریخ انتخاب شده:', {
        persian: PersianDate.toPersian(gregorianDate),
        gregorian: gregorianDate,
        isValid: !isNaN(gregorianDate.getTime())
      })
      
      setInternalDate(gregorianDate)
      onChange(gregorianDate)
    } else {
      setInternalDate(null)
      onChange(null)
    }
  }

  return (
    <DatePicker
      value={internalDate}
      onChange={handleChange}
      calendar={persian}
      locale={persian_fa}
      calendarPosition="bottom-right"
      inputClass={`form-control ${className}`}
      placeholder={placeholder}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      format="YYYY/MM/DD"
      {...props}
    />
  )
}

export default PersianDatePicker