export const toLocalDateOnly = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const toLocalDate = (raw: string | Date): Date => {
  if (raw instanceof Date) return raw;

  const s = String(raw).trim();

  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (br) {
    const [, dd, mm, yyyy] = br;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) {
    const [, yyyy, mm, dd] = iso;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  return new Date(s);
};

export const dateSortKey = (raw: string | Date) => toLocalDate(raw).getTime();

export const formatToBrazilISO = (date: Date) => {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
};
