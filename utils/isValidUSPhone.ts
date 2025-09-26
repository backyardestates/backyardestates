export const isValidUSPhone = (phone: string) => {
    // Remove all spaces, parentheses, dots, and dashes for digit count check
    const digitsOnly = phone.replace(/\D/g, '')

    // Must be exactly 10 digits (area code + number) or 11 with leading 1
    if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith('1'))) {
        return true
    }

    return false
}