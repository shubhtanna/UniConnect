export function matchesImageSignature(buffer: Buffer, contentType: string) {
  if (contentType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (contentType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (contentType === "image/webp") return buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  if (contentType === "image/gif") return ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString());
  return false;
}

export function matchesResumeSignature(buffer: Buffer, contentType: string) {
  if (contentType === "application/pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  if (contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  }
  return false;
}
