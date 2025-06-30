////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import extractContentDispositionFilename from '../../src/impl/extract-content-disposition-filename';

describe('extractContentDispositionFilename', () => {
  it('returns the filename when Content-Disposition header contains filename', () => {
    const contentDisposition = 'attachment; filename="example.txt"';
    const result = extractContentDispositionFilename(contentDisposition);
    expect(result).toBe('example.txt');
  });

  it('returns the filename when Content-Disposition header contains filename* with UTF-8 encoding', () => {
    const contentDisposition = "attachment; filename*=UTF-8''example%20file.txt";
    const result = extractContentDispositionFilename(contentDisposition);
    expect(result).toBe('example file.txt');
  });

  it('returns null when Content-Disposition header does not contain filename', () => {
    const contentDisposition = 'attachment';
    const result = extractContentDispositionFilename(contentDisposition);
    expect(result).toBeNull();
  });

  it('returns null when Content-Disposition header is empty', () => {
    const contentDisposition = '';
    const result = extractContentDispositionFilename(contentDisposition);
    expect(result).toBeNull();
  });

  it('returns null when Content-Disposition header is null', () => {
    const result = extractContentDispositionFilename(null);
    expect(result).toBeNull();
  });

  it('returns null when Content-Disposition header is undefined', () => {
    const result = extractContentDispositionFilename(undefined);
    expect(result).toBeNull();
  });

  it('returns the filename when Content-Disposition header contains both filename and filename*', () => {
    const contentDisposition = 'attachment; filename="example.txt"; filename*=UTF-8\'\'example%20file.txt';
    const result = extractContentDispositionFilename(contentDisposition);
    expect(result).toBe('example file.txt');
  });

  it('returns the filename when Content-Disposition header contains filename without quote', () => {
    const contentDisposition = 'attachment; filename=test.json';
    const result = extractContentDispositionFilename(contentDisposition);
    expect(result).toBe('test.json');
  });

  it('returns the filename when Content-Disposition header contains filename with single quote', () => {
    const contentDisposition = 'attachment; filename=\'test.json\'';
    const result = extractContentDispositionFilename(contentDisposition);
    expect(result).toBe('test.json');
  });

  it('returns the filename when Content-Disposition header contains filename with double quote', () => {
    const contentDisposition = 'attachment; filename="test.json"';
    const result = extractContentDispositionFilename(contentDisposition);
    expect(result).toBe('test.json');
  });
});
