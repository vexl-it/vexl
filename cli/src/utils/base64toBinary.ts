export default function base64toBinary(base64: string): Buffer {
    return Buffer.from(base64, 'base64')
}
