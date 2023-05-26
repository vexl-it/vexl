// Generated with chatGPT no time to fix types & ts errors
export type JSONObject = Record<string, any>

export function flattenObject(
  object: JSONObject,
  parentPrefix = ''
): JSONObject {
  let flatObject: JSONObject = {}

  for (const key in object) {
    if (
      typeof object[key] === 'object' &&
      object[key] !== null &&
      !Array.isArray(object[key])
    ) {
      const newPrefix = parentPrefix ? `${parentPrefix}.${key}` : key
      const flatSubObject = flattenObject(object[key], newPrefix)

      flatObject = {...flatObject, ...flatSubObject}
    } else {
      const prefixedKey = parentPrefix ? `${parentPrefix}.${key}` : key
      flatObject[prefixedKey] = object[key]
    }
  }

  return flatObject
}

export function unflattenObject(flattenedObject: JSONObject): JSONObject {
  const result: JSONObject = {}

  const recurse = (
    curr: JSONObject,
    prop: string | string[],
    value: any
  ): any => {
    if (!Array.isArray(prop)) {
      prop = prop.toString().split('.')
    }

    if (prop.length > 1) {
      const e = prop.shift()
      // @ts-expect-error Feel free to fix this. No time now. It works :)
      if (!curr[e] || typeof curr[e] !== 'object') curr[e] = {}
      // @ts-expect-error Feel free to fix this. No time now. It works :)
      recurse(curr[e], prop, value)
    } else {
      curr[prop[0]] = value
    }
  }

  for (const key in flattenedObject) {
    recurse(result, key, flattenedObject[key])
  }

  return result
}
