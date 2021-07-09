const findItems =  {
    firstOne : (q) => {
        return [
            {
                name: Object.keys(q).map(item=>`&${item}=${q[item]}`.split(' ').join('+')).join('')
            }
        ]
    }
}
module.exports = findItems