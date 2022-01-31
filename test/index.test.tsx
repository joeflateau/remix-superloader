import { fromSuper, toSuper } from '../src/index';

describe('to/fromSuper', () => {
  it('converts date back and forth', () => {
    const asSuper = toSuper({ date: new Date(0), regex: /foo/i });
    expect(asSuper.date).toHaveProperty('$date', '1970-01-01T00:00:00.000Z');
    expect(asSuper.regex).toHaveProperty('$regex', ['foo', 'i']);
    const asPlain = fromSuper(asSuper);
    expect(asPlain).toHaveProperty('date', new Date(0));
    expect(asPlain).toHaveProperty('regex', /foo/i);
  });
});
