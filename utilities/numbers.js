function round(input) {
    return Math.round((input+Number.EPSILON)*100)/100;
}

export { round };