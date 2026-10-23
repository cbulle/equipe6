interface Named {
  firstName: string;
  lastName: string;
}

export const fullName = (person: Named) => `${person.firstName} ${person.lastName}`.trim();

export const initials = (person: Named) =>
  `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();

export const compareByName = (first: Named, second: Named) =>
  first.lastName.localeCompare(second.lastName, 'fr') || first.firstName.localeCompare(second.firstName, 'fr');

export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const matchesSearch = (search: string, ...values: (string | null | undefined)[]) => {
  const needle = normalizeSearch(search);
  return needle === '' || values.some((value) => value && normalizeSearch(value).includes(needle));
};
