// src/components/ui/PersianDateRangePicker.jsx
'use client'
import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { PersianDate } from '@lib/persianDate'
import moment from 'moment-jalaali' // اضافه کردن این import
import 'react-datepicker/dist/react-datepicker.css'

const PersianDateRangePicker = ({
  startDate,
  endDate,
  onChange,
  placeholder = 'بازه زمانی را انتخاب کنید',
  className = '',
  disabled = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (dates) => {
    const [start, end] = dates
    onChange({ startDate: start, endDate: end })
  }

  const formatDate = (date) => {
    if (!date) return ''
    return PersianDate.format(date, 'jYYYY/jMM/jDD')
  }

  const getDisplayValue = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    }
    return ''
  }

  const CustomInput = ({ value, onClick, onChange, ...props }) => (
    <div className="position-relative">
      <input
        type="text"
        className={`form-control ${className}`}
        onClick={onClick}
        value={getDisplayValue()}
        onChange={onChange}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        {...props}
      />
      <span className="position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
        📅
      </span>
    </div>
  )

  return (
    <DatePicker
      selected={startDate}
      onChange={handleChange}
      startDate={startDate}
      endDate={endDate}
      selectsRange
      customInput={<CustomInput />}
      disabled={disabled}
      popperClassName="persian-datepicker-popper"
      renderCustomHeader={({
        date,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => {
        const persianDate = moment(date)
        const year = persianDate.jYear()
        const month = persianDate.jMonth() + 1
        const monthName = PersianDate.getMonthName(month)

        return (
          <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-light">
            <button
              type="button"
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              className="btn btn-sm btn-outline-secondary"
            >
              ‹
            </button>
            <div className="fw-bold">
              {monthName} {year}
            </div>
            <button
              type="button"
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              className="btn btn-sm btn-outline-secondary"
            >
              ›
            </button>
          </div>
        )
      }}
      {...props}
    />
  )
}

export default PersianDateRangePicker