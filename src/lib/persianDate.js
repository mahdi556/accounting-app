// src/lib/persianDate.js
import moment from 'moment-jalaali'

moment.loadPersian()

export class PersianDate {
  // تبدیل تاریخ شمسی به میلادی - اصلاح شده
  static toGregorian(persianDate) {
    if (!persianDate) return null
    
    try {
      // اگر رشته شمسی هست (فرمت: 1403/10/15)
      if (typeof persianDate === 'string' && persianDate.includes('/')) {
        const [year, month, day] = persianDate.split('/').map(Number)
        
        // اعتبارسنجی اعداد
        if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
          console.error('Invalid Persian date format:', persianDate)
          return null
        }
        
        // تبدیل با moment-jalaali
        const m = moment(`${year}/${month}/${day}`, 'jYYYY/jMM/jDD')
        if (!m.isValid()) {
          console.error('Invalid Persian date:', persianDate)
          return null
        }
        
        return m.toDate()
      }
      
      // اگر از قبل Date object هست
      if (persianDate instanceof Date) {
        return persianDate
      }
      
      console.error('Unknown date format:', persianDate)
      return null
    } catch (error) {
      console.error('Error converting to Gregorian:', error, 'Input:', persianDate)
      return null
    }
  }

  // تبدیل تاریخ میلادی به شمسی برای نمایش
  static toPersian(date) {
    if (!date) return ''
    try {
      return moment(date).format('jYYYY/jMM/jDD')
    } catch (error) {
      console.error('Error converting to Persian:', error)
      return ''
    }
  }

  // تاریخ امروز به شمسی
  static today() {
    return moment().format('jYYYY/jMM/jDD')
  }

  // تاریخ امروز به میلادی
  static todayGregorian() {
    return moment().toDate()
  }

  // فرمت‌دهی تاریخ
  static format(date, format = 'jYYYY/jMM/jDD') {
    if (!date) return ''
    try {
      return moment(date).format(format)
    } catch (error) {
      console.error('Error formatting date:', error)
      return ''
    }
  }

  // اعتبارسنجی تاریخ
  static isValidDate(date) {
    if (!date) return false
    return moment(date).isValid()
  }
}

export default PersianDate