interface Named {
  firstName: string;
  lastName: string;
}

export const fullName = (person: Named) => `${person.firstName} ${person.lastName}`.trim();

/** "Dupont.J" — last name followed by the first letter of the first name. */
export const shortName = (person: Named) => {
  const lastName = person.lastName.trim();
  const initial = person.firstName.trim().charAt(0).toUpperCase();
  return initial ? `${lastName}.${initial}` : lastName;
};

/**
 * Same label rebuilt from a stored "Prénom Nom" string, for validations saved before
 * the short label existed. The first word is taken as the first name.
 */
export const shortNameFromFull = (full: string) => {
  const [firstName = '', ...rest] = full.trim().split(/\s+/);
  return rest.length > 0 ? shortName({ firstName, lastName: rest.join(' ') }) : firstName;
};

export const initials =(person: Named) =>
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
