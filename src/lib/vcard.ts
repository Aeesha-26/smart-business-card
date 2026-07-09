/**
 * Generates a vCard 3.0 string from card data and triggers a download.
 */

interface VCardData {
  name: string;
  job_title?: string | null;
  organization?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
}

function escapeVCard(str: string): string {
  return str.replace(/[\\;,]/g, (match) => `\\${match}`).replace(/\n/g, "\\n");
}

export function generateVCardString(data: VCardData): string {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(data.name)}`,
  ];

  // Parse name parts
  const nameParts = data.name.trim().split(/\s+/);
  const lastName = nameParts.length > 1 ? nameParts.pop()! : "";
  const firstName = nameParts.join(" ");
  lines.push(`N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`);

  if (data.organization) {
    lines.push(`ORG:${escapeVCard(data.organization)}`);
  }
  if (data.job_title) {
    lines.push(`TITLE:${escapeVCard(data.job_title)}`);
  }
  if (data.phone) {
    lines.push(`TEL;TYPE=CELL:${data.phone}`);
  }
  if (data.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
  }
  if (data.website) {
    lines.push(`URL:${data.website}`);
  }
  if (data.address) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCard(data.address)};;;;`);
  }
  if (data.linkedin_url) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${data.linkedin_url}`);
  }
  if (data.instagram_url) {
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:${data.instagram_url}`);
  }
  if (data.twitter_url) {
    lines.push(`X-SOCIALPROFILE;TYPE=twitter:${data.twitter_url}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function downloadVCard(data: VCardData): void {
  const vcardStr = generateVCardString(data);
  const blob = new Blob([vcardStr], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.name.replace(/\s+/g, "_")}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
