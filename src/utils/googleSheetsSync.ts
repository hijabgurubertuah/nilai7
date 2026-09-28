/**
 * Helper to parse and fetch Google Sheets CSV export
 */

export interface GoogleSheetsInfo {
  isValid: boolean;
  spreadsheetId?: string;
  gid?: string;
  editUrl?: string;
  csvUrl?: string;
  error?: string;
}

export function parseGoogleSheetsUrl(rawUrl: string): GoogleSheetsInfo {
  const url = rawUrl.trim();
  if (!url) {
    return { isValid: false, error: 'Link Google Spreadsheet tidak boleh kosong.' };
  }

  // Handle direct CSV link (e.g. from any web host or raw github)
  if (url.endsWith('.csv') || url.includes('format=csv') || url.includes('output=csv')) {
    return {
      isValid: true,
      editUrl: url,
      csvUrl: url,
    };
  }

  // Extract spreadsheet ID: docs.google.com/spreadsheets/d/{ID}/...
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch || !idMatch[1]) {
    // If user just pasted the raw spreadsheet ID
    if (/^[a-zA-Z0-9-_]{20,}$/.test(url)) {
      const id = url;
      return {
        isValid: true,
        spreadsheetId: id,
        gid: '0',
        editUrl: `https://docs.google.com/spreadsheets/d/${id}/edit#gid=0`,
        csvUrl: `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=0`,
      };
    }
    return {
      isValid: false,
      error: 'Format link Google Spreadsheet tidak dikenali. Pastikan link diawali dengan docs.google.com/spreadsheets/d/...',
    };
  }

  const spreadsheetId = idMatch[1];

  // Extract GID if present: #gid=12345 or ?gid=12345
  const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch && gidMatch[1] ? gidMatch[1] : '0';

  const editUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}`;
  // Use gviz/tq?tqx=out:csv as it provides standard CORS headers
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

  return {
    isValid: true,
    spreadsheetId,
    gid,
    editUrl,
    csvUrl,
  };
}

/**
 * Fetch CSV text from Google Sheets URL
 */
export async function fetchGoogleSheetCsv(rawUrl: string): Promise<string> {
  const parsed = parseGoogleSheetsUrl(rawUrl);
  if (!parsed.isValid || !parsed.csvUrl) {
    throw new Error(parsed.error || 'Link spreadsheet tidak valid.');
  }

  const urlsToTry = [
    parsed.csvUrl,
    // Fallback export endpoint
    parsed.spreadsheetId
      ? `https://docs.google.com/spreadsheets/d/${parsed.spreadsheetId}/export?format=csv&gid=${parsed.gid || '0'}`
      : parsed.csvUrl,
  ];

  let lastError: any = null;

  for (const targetUrl of urlsToTry) {
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/csv, text/plain, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`Server Google merespon dengan status ${response.status}`);
      }

      const text = await response.text();

      // Check if Google returned an HTML login page instead of CSV
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        throw new Error(
          'Google Spreadsheet belum disetel publik. Silakan buka menu "Bagikan" di Google Spreadsheet Anda, lalu ubah Akses Umum menjadi "Siapa saja yang memiliki link dapat melihat".'
        );
      }

      return text;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw new Error(
    lastError?.message ||
      'Gagal mengambil data dari Google Spreadsheet. Pastikan Spreadsheet disetel publik ("Siapa saja yang memiliki link").'
  );
}
