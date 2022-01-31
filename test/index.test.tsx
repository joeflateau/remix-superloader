import { createSuperLoader, mapType } from '../src/index';

describe('to/fromSuper', () => {
  it('converts json-unrepresentable values back and forth', () => {
    const { toSuper, fromSuper } = createSuperLoader(async () => ({}));

    const asSuper = toSuper({
      date: new Date(0),
      regex: /foo/i,
      set: new Set(['foo', 'bar']),
      map: new Map([
        ['foo1', 'bar1'],
        ['foo2', 'bar2'],
      ]),
      bigint: BigInt(123),
      null: null,
    });

    expect(asSuper.date).toHaveProperty(
      '$rsl$Date',
      '1970-01-01T00:00:00.000Z'
    );
    expect(asSuper.regex).toHaveProperty('$rsl$RegExp', ['foo', 'i']);
    expect(asSuper.set).toHaveProperty('$rsl$Set', ['foo', 'bar']);
    expect(asSuper.map).toHaveProperty('$rsl$Map', [
      ['foo1', 'bar1'],
      ['foo2', 'bar2'],
    ]);
    expect(asSuper.bigint).toHaveProperty('$rsl$bigint', '123');

    const asPlain = fromSuper(asSuper);

    expect(asPlain).toHaveProperty('date', new Date(0));
    expect(asPlain).toHaveProperty('regex', /foo/i);
    expect(asPlain).toHaveProperty('set', new Set(['foo', 'bar']));
    expect(asPlain).toHaveProperty(
      'map',
      new Map([
        ['foo1', 'bar1'],
        ['foo2', 'bar2'],
      ])
    );
    expect(asPlain).toHaveProperty('bigint', BigInt(123));
  });

  it('custom converters', () => {
    const { toSuper, fromSuper } = createSuperLoader(
      async () => ({}),
      [
        mapType(
          Date,
          (date) => date.getTime(),
          (timestamp) => new Date(timestamp)
        ),
      ]
    );

    const asSuper = toSuper({
      date: new Date(0),
    });

    expect(asSuper.date).toHaveProperty('$rsl$Date', 0);

    const asPlain = fromSuper(asSuper);

    expect(asPlain).toHaveProperty('date', new Date(0));
  });
});
