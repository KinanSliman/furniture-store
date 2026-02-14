/**
 * i18n Helper Functions
 *
 * Utilities for working with multilingual database fields
 */

import type { Locale } from '@/i18n/config';

/**
 * Get localized field value from an object
 *
 * Automatically selects the correct language-specific field based on current locale
 * Falls back to English if the requested language is not available
 *
 * @param item - Object containing multilingual fields
 * @param field - Base field name (e.g., 'name', 'description')
 * @param locale - Current locale ('en' or 'ar')
 * @returns Localized value or empty string
 *
 * @example
 * const product = {
 *   name: 'Laptop',
 *   nameEn: 'Laptop',
 *   nameAr: 'لابتوب'
 * };
 * getLocalizedField(product, 'name', 'ar'); // Returns: 'لابتوب'
 * getLocalizedField(product, 'name', 'en'); // Returns: 'Laptop'
 */
export function getLocalizedField<T extends Record<string, any>>(
  item: T,
  field: string,
  locale: Locale
): string {
  if (!item) return '';

  // Build the localized field name (e.g., 'nameEn', 'nameAr')
  const suffix = locale === 'ar' ? 'Ar' : 'En';
  const localizedFieldName = `${field}${suffix}` as keyof T;

  // Try to get the localized value
  const localizedValue = item[localizedFieldName];

  // If localized value exists, return it
  if (localizedValue && typeof localizedValue === 'string') {
    return localizedValue;
  }

  // Fallback 1: Try English version
  const englishFieldName = `${field}En` as keyof T;
  const englishValue = item[englishFieldName];
  if (englishValue && typeof englishValue === 'string') {
    return englishValue;
  }

  // Fallback 2: Try the base field (legacy data)
  const baseValue = item[field as keyof T];
  if (baseValue && typeof baseValue === 'string') {
    return baseValue;
  }

  // No value found
  return '';
}

/**
 * Get all localized versions of a field
 *
 * Returns an object with both English and Arabic versions
 *
 * @param item - Object containing multilingual fields
 * @param field - Base field name
 * @returns Object with en and ar properties
 *
 * @example
 * getAllLocalizedVersions(product, 'name');
 * // Returns: { en: 'Laptop', ar: 'لابتوب' }
 */
export function getAllLocalizedVersions<T extends Record<string, any>>(
  item: T,
  field: string
): { en: string; ar: string } {
  return {
    en: getLocalizedField(item, field, 'en'),
    ar: getLocalizedField(item, field, 'ar'),
  };
}

/**
 * Check if an item has translation for a specific locale
 *
 * @param item - Object containing multilingual fields
 * @param field - Base field name
 * @param locale - Locale to check
 * @returns true if translation exists
 */
export function hasTranslation<T extends Record<string, any>>(
  item: T,
  field: string,
  locale: Locale
): boolean {
  const suffix = locale === 'ar' ? 'Ar' : 'En';
  const localizedFieldName = `${field}${suffix}` as keyof T;
  const value = item[localizedFieldName];

  return Boolean(value && typeof value === 'string' && value.trim().length > 0);
}

/**
 * Prepare multilingual data for database insertion/update
 *
 * Converts form data with separate language fields into database format
 *
 * @param data - Form data with language-specific fields
 * @returns Database-ready object
 *
 * @example
 * const formData = {
 *   nameEn: 'Laptop',
 *   nameAr: 'لابتوب',
 *   descriptionEn: 'A powerful laptop',
 *   descriptionAr: 'لابتوب قوي'
 * };
 * prepareMultilingualData(formData);
 * // Returns: Same object, ready for database insertion
 */
export function prepareMultilingualData(data: Record<string, any>): Record<string, any> {
  const prepared: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Only include defined values (skip null/undefined)
    if (value !== null && value !== undefined) {
      prepared[key] = value;
    }
  }

  return prepared;
}

/**
 * Migrate legacy single-language data to multilingual format
 *
 * Copies data from legacy fields (name, description) to language-specific fields (nameEn, nameAr)
 * Useful for migrating existing data
 *
 * @param item - Object with legacy fields
 * @param targetLocale - Locale to assign legacy data to (default: 'en')
 * @returns Object with multilingual fields populated
 *
 * @example
 * const legacy = { name: 'Laptop', description: 'A laptop' };
 * migrateLegacyData(legacy);
 * // Returns: { nameEn: 'Laptop', descriptionEn: 'A laptop', ... }
 */
export function migrateLegacyData(
  item: Record<string, any>,
  targetLocale: Locale = 'en'
): Record<string, any> {
  const migrated: Record<string, any> = { ...item };
  const suffix = targetLocale === 'ar' ? 'Ar' : 'En';

  // List of fields to migrate
  const fieldsToMigrate = [
    'name',
    'description',
    'shortDescription',
    'metaTitle',
    'metaDescription',
  ];

  for (const field of fieldsToMigrate) {
    if (item[field]) {
      const targetField = `${field}${suffix}`;
      // Only set if target field doesn't already have a value
      if (!migrated[targetField]) {
        migrated[targetField] = item[field];
      }
    }
  }

  return migrated;
}

/**
 * Validate that at least one language version exists for required fields
 *
 * @param data - Object to validate
 * @param requiredFields - Array of field names that must have at least one translation
 * @returns Object with validation result
 *
 * @example
 * validateMultilingualData({ nameEn: 'Laptop' }, ['name']);
 * // Returns: { valid: true, missingFields: [] }
 *
 * validateMultilingualData({ descriptionEn: 'Test' }, ['name']);
 * // Returns: { valid: false, missingFields: ['name'] }
 */
export function validateMultilingualData(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const enField = `${field}En`;
    const arField = `${field}Ar`;
    const legacyField = field;

    const hasEnglish = data[enField] && String(data[enField]).trim().length > 0;
    const hasArabic = data[arField] && String(data[arField]).trim().length > 0;
    const hasLegacy = data[legacyField] && String(data[legacyField]).trim().length > 0;

    // At least one version must exist
    if (!hasEnglish && !hasArabic && !hasLegacy) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
