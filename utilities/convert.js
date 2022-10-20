function dateToString(input) {
    const offset = input.getTimezoneOffset()
    input = new Date(input.getTime() - (offset*60*1000))
    return input.toISOString().split('T')[0]
}

function gramsToPounds(value) {
    return value/453.59237;
}

export { dateToString, gramsToPounds };