type AnyObject = Record<string, any>

export default function replaceBitcoinWithHoney(obj: AnyObject): AnyObject {
  if (obj === null || typeof obj !== 'object') return obj

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/bitcoin/g, 'honey')
      obj[key] = obj[key].replace(/Bitcoin/g, 'Honey')
      obj[key] = obj[key].replace(/Bitcoins/g, 'Honey')
      obj[key] = obj[key].replace(/bitcoins/g, 'honey')
      obj[key] = obj[key].replace(/BTC/g, 'HON')
      obj[key] = obj[key].replace(/btc/g, 'hon')
    } else if (typeof obj[key] === 'object') {
      replaceBitcoinWithHoney(obj[key])
    }
  }

  return obj
}
